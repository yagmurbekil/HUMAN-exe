"""Python test oracle for the differential (parity) test (spec.md AE9).

    python tests/parite.py            # write tests/parite.json from model/model.onnx
    python tests/parite.py --kontrol  # check the stored references still match the model

The JSON is the reference the app (Cypress `data-cy="p"`) and the server (`/api/risk`) are compared
against with tolerance 1e-4.
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

ROOT = Path(__file__).resolve().parent.parent
TOLERANCE = 1e-4
CASES = [
    ("hizli_ilk_karar", dict(seviye=0, karar_no=1, karar_suresi_sn=3, kart_orani=0.25, tutor_acildi=0,
                             ipucu_sayisi=0, onceki_riskli=0, onceki_uyumsuz=0)),
    ("dikkatli_ilk_karar", dict(seviye=0, karar_no=1, karar_suresi_sn=60, kart_orani=1, tutor_acildi=1,
                                ipucu_sayisi=2, onceki_riskli=0, onceki_uyumsuz=0)),
    ("riskli_gecmis_d2", dict(seviye=1, karar_no=2, karar_suresi_sn=2.5, kart_orani=0.25, tutor_acildi=0,
                              ipucu_sayisi=0, onceki_riskli=1, onceki_uyumsuz=1)),
    ("kismi_inceleme_d2", dict(seviye=2, karar_no=2, karar_suresi_sn=21.4, kart_orani=0.5, tutor_acildi=0,
                               ipucu_sayisi=0, onceki_riskli=0, onceki_uyumsuz=0)),
    ("riskli_gecmis_d3", dict(seviye=0, karar_no=3, karar_suresi_sn=7.7, kart_orani=0.667, tutor_acildi=1,
                              ipucu_sayisi=1, onceki_riskli=2, onceki_uyumsuz=2)),
]


def predict(session: ort.InferenceSession, features: list[str], inputs: dict) -> float:
    vector = np.array([[inputs[name] for name in features]], dtype=np.float32)
    return float(session.run(["probabilities"], {"input": vector})[0][0, 1])


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kontrol", action="store_true")
    args = parser.parse_args()

    config = json.loads((ROOT / "model/config.json").read_text(encoding="utf-8"))
    session = ort.InferenceSession(str(ROOT / "model/model.onnx"), providers=["CPUExecutionProvider"])
    path = ROOT / "tests/parite.json"

    if args.kontrol:
        reference = json.loads(path.read_text(encoding="utf-8"))
        worst = max(abs(predict(session, config["features"], c["girdi"]) - c["p_python"]) for c in reference["vakalar"])
        print(f"En buyuk fark: {worst:.2e} (tolerans {TOLERANCE})")
        return 0 if worst < TOLERANCE else 1

    cases = [{"ad": name, "girdi": inputs, "p_python": round(predict(session, config["features"], inputs), 8)}
             for name, inputs in CASES]
    path.write_text(json.dumps({"tolerans": TOLERANCE, "kaynak": "tests/parite.py (onnxruntime)", "vakalar": cases},
                               indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for case in cases:
        print(f"{case['ad']:<22} p={case['p_python']:.8f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
