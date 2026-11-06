"""AE10: train.py gates (spec.md §12.4).

    python tests/eval_kapisi.py

Every run writes to a temporary folder, so this test never touches model/.
"""

import json
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
failures = 0


def run_train(*extra: str) -> tuple[int, Path]:
    out = Path(tempfile.mkdtemp())
    result = subprocess.run(
        [sys.executable, str(ROOT / "train.py"), "--cikti", str(out), *extra],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
    )
    return result.returncode, out


def report(out: Path) -> dict:
    return json.loads((out / "eval_raporu.json").read_text(encoding="utf-8"))


def check(passed: bool, name: str):
    global failures
    failures += not passed
    print(f"{'PASS' if passed else 'FAIL'}: {name}")


def main() -> int:
    code, out = run_train()
    check(code != 0 and not (out / "model.onnx").exists(), f"gercek veri yoksa uretim modu durur (cikis {code})")
    check(report(out)["gercek_veri_kapisi"] is False and report(out)["gercek_oturum"] == 0,
          "rapor 0 gercek oturum ve kapali kapi gosterir")

    code, out = run_train("--sentetik-prototip", "--auc-esik", "0.999")
    check(code != 0 and not (out / "model.onnx").exists(), f"prototip modu teknik kapiyi atlayamaz (cikis {code})")

    code_a, first = run_train("--sentetik-prototip")
    gate_open = all(report(first)["teknik_kapi"].values())
    check((code_a == 0) == gate_open and (first / "model.onnx").exists() == gate_open,
          f"prototip cikis kodu ve model teknik kapiyla tutarli (kapi {'acik' if gate_open else 'kapali'}, cikis {code_a})")
    check(report(first)["oturum_kesisimi"] == 0, "egitim ve test oturumlari kesismiyor")

    if gate_open:
        config = json.loads((first / "config.json").read_text(encoding="utf-8"))
        check(config["durum"] == "sentetik-prototip" and config["gercek_veri_kapisi"] is False
              and config["gercek_oturum"] == 0 and config["version"].endswith("-prototip"),
              "prototip config gercek veri gecmis gibi gorunmuyor")
        check("secim_degisikligi" not in config["features"], "secim_degisikligi model girdisi degil")

    code_b, second = run_train("--sentetik-prototip")
    same = (first / "eval_raporu.json").read_bytes() == (second / "eval_raporu.json").read_bytes()
    if gate_open:
        same = same and (first / "model.onnx").read_bytes() == (second / "model.onnx").read_bytes()
    check(code_a == code_b and same, "ayni veri ve tohumla sonuc bayt bayt ayni")

    # A fixture with 15 sessions marked real must open the data gate. Only used in a temp folder.
    data = pd.read_csv(ROOT / "data/oturumlar.csv")
    sessions = data["oturum_id"].unique()[:15]
    fixture = data.copy()
    fixture.loc[fixture["oturum_id"].isin(sessions), "kaynak"] = "gercek"
    path = Path(tempfile.mkdtemp()) / "fikstur.csv"
    fixture.to_csv(path, index=False)
    _, out = run_train("--veri", str(path))
    check(report(out)["gercek_veri_kapisi"] is True, "15 gercek oturumlu fiksturde veri kapisi acilir")

    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
