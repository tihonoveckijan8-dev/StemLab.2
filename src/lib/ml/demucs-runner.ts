import type { StemId } from "@/types";
import { planChunks, overlapAdd } from "./chunking";
import { fallbackSeparate } from "./fallback-splitter";
import { normalizeToPeak } from "@/lib/audio/resampler";

export interface RunnerOptions {
  modelUrl?: string;
  backend: "webgpu" | "wasm";
  quality: "fast" | "balanced" | "high";
  onProgress?: (stage: string, progress: number) => void;
  signal?: AbortSignal;
}

export interface SeparationResult {
  stems: Record<StemId, { left: Float32Array; right: Float32Array }>;
  usedFallback: boolean;
  backend: string;
}

const CHUNK_SECONDS: Record<string, number> = { fast: 7, balanced: 10, high: 10 };
const OVERLAP_SECONDS = 1;

/**
 * Runs HT-Demucs ONNX inference in a worker (call from worker context).
 * Falls back to heuristic splitter if model is missing/unreachable so the
 * product flow remains testable. The caller MUST surface `usedFallback`.
 */
export async function runSeparation(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  opts: RunnerOptions
): Promise<SeparationResult> {
  const { onProgress, signal } = opts;
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  };

  onProgress?.("model-loading", 0.05);
  throwIfAborted();

  const modelUrl = opts.modelUrl ?? "/models/htdemucs.onnx";
  let session: unknown = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ort: any = null;

  try {
    // Dynamic import so bundlers keep ORT out of the main thread bundle.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ort = (await import("onnxruntime-web")) as any;
    const providers = opts.backend === "webgpu" ? ["webgpu", "wasm"] : ["wasm"];
    session = await ort.InferenceSession.create(modelUrl, {
      executionProviders: providers,
      graphOptimizationLevel: "all",
    });
    onProgress?.("model-loading", 0.2);
  } catch {
    // Model not deployed / fetch failed → fallback path.
    session = null;
  }

  if (!session || !ort) {
    onProgress?.("inference", 0.5);
    throwIfAborted();
    const stems = fallbackSeparate(left, right, sampleRate);
    onProgress?.("post-processing", 0.9);
    return { stems, usedFallback: true, backend: "fallback-heuristic" };
  }

  // Real ONNX path: chunked inference with overlap-add.
  const chunkSize = Math.floor(CHUNK_SECONDS[opts.quality] * sampleRate);
  const overlap = Math.floor(OVERLAP_SECONDS * sampleRate);
  const chunks = planChunks(left.length, chunkSize, overlap);
  const perStemChunks: Record<StemId, { start: number; data: Float32Array }[]> = {
    vocals: [],
    drums: [],
    bass: [],
    other: [],
  };
  const perStemChunksR: Record<StemId, { start: number; data: Float32Array }[]> = {
    vocals: [],
    drums: [],
    bass: [],
    other: [],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sess = session as any;
  for (let i = 0; i < chunks.length; i++) {
    throwIfAborted();
    const c = chunks[i];
    const len = c.end - c.start;
    const input = new Float32Array(2 * len);
    input.set(left.subarray(c.start, c.end), 0);
    input.set(right.subarray(c.start, c.end), len);
    const tensor = new ort.Tensor("float32", input, [1, 2, len]);
    const feeds = { input: tensor };
    const results = await sess.run(feeds);
    // Demucs ONNX convention: outputs are 4 tensors (vocals, drums, bass, other) each [1,2,len].
    const order: StemId[] = ["vocals", "drums", "bass", "other"];
    const keys = Object.keys(results);
    for (let s = 0; s < 4; s++) {
      const out = results[keys[s]] as { data: Float32Array };
      const data = out.data;
      perStemChunks[order[s]].push({ start: c.start, data: data.slice(0, len) });
      perStemChunksR[order[s]].push({ start: c.start, data: data.slice(len, len * 2) });
    }
    onProgress?.("inference", 0.2 + (0.6 * (i + 1)) / chunks.length);
  }

  onProgress?.("post-processing", 0.85);
  const stems = {} as Record<StemId, { left: Float32Array; right: Float32Array }>;
  for (const id of ["vocals", "drums", "bass", "other"] as StemId[]) {
    const l = overlapAdd(left.length, perStemChunks[id], overlap);
    const r = overlapAdd(right.length, perStemChunksR[id], overlap);
    const [nl, nr] = normalizeToPeak([l, r]);
    stems[id] = { left: nl, right: nr };
  }
  onProgress?.("post-processing", 0.95);
  return { stems, usedFallback: false, backend: opts.backend };
}
