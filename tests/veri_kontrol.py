"""Data rules for data/oturumlar.csv (spec.md §12.3).

    python tests/veri_kontrol.py
"""

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CSV = ROOT / "data/oturumlar.csv"
MANUAL = "manuel-rastgele"
ALGORITHMIC = "algoritmik-sentetik"


def main() -> int:
    data = pd.read_csv(CSV)
    manual = data[data["uretim_turu"] == MANUAL]
    algorithmic = data[data["uretim_turu"] == ALGORITHMIC]

    checks = {
        "hic gercek satir yok": (data["kaynak"] == "gercek").sum() == 0,
        "tum satirlar sentetik": (data["kaynak"] == "sentetik").all(),
        "225 satir, 75 oturum": len(data) == 225 and data["oturum_id"].nunique() == 75,
        "45 manuel, 15 oturum": len(manual) == 45 and manual["oturum_id"].nunique() == 15,
        "180 algoritmik, 60 oturum": len(algorithmic) == 180 and algorithmic["oturum_id"].nunique() == 60,
        "uretim_turu yalniz iki deger": set(data["uretim_turu"]) == {MANUAL, ALGORITHMIC},
        "her oturum 3 karar": (data.groupby("oturum_id")["karar_no"].nunique() == 3).all(),
        "oturum+karar tekil": not data.duplicated(["oturum_id", "karar_id"]).any(),
        "bos deger yok": not data.isna().any().any(),
    }

    with tempfile.TemporaryDirectory() as folder:
        copy = Path(folder) / "oturumlar.csv"
        shutil.copy(CSV, copy)
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/veri_uret.py"), "--veri", str(copy)],
            capture_output=True, text=True, encoding="utf-8",
        )
        original = CSV.read_bytes().replace(b"\r\n", b"\n")
        checks["uretici dosyayi degistirmiyor (tohum 20261106)"] = (
            result.returncode == 0 and copy.read_bytes().replace(b"\r\n", b"\n") == original
        )

    for name, passed in checks.items():
        print(f"{'PASS' if passed else 'FAIL'}: {name}")
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
