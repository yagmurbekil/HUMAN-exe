"""Train, gate and package the risky-choice model (spec.md §12).

    python train.py                       # production mode: needs >= 15 real sessions
    python train.py --sentetik-prototip   # technical prototype on synthetic data only

Two separate gates:
  * data gate: at least 15 sessions with kaynak=gercek. Only production mode requires it. The
    prototype mode never marks it as passed.
  * technical gate: session-level test metrics and ONNX equivalence. No mode can skip it.

If a gate fails the script exits with code 1 and writes no model. A failed technical gate also
removes any earlier model from model/ and public/model/, so the app cannot serve a stale one.
Thresholds and the split seed are the ones fixed in spec.md §12.4.
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
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

SEED = 42
VERSION = "2.0.0"
PROTOTYPE_VERSION = "2.0.0-prototip"
# secim_degisikligi stays in the CSV but is not an input: spec.md §12.1 explains why it was removed
FEATURES = [
    "seviye", "karar_no", "karar_suresi_sn", "kart_orani", "tutor_acildi",
    "ipucu_sayisi", "onceki_riskli", "onceki_uyumsuz",
]
TARGET = "riskli_secim"
MIN_REAL_SESSIONS = 15
AUC_GATE = 0.70
RECALL_GATE = 0.60
DECISION_THRESHOLD = 0.5
ONNX_TOLERANCE = 1e-4
BOOTSTRAP_ROUNDS = 2000


def build_model() -> Pipeline:
    return Pipeline([
        ("scaler", StandardScaler()),
        # class_weight was added after a first run failed the recall gate (0.5238): see RELEASE.md
        ("lr", LogisticRegression(max_iter=1000, class_weight="balanced", random_state=SEED)),
    ])


def split_by_session(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Keeps all rows of a session on one side: history features cannot leak into the test set."""
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.3, random_state=SEED)
    train_index, test_index = next(splitter.split(data, data[TARGET], groups=data["oturum_id"]))
    return data.iloc[train_index], data.iloc[test_index]


def score(y_true, proba) -> dict:
    if pd.Series(y_true).nunique() < 2:
        return {"roc_auc": None, "recall_riskli": None, "dengeli_dogruluk": None}
    predicted = (proba >= DECISION_THRESHOLD).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y_true, proba)), 4),
        "recall_riskli": round(float(recall_score(y_true, predicted)), 4),
        "dengeli_dogruluk": round(float(balanced_accuracy_score(y_true, predicted)), 4),
    }


def bootstrap_auc_interval(test: pd.DataFrame, proba: np.ndarray) -> list[float]:
    """95% interval that resamples whole sessions, because rows of a session are not independent."""
    frame = test[["oturum_id", TARGET]].assign(p=proba)
    groups = [g for _, g in frame.groupby("oturum_id")]
    rng = np.random.default_rng(SEED)
    values = []
    for _ in range(BOOTSTRAP_ROUNDS):
        picks = rng.integers(0, len(groups), len(groups))
        sample = pd.concat([groups[i] for i in picks])
        if sample[TARGET].nunique() == 2:
            values.append(roc_auc_score(sample[TARGET], sample["p"]))
    return [round(float(v), 4) for v in np.percentile(values, [2.5, 97.5])]


def session_cv_auc(data: pd.DataFrame) -> float:
    """5-fold AUC where a session is never on both sides."""
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
tags: [tabular-classification, sklearn, education, synthetic-data]
---

# human-exe-risky-choice-onnx (v{version})

> **Sentetik veriyle eğitilmiş teknik prototip.** Gerçek oyuncu verisi yoktur (0 gerçek oturum).
> Ödevin en az 15 gerçek oturum şartı **karşılanmamıştır**. Aşağıdaki metrikler gerçek oyuncu
> performansı değildir.

## Amaç
HUMAN.exe oyununda oyuncu `Kararı Onayla`ya bastığında, davranış özelliklerinden seçilen seçeneğin
**riskli (bayraklı) seçenek olma olasılığını** (`p_riskli_secim`) tahmin eder. `p >= {threshold}` ise
oyun `DOGRULA.dlg` penceresini açar. Seçilen seçenek girdi değildir.

Model "körü körüne onay" ölçmez: D3'te riskli seçenek ASSIST.exe önerisine karşı çıkmaktır ve
oyuncunun niyeti ya da kanıtı okuyup okumadığı etikette yer almaz.

## Model
`StandardScaler` + `LogisticRegression` (`class_weight="balanced"`, scikit-learn {sklearn},
`random_state={seed}`) → ONNX. Girdi: `input`, float32, `[N, {n_features}]`. Çıktı: `probabilities`,
`[N, 2]`, indeks 1 riskli sınıftır. Özellik sırası `config.json` içindedir; tanımlar: `data/SOZLUK.md`.

`class_weight` olasılıkları kalibre etmez; `p` gerçek bir sıklık olarak yorumlanmamalıdır.

**Çıkarılan girdi:** `secim_degisikligi`, oturum bazlı sonuç görülmeden önce çıkarıldı. Önceki modelde
fikir değiştirmek riski yükseltiyordu; bu, `DOGRULA.dlg` sonrası kararını gerçekten gözden geçiren
oyuncuyu cezalandırırdı ve üretici kuralda böyle bir etki yoktu. Sütun CSV'de durur, modele girmez.

