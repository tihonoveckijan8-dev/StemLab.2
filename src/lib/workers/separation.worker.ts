/// <reference lib="webworker" />
import { runSeparation } from "@/lib/ml/demucs-runner";
import { encodeWav16Bit } from "@/lib/audio/encoder";
import type { StemId } from "@/types";

export interface SeparationRequest {
  id: string;
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
  backend: "webgpu" | "wasm";
  quality: "fast" | "balanced" | "high";
  exportFormat: "wav" | "mp3" | "flac";
  modelUrl?: string;
}

export interface SeparationResponse {
  id: string;
  type: "progress" | "done" | "error";
  stage?: string;
  progress?: number;
  stems?: Record<StemId, ArrayBuffer>; // WAV-encoded
  usedFallback?: boolean;
  backend?: string;
  error?: string;
}

let abortController: AbortController | null = null;

self.onmessage = async (event: MessageEvent<{ type: string; payload?: SeparationRequest }>) => {
  const msg = event.data;
  if (msg.type === "cancel") {
    abortController?.abort();
    return;
  }
  if (msg.type !== "separate" || !msg.payload) return;
  const req = msg.payload;
  abortController = new AbortController();
  const post = (r: SeparationResponse) => (self as unknown as { postMessage: (m: SeparationResponse) => void }).postMessage(r);
  try {
    post({ id: req.id, type: "progress", stage: "decoding", progress: 0.02 });
    const result = await runSeparation(req.left, req.right, req.sampleRate, {
      backend: req.backend,
      quality: req.quality,
      modelUrl: req.modelUrl,
      signal: abortController.signal,
      onProgress: (stage, progress) => post({ id: req.id, type: "progress", stage, progress }),
    });
    post({ id: req.id, type: "progress", stage: "encoding", progress: 0.96 });
    const stems = {} as Record<StemId, ArrayBuffer>;
    for (const id of ["vocals", "drums", "bass", "other"] as StemId[]) {
      stems[id] = encodeWav16Bit(result.stems[id].left, result.stems[id].right, req.sampleRate);
    }
    post({ id: req.id, type: "done", progress: 1, stems, usedFallback: result.usedFallback, backend: result.backend });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Separation failed";
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    post({ id: req.id, type: "error", error: isAbort ? "canceled" : message });
  }
};
