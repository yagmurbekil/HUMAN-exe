"""Append reproducible synthetic sessions to data/oturumlar.csv (spec.md §12.3).

Why synthetic rows are needed: the 15 real sessions were clicked through quickly, so almost no
evidence card was opened (`kart_orani` has no variation). A model cannot learn "opening the
evidence lowers the risk" from them. The generator encodes that hypothesis explicitly; it is an
assumption about behaviour, not a measurement.

Rule (seed 20261106, 60 sessions = 180 rows):
  dikkat ~ Beta(2, 2) per player
  cards opened = 1 + Binomial(total - 1, dikkat); kart_orani = opened / total
  karar_suresi_sn ~ LogNormal(log(4 + 45 * kart_orani), 0.45)
  tutor_acildi ~ Bernoulli(0.10 + 0.50 * dikkat); ipucu_sayisi ~ Uniform{0..max} when tutor is open
  secim_degisikligi ~ Bernoulli(0.10 + 0.20 * dikkat)
  logit P(risky) = 1.6 - 3.2 * kart_orani - 0.03 * min(sure, 60) - 0.8 * tutor - 0.3 * ipucu
                   + 0.7 * onceki_riskli + 0.4 * onceki_uyumsuz
  misaligned justification ~ Bernoulli(0.2 + 0.5 * risky)

Re-running replaces earlier synthetic rows and never touches `kaynak=gercek` rows.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 20261106
CARDS = {1: 4, 2: 4, 3: 3}
MAX_HINTS = {0: 3, 1: 2, 2: 1}
VERSION = "sentetik-1"


def session(rng: np.random.Generator) -> list[dict]:
    session_id = rng.bytes(6).hex()
    level = int(rng.integers(0, 3))
    attention = rng.beta(2, 2)
    prior_risky = prior_misaligned = 0
    rows = []
    for number, total in CARDS.items():
        opened = 1 + rng.binomial(total - 1, attention)
        ratio = opened / total
        duration = float(rng.lognormal(np.log(4 + 45 * ratio), 0.45))
        tutor = int(rng.random() < 0.10 + 0.50 * attention)
        hints = int(rng.integers(0, MAX_HINTS[level] + 1)) if tutor else 0
        changes = int(rng.random() < 0.10 + 0.20 * attention)
        logit = (
            1.6 - 3.2 * ratio - 0.03 * min(duration, 60) - 0.8 * tutor - 0.3 * hints
            + 0.7 * prior_risky + 0.4 * prior_misaligned
        )
        risky = int(rng.random() < 1 / (1 + np.exp(-logit)))
        rows.append({
            "oturum_id": session_id,
            "karar_id": f"D{number}",
            "seviye": level,
            "karar_no": number,
            "karar_suresi_sn": round(duration, 1),
            "kart_orani": round(ratio, 3),
            "tutor_acildi": tutor,
            "ipucu_sayisi": hints,
            "secim_degisikligi": changes,
            "onceki_riskli": prior_risky,
            "onceki_uyumsuz": prior_misaligned,
            "riskli_secim": risky,
            "kaynak": "sentetik",
            "uygulama_surumu": VERSION,
        })
        prior_risky += risky
        prior_misaligned += int(rng.random() < 0.2 + 0.5 * risky)
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--veri", default="data/oturumlar.csv")
    parser.add_argument("--oturum", type=int, default=60)
    parser.add_argument("--tohum", type=int, default=SEED)
    args = parser.parse_args()

    path = Path(args.veri)
    data = pd.read_csv(path)
    real = data[data["kaynak"] == "gercek"]
    rng = np.random.default_rng(args.tohum)
    synthetic = pd.DataFrame([r for _ in range(args.oturum) for r in session(rng)], columns=data.columns)
    pd.concat([real, synthetic], ignore_index=True).to_csv(path, index=False, lineterminator="\n")
    print(f"{path}: {len(real)} gercek + {len(synthetic)} sentetik satir; riskli orani (sentetik) "
          f"{synthetic['riskli_secim'].mean():.3f}")


if __name__ == "__main__":
    main()