## Veri
Tümü `kaynak=sentetik`, {rows} satır / {sessions} oturum:
- `uretim_turu=manuel-rastgele`: {manual_rows} satır / {manual_sessions} oturum. Elle ve rastgele
  cevaplarla oluşturuldu. Oyuncu davranışı değildir.
- `uretim_turu=algoritmik-sentetik`: {algo_rows} satır / {algo_sessions} oturum. `scripts/veri_uret.py`
  (tohum 20261106) ile şu varsayımdan üretildi: "kanıt inceleyen ve zaman ayıran oyuncu daha az
  riskli seçer". Model bu varsayımı geri bulur; varsayımın doğruluğunu kanıtlamaz.

## Metrikler
Oturum bazlı %70 / %30 bölme (`GroupShuffleSplit`, tohum {seed}), eğitim ile test arasında ortak oturum
sayısı {overlap}. Eşikler: ROC-AUC >= {auc_gate}, recall >= {recall_gate}, dengeli doğruluk > 0.5.

| Ölçüm | Değer |
|---|---|
| Test ROC-AUC ({test_sessions} oturum, {test_rows} satır) | {auc} |
| Test ROC-AUC %95 aralığı (oturum bootstrap) | {auc_ci} |
| Test recall (riskli) | {recall} |
| Test dengeli doğruluk | {balanced} |
| Oturum bazlı 5 katlı CV ROC-AUC | {cv} |
| Test, algoritmik alt küme ROC-AUC | {algo_auc} |
| Test, manuel alt küme ROC-AUC | {manual_auc} |
| ONNX ↔ sklearn en büyük fark | {onnx_diff:.2e} |

Bu skorlar yalnızca üretici kuralın ne ölçüde geri bulunduğunu gösterir. Gerçek oyuncu üzerinde
geçerlilik kanıtı değildir. Eşik bu verinin bir bölümü daha önce görüldükten sonra korunmuştur;
`class_weight` kararı önceki satır bazlı denemeden gelir, bu nedenle skor iyimser olabilir.

## Sınırlar
- Gerçek veri şartı karşılanmadı; üretim kullanımı için uygun değildir.
- Manuel satırlar hızlı (medyan 2,9 sn), algoritmik satırlar yavaştır (medyan yaklaşık 32 sn); süre
  üretim türünü de ele verir. Model çok hızlı oyuncu için bir tahminde bulunurken bu kaymadan etkilenir.
- Tek senaryo, üç karar için üretilmiştir; başka oyuna taşınamaz.
- Süre, sekmeden ayrılmayı ayırt edemez; kart açmak okumak anlamına gelmez.

## Kullanılmaması gereken durumlar
Kişi, öğrenci veya çalışan değerlendirmesi; not verme; işe alım; gerçek olay yönetimi ya da klinik
kararlar. Çıktı yetkinlik ölçmez, yalnızca oyundaki bir uyarıyı tetikler.

