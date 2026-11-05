"""AE10: train.py must stop with a non-zero exit code and write no model when the gate fails.

    python tests/eval_kapisi.py
"""

import subprocess
import sys
import tempfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent


def run_train(*extra: str) -> tuple[int, Path]:
    out = Path(tempfile.mkdtemp())
    result = subprocess.run(
        [sys.executable, str(ROOT / "train.py"), "--cikti", str(out), *extra],
        cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
    )
    return result.returncode, out


def main() -> int:
    failures = 0

    code, out = run_train("--auc-esik", "0.999")
    passed = code != 0 and not (out / "model.onnx").exists()
    print(f"{'PASS' if passed else 'FAIL'}: AUC esigi gecilemezse durur (cikis {code})")
    failures += not passed

    data = pd.read_csv(ROOT / "data/oturumlar.csv")
    keep = data[data["kaynak"] == "gercek"]["oturum_id"].unique()[:14]
    few = data[(data["kaynak"] == "sentetik") | data["oturum_id"].isin(keep)]
    few_path = Path(tempfile.mkdtemp()) / "az.csv"
    few.to_csv(few_path, index=False)
    code, out = run_train("--veri", str(few_path))
    passed = code != 0 and not (out / "model.onnx").exists()
    print(f"{'PASS' if passed else 'FAIL'}: 15'ten az gercek oturumla durur (cikis {code})")
    failures += not passed

    code, out = run_train()
    passed = code == 0 and (out / "model.onnx").exists()
    print(f"{'PASS' if passed else 'FAIL'}: kurallar saglaninca model yazilir (cikis {code})")
    failures += not passed

    first = (ROOT / "model/model.onnx").read_bytes()
    passed = (out / "model.onnx").read_bytes() == first
    print(f"{'PASS' if passed else 'FAIL'}: ayni veri ve tohumla model birebir ayni")
    failures += not passed
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
