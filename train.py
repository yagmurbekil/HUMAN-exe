"""Train, gate and package the blind-acceptance model (spec.md §12).

    python train.py

Writes model/{model.onnx, config.json, README.md, eval_raporu.json} and the copy the app serves
from public/model/. If any acceptance rule fails the script exits with code 1, removes model.onnx
and publishes nothing. Thresholds below are the ones fixed in spec.md §12.4 before training.
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
import pandas as pd
import sklearn
from skl2onnx import to_onnx
from skl2onnx.common.data_types import FloatTensorType
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, recall_score, roc_auc_score
from sklearn.model_selection import GroupKFold, cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
VERSION = "2.0.0"
FEATURES = [
    "seviye", "karar_no", "karar_suresi_sn", "kart_orani", "tutor_acildi",
    "ipucu_sayisi", "secim_degisikligi", "onceki_riskli", "onceki_uyumsuz",
]
TARGET = "riskli_secim"
MIN_REAL_SESSIONS = 15
AUC_GATE = 0.70
RECALL_GATE = 0.60
DECISION_THRESHOLD = 0.5
ONNX_TOLERANCE = 1e-4


def build_model() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        # class_weight added after the first run failed the recall gate (0.5238): see RELEASE.md
        ("lr", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=SEED)),
    ])


def score(y_true, proba) -> dict:
    predicted = (proba >= DECISION_THRESHOLD).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y_true, proba)), 4),
        "recall_riskli": round(float(recall_score(y_true, predicted)), 4),
        "dengeli_dogruluk": round(float(balanced_accuracy_score(y_true, predicted)), 4),
    }


def session_cv_auc(data: pd.DataFrame) -> float:
    """5-fold AUC where a session is never on both sides, so history features cannot leak."""
    proba = cross_val_predict(
        build_model(), data[FEATURES], data[TARGET], groups=data["oturum_id"],
        cv=GroupKFold(n_splits=5), method="predict_proba",
    )[:, 1]
    return round(float(roc_auc_score(data[TARGET], proba)), 4)


def export_onnx(model: Pipeline, sample: pd.DataFrame, path: Path) -> float:
    onnx_model = to_onnx(
        model,
        initial_types=[("input", FloatTensorType([None, len(FEATURES)]))],
        target_opset=17,
        options={id(model.named_steps["lr"]): {"zipmap": False}},
    )
    path.write_bytes(onnx_model.SerializeToString())
    session = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    output_name = session.get_outputs()[1].name
    onnx_proba = session.run([output_name], {"input": sample.to_numpy(dtype=np.float32)})[0][:, 1]
    return float(np.abs(onnx_proba - model.predict_proba(sample)[:, 1]).max())


MODEL_CARD = """---
license: mit
library_name: onnx
tags: [tabular-classification, sklearn, education]
---

# human-exe-blind-accept-onnx (v{version})

## Amaç
HUMAN.exe oyununda oyuncu `Kararı Onayla`ya bastığında, davranışına bakarak seçiminin riskli olma
olasılığını (`p_kor_onay`) tahmin eder. `p >= {threshold}` ise oyun `DOGRULA.dlg` penceresini açar.
Seçilen seçenek modele girdi değildir. Eğitim amaçlıdır.

## Model
`StandardScaler` + `LogisticRegression` (scikit-learn {sklearn}, `random_state={seed}`) → ONNX.
Girdi: `input`, float32, `[N, {n_features}]`. Çıktı: `probabilities`, `[N, 2]`, indeks 1 riskli sınıftır.
Özellik sırası `config.json` içindedir; tanımlar: `data/SOZLUK.md`.

## Veri
- {real_rows} satır / {real_sessions} oturum `kaynak=gercek`, {synthetic_rows} satır / {synthetic_sessions} oturum `kaynak=sentetik`.
- **Gerçek satırların sınırı:** 15 oturumun tamamı tek kişi (geliştirici) tarafından, hızlı ve
  rastgele cevaplarla oynandı; 3 farklı oyuncu hedefi karşılanmadı. Bu satırlar gerçek kullanıcı
  davranışını temsil etmez. Neredeyse hiç kanıt kartı açılmadığı için `kart_orani` bu satırlarda
  değişmez, `ipucu_sayisi` hep 0'dır.
- **Sentetik satırlar** `scripts/veri_uret.py` (tohum 20261106) ile bir varsayımdan üretildi:
  "kanıt inceleyen ve zaman ayıran oyuncu daha az riskli seçer". Model bu varsayımı öğrenir.

## Metrikler (kabul: ROC-AUC >= {auc_gate}, recall >= {recall_gate}, dengeli doğruluk > 0.5)
| Ölçüm | Değer |
|---|---|
| Test kümesi (%30, gerçek + sentetik) ROC-AUC | {auc} |
| Test kümesi recall (riskli) | {recall} |
| Test kümesi dengeli doğruluk | {balanced} |
| Oturum bazlı 5 katlı CV ROC-AUC (tüm veri) | {cv} |
| Yalnız gerçek satırlarla eğitilen modelin oturum bazlı CV ROC-AUC'si | {cv_real} |
| Test kümesindeki gerçek satırlar ({real_test} satır) ROC-AUC | {real_auc} |
| ONNX ↔ sklearn en büyük fark | {onnx_diff:.2e} |

Karışık test skoru büyük ölçüde sentetik kuralın geri bulunmasını gösterir; gerçek oyuncu üzerinde
geçerlilik kanıtı değildir. Gerçek satır sayısı küçük olduğundan o satırlardaki skorlar güvenilir değildir.