## Sürüm
Yayın, sabitlenmiş commit ve geri dönüş: GitHub deposundaki `RELEASE.md`.
"""


def remove_artifacts(out: Path, is_default_dir: bool):
    """A model that no longer passes must not stay where the app or a release could pick it up."""
    for name in ("model.onnx", "config.json"):
        (out / name).unlink(missing_ok=True)
        if is_default_dir:
            (Path("public/model") / name).unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--veri", default="data/oturumlar.csv")
    parser.add_argument("--cikti", default="model")
    parser.add_argument("--sentetik-prototip", action="store_true",
                        help="build a clearly labelled prototype without real data (spec.md §12.6)")
    parser.add_argument("--auc-esik", type=float, default=AUC_GATE, help="only for the gate test")
    args = parser.parse_args()

    out = Path(args.cikti)
    out.mkdir(parents=True, exist_ok=True)
    is_default_dir = args.cikti == "model"
    data = pd.read_csv(args.veri)
    real_sessions = int(data[data["kaynak"] == "gercek"]["oturum_id"].nunique())
    real_gate = real_sessions >= MIN_REAL_SESSIONS

    train, test = split_by_session(data)
    overlap = len(set(train["oturum_id"]) & set(test["oturum_id"]))
    model = build_model().fit(train[FEATURES], train[TARGET])
    proba = model.predict_proba(test[FEATURES])[:, 1]

    metrics = score(test[TARGET], proba)
    metrics["roc_auc_guven_95"] = bootstrap_auc_interval(test, proba)
    metrics["oturum_bazli_cv_auc"] = session_cv_auc(data)
    by_origin = {}
    for origin, rows in test.groupby("uretim_turu"):
        by_origin[origin] = {"satir": len(rows), "pozitif": int(rows[TARGET].sum()),
                             **score(rows[TARGET], model.predict_proba(rows[FEATURES])[:, 1])}

    technical = {
        f"roc_auc >= {args.auc_esik}": metrics["roc_auc"] is not None and metrics["roc_auc"] >= args.auc_esik,
        f"recall_riskli >= {RECALL_GATE}": metrics["recall_riskli"] is not None and metrics["recall_riskli"] >= RECALL_GATE,
        "dengeli_dogruluk > 0.5": metrics["dengeli_dogruluk"] is not None and metrics["dengeli_dogruluk"] > 0.5,
        "oturum_kesisimi == 0": overlap == 0,
    }
    origin_counts = {name: {"satir": len(rows), "oturum": int(rows["oturum_id"].nunique())}
                     for name, rows in data.groupby("uretim_turu")}
    report = {
        "mod": "sentetik-prototip" if args.sentetik_prototip else "uretim",
        "gercek_oturum": real_sessions,
        "gercek_veri_kapisi": real_gate,
        "satir": len(data),
        "oturum": int(data["oturum_id"].nunique()),
        "uretim_turu": origin_counts,
        "egitim": {"satir": len(train), "oturum": int(train["oturum_id"].nunique()),
                   "riskli_orani": round(float(train[TARGET].mean()), 4)},
        "test": {"satir": len(test), "oturum": int(test["oturum_id"].nunique()),
                 "riskli_orani": round(float(test[TARGET].mean()), 4)},
        "oturum_kesisimi": overlap,
        "metrikler": metrics,
        "test_uretim_turune_gore": by_origin,
        "teknik_kapi": technical,
        "katsayilar_olcekli": dict(zip(FEATURES, model.named_steps["lr"].coef_[0].round(4).tolist())),
    }
    (out / "eval_raporu.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ("mod", "gercek_veri_kapisi", "metrikler", "test_uretim_turune_gore", "teknik_kapi")},
                     indent=2, ensure_ascii=False))

    if not all(technical.values()):
        remove_artifacts(out, is_default_dir)
        failed = [name for name, passed in technical.items() if not passed]
        print(f"TEKNIK KAPI KAPALI: {failed}. Model yazilmadi, onceki model kaldirildi.", file=sys.stderr)
        return 1
    if not real_gate and not args.sentetik_prototip:
        print(f"GERCEK VERI KAPISI KAPALI: {real_sessions} gercek oturum (en az {MIN_REAL_SESSIONS}). "
              "Model yazilmadi. Yalniz teknik prototip icin: --sentetik-prototip", file=sys.stderr)
        return 1

    onnx_path = out / "model.onnx"
    difference = export_onnx(model, test[FEATURES], onnx_path)
    if difference > ONNX_TOLERANCE:
        remove_artifacts(out, is_default_dir)
        print(f"ONNX farki {difference} > {ONNX_TOLERANCE}. Model yazilmadi.", file=sys.stderr)
        return 1

    prototype = not real_gate
    version = PROTOTYPE_VERSION if prototype else VERSION
    config = {
        "model": "human-exe-risky-choice",
        "version": version,
        "durum": "sentetik-prototip" if prototype else "uretim",
        "gercek_veri_kapisi": real_gate,
        "gercek_oturum": real_sessions,
        "task": "binary-classification",
        "input_name": "input",
        "output_name": "probabilities",
        "positive_class_index": 1,
        "features": FEATURES,
        "labels": {"0": "guvenli_secim", "1": "riskli_secim"},
        "karar_esigi": DECISION_THRESHOLD,
        "seed": SEED,
        "metrics": metrics,
        "acceptance": technical,
        "onnx_sklearn_max_fark": difference,
        "data": {"satir": len(data), "uretim_turu": origin_counts},
        "sklearn_version": sklearn.__version__,
    }
    (out / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    manual = origin_counts.get("manuel-rastgele", {"satir": 0, "oturum": 0})
    algorithmic = origin_counts.get("algoritmik-sentetik", {"satir": 0, "oturum": 0})
    (out / "README.md").write_text(MODEL_CARD.format(
        version=version, threshold=DECISION_THRESHOLD, sklearn=sklearn.__version__, seed=SEED,
        n_features=len(FEATURES), rows=len(data), sessions=report["oturum"],
        manual_rows=manual["satir"], manual_sessions=manual["oturum"],
        algo_rows=algorithmic["satir"], algo_sessions=algorithmic["oturum"], overlap=overlap,
        auc_gate=AUC_GATE, recall_gate=RECALL_GATE, test_sessions=report["test"]["oturum"],
        test_rows=report["test"]["satir"], auc=metrics["roc_auc"], auc_ci=metrics["roc_auc_guven_95"],
        recall=metrics["recall_riskli"], balanced=metrics["dengeli_dogruluk"], cv=metrics["oturum_bazli_cv_auc"],
        algo_auc=by_origin.get("algoritmik-sentetik", {}).get("roc_auc"),
        manual_auc=by_origin.get("manuel-rastgele", {}).get("roc_auc"), onnx_diff=difference,
    ), encoding="utf-8")

    if is_default_dir:
        public = Path("public/model")
        public.mkdir(parents=True, exist_ok=True)
        shutil.copy(onnx_path, public / "model.onnx")
        shutil.copy(out / "config.json", public / "config.json")
    print(f"Yazildi: {onnx_path} ({version}, ONNX farki {difference:.2e})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
