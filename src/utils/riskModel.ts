/**
 * Risky-choice model inference in the browser (spec.md §12.2). Synthetic-data prototype.
 *
 * The app downloads the model from the commit-pinned Hugging Face URL and falls back to the copy
 * it serves itself (public/model). Any failure leaves the game unchanged: no prediction, no dialog.
 */

import type { InferenceSession } from 'onnxruntime-web';
import { FEATURE_ORDER, Features } from './telemetry';

export const HF_REPO = 'yagmurbekil/human-exe-risky-choice-onnx';
/** Pinned Hugging Face commit (RELEASE.md). Never `main`: a new upload must not change a live app. */
export const HF_COMMIT = 'f951b553cadf21305206cd67d9ce4174e68210dd';

const OFF_KEY = 'humanexe.modelKapali';

export interface ModelConfig {
  version: string;
  features: string[];
  input_name: string;
  output_name: string;
  positive_class_index: number;
  karar_esigi: number;
}

interface LoadedModel {
  session: InferenceSession;
  config: ModelConfig;
  source: 'huggingface' | 'yerel';
  tensor: typeof import('onnxruntime-web').Tensor;
}

let loading: Promise<LoadedModel> | null = null;

/** `?model=1` forces it on, `?model=0` or the stored flag turn it off (see cypress/support/e2e.ts). */
export function isModelEnabled(search: string = window.location.search): boolean {
  const param = new URLSearchParams(search).get('model');
  if (param === '1') return true;
  if (param === '0') return false;
  try {
    return localStorage.getItem(OFF_KEY) !== '1';
  } catch {
    return true;
  }
}

async function fetchFrom(base: string, ort: typeof import('onnxruntime-web')) {
  const response = await fetch(`${base}config.json`);
  if (!response.ok) throw new Error(`config.json: HTTP ${response.status}`);
  const config = (await response.json()) as ModelConfig;

  // config.json is the contract between training and every consumer
  if (config.features.join() !== FEATURE_ORDER.join()) {
    throw new Error('config.json features do not match the app contract');
  }
  const session = await ort.InferenceSession.create(`${base}model.onnx`, { executionProviders: ['wasm'] });
  return { session, config };
}

async function load(): Promise<LoadedModel> {
  const ort = await import('onnxruntime-web/wasm');
  ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ort.env.versions.web}/dist/`;
  ort.env.wasm.numThreads = 1;

  if (HF_COMMIT) {
    try {
      const base = `https://huggingface.co/${HF_REPO}/resolve/${HF_COMMIT}/`;
      return { ...(await fetchFrom(base, ort)), source: 'huggingface', tensor: ort.Tensor };
    } catch (error) {
      console.warn('Hugging Face model unavailable, using the local copy:', error);
    }
  }
  return { ...(await fetchFrom('/model/', ort)), source: 'yerel', tensor: ort.Tensor };
}

export function loadRiskModel(): Promise<LoadedModel> {
  if (!loading) {
    loading = load().catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
}

export interface RiskPrediction {
  p: number;
  threshold: number;
  source: LoadedModel['source'];
  version: string;
}

export async function predictRisk(features: Features): Promise<RiskPrediction> {
  const { session, config, source, tensor } = await loadRiskModel();
  const vector = Float32Array.from(FEATURE_ORDER, (name) => features[name]);
  const input = new tensor('float32', vector, [1, FEATURE_ORDER.length]);
  const output = await session.run({ [config.input_name]: input });
  const p = Number(output[config.output_name].data[config.positive_class_index]);
  return { p, threshold: config.karar_esigi, source, version: config.version };
}

/** Never blocks the game: if the model is slow or fails, the decision continues without it. */
export async function predictRiskSafely(features: Features, timeoutMs = 3000): Promise<RiskPrediction | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  try {
    return await Promise.race([predictRisk(features), timeout]);
  } catch (error) {
    console.warn('Risk model skipped:', error);
    return null;
  }
}