## Sınırlar
- Tek senaryo, üç karar için üretilmiştir; başka oyuna veya senaryoya taşınamaz.
- Satırlar bağımsız değildir: aynı oturumun kararları birbirini etkiler.
- Süre, sekmeden ayrılmayı ayırt edemez; kart açmak okumak anlamına gelmez.

## Kullanılmaması gereken durumlar
Kişi, öğrenci veya çalışan değerlendirmesi; not verme; işe alım; gerçek olay yönetimi ya da klinik
kararlar. Çıktı oyuncunun yetkinliğini ölçmez, yalnızca oyundaki bir uyarının açılmasını tetikler.

## Sürüm
Yayın, sabitlenmiş commit ve geri dönüş: GitHub deposundaki `RELEASE.md`.
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--veri", default="data/oturumlar.csv")
    parser.add_argument("--cikti", default="model")
    parser.add_argument("--auc-esik", type=float, default=AUC_GATE, help="only for the gate test")
    args = parser.parse_args()

    out = Path(args.cikti)
    out.mkdir(parents=True, exist_ok=True)
    data = pd.read_csv(args.veri)
    real = data[data["kaynak"] == "gercek"]
    synthetic = data[data["kaynak"] == "sentetik"]
    real_sessions = real["oturum_id"].nunique()

    train, test = train_test_split(data, test_size=0.3, stratify=data[TARGET], random_state=SEED)
    model = build_model().fit(train[FEATURES], train[TARGET])
    metrics = score(test[TARGET], model.predict_proba(test[FEATURES])[:, 1])
    metrics["oturum_bazli_cv_auc"] = session_cv_auc(data)
    metrics["yalniz_gercek_cv_auc"] = session_cv_auc(real)

    real_test = test[test["kaynak"] == "gercek"]
    metrics["gercek_test_satiri"] = len(real_test)
    metrics["gercek_test_auc"] = (
        round(float(roc_auc_score(real_test[TARGET], model.predict_proba(real_test[FEATURES])[:, 1])), 4)
        if real_test[TARGET].nunique() == 2 else None
    )

    rules = {
        f"gercek_oturum >= {MIN_REAL_SESSIONS}": bool(real_sessions >= MIN_REAL_SESSIONS),
        f"roc_auc >= {args.auc_esik}": metrics["roc_auc"] >= args.auc_esik,
        f"recall_riskli >= {RECALL_GATE}": metrics["recall_riskli"] >= RECALL_GATE,
        "dengeli_dogruluk > 0.5": metrics["dengeli_dogruluk"] > 0.5,
    }
    coefficients = dict(zip(FEATURES, model.named_steps["lr"].coef_[0].round(4).tolist()))
    report = {
        "satir": len(data), "gercek_satir": len(real), "sentetik_satir": len(synthetic),
        "gercek_oturum": int(real_sessions), "egitim_satiri": len(train), "test_satiri": len(test),
        "metrikler": metrics, "kurallar": rules, "katsayilar_olcekli": coefficients,
    }
    (out / "eval_raporu.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"metrikler": metrics, "kurallar": rules}, indent=2, ensure_ascii=False))

    if not all(rules.values()):
        (out / "model.onnx").unlink(missing_ok=True)
        (out / "config.json").unlink(missing_ok=True)
        failed = [name for name, passed in rules.items() if not passed]
        print(f"EVAL KAPISI KAPALI: {failed}. Artefakt yazilmadi.", file=sys.stderr)
        return 1

    onnx_path = out / "model.onnx"
    difference = export_onnx(model, test[FEATURES], onnx_path)
    if difference > ONNX_TOLERANCE:
        onnx_path.unlink()
        print(f"ONNX farki {difference} > {ONNX_TOLERANCE}. Artefakt yazilmadi.", file=sys.stderr)
        return 1

    config = {
        "model": "human-exe-blind-accept",
        "version": VERSION,
        "task": "binary-classification",
        "input_name": "input",
        "output_name": "probabilities",
        "positive_class_index": 1,
        "features": FEATURES,
        "labels": {"0": "guvenli_secim", "1": "riskli_secim"},
        "karar_esigi": DECISION_THRESHOLD,
        "seed": SEED,
        "metrics": metrics,
        "acceptance": rules,
        "onnx_sklearn_max_fark": difference,
        "data": {k: report[k] for k in ("satir", "gercek_satir", "sentetik_satir", "gercek_oturum")},
        "sklearn_version": sklearn.__version__,
    }
    (out / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out / "README.md").write_text(MODEL_CARD.format(
        version=VERSION, threshold=DECISION_THRESHOLD, sklearn=sklearn.__version__, seed=SEED,
        n_features=len(FEATURES), real_rows=len(real), real_sessions=real_sessions,
        synthetic_rows=len(synthetic), synthetic_sessions=synthetic["oturum_id"].nunique(),
        auc_gate=AUC_GATE, recall_gate=RECALL_GATE, auc=metrics["roc_auc"], recall=metrics["recall_riskli"],
        balanced=metrics["dengeli_dogruluk"], cv=metrics["oturum_bazli_cv_auc"],
        cv_real=metrics["yalniz_gercek_cv_auc"], real_test=metrics["gercek_test_satiri"],
        real_auc=metrics["gercek_test_auc"], onnx_diff=difference,
    ), encoding="utf-8")

    if args.cikti == "model":
        public = Path("public/model")
        public.mkdir(parents=True, exist_ok=True)
        shutil.copy(onnx_path, public / "model.onnx")
        shutil.copy(out / "config.json", public / "config.json")
    print(f"Yazildi: {onnx_path} (ONNX farki {difference:.2e})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
