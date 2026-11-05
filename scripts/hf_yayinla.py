"""Publish model/ to the public Hugging Face repo and print the commit to pin.

    .venv/Scripts/hf auth login              # once, with a Write token, in your own terminal
    .venv/Scripts/python scripts/hf_yayinla.py

Refuses to publish unless the eval gate passed. Prints the pinned URL and writes the commit into
RELEASE.md and src/utils/riskModel.ts.
"""

import json
import re
import sys
from pathlib import Path

from huggingface_hub import HfApi

REPO = "yagmurbekil/human-exe-blind-accept-onnx"
ROOT = Path(__file__).resolve().parent.parent
FILES = ["model.onnx", "config.json", "README.md"]


def main() -> int:
    model_dir = ROOT / "model"
    config = json.loads((model_dir / "config.json").read_text(encoding="utf-8"))
    if not all(config["acceptance"].values()):
        print("Eval kapisi gecilmemis; yayinlanmadi.", file=sys.stderr)
        return 1

    api = HfApi()
    api.create_repo(REPO, repo_type="model", exist_ok=True, private=False)
    commit = None
    for name in FILES:
        commit = api.upload_file(
            path_or_fileobj=str(model_dir / name),
            path_in_repo=name,
            repo_id=REPO,
            commit_message=f"v{config['version']}: {name}",
        ).oid

    release = ROOT / "RELEASE.md"
    release.write_text(release.read_text(encoding="utf-8").replace("HF_COMMIT_BEKLIYOR", commit), encoding="utf-8")
    source = ROOT / "src/utils/riskModel.ts"
    source.write_text(
        re.sub(r"export const HF_COMMIT = '[^']*';", f"export const HF_COMMIT = '{commit}';",
               source.read_text(encoding="utf-8")),
        encoding="utf-8",
    )
    print(f"Commit: {commit}")
    print(f"https://huggingface.co/{REPO}/resolve/{commit}/model.onnx")
    return 0


if __name__ == "__main__":
    sys.exit(main())
