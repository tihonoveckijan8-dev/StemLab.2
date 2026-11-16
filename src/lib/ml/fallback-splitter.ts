import type { StemId } from "@/types";
import { normalizeToPeak } from "@/lib/audio/resampler";

/**
 * Lightweight spectral heuristic splitter used ONLY when the ONNX model
 * is unavailable (e.g. model not deployed yet, or demo mode).
 * It is NOT a replacement for Demucs — it produces a best-effort
 * frequency-band split so the product flow can be tested end-to-end.
 * The UI always labels this clearly as "Demo / fallback".
 */
export function fallbackSeparate(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Record<StemId, { left: Float32Array; right: Float32Array }> {
  const n = left.length;
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) mono[i] = (left[i] + right[i]) / 2;

  // Simple one-pole low-pass for bass (<150 Hz approx via moving average window).
  const bassL = lowPass(left, sampleRate, 150);
  const bassR = lowPass(right, sampleRate, 150);
  // High-pass for drums/vocals presence: original - bass.
  const midL = subtract(left, bassL);
  const midR = subtract(right, bassR);
  // Vocals ≈ mid with slower amplitude envelope emphasis (very rough).
  const vocalsL = envelopeGate(midL, sampleRate, 0.15);
  const vocalsR = envelopeGate(midR, sampleRate, 0.15);
  // Drums ≈ transient residual.
  const drumsL = subtract(midL, vocalsL);
  const drumsR = subtract(midR, vocalsR);
  // Other = residual.
  const otherL = new Float32Array(n);
  const otherR = new Float32Array(n);

  const [bL, bR] = normalizeToPeak([bassL, bassR]);
  const [vL, vR] = normalizeToPeak([vocalsL, vocalsR]);
  const [dL, dR] = normalizeToPeak([drumsL, drumsR]);
  const [oL, oR] = normalizeToPeak([otherL, otherR]);

  return {
    vocals: { left: vL, right: vR },
    drums: { left: dL, right: dR },
    bass: { left: bL, right: bR },
    other: { left: oL, right: oR },
  };
}

function lowPass(input: Float32Array, sampleRate: number, cutoff: number): Float32Array {
  const alpha = 1 - Math.exp((-2 * Math.PI * cutoff) / sampleRate);
  const out = new Float32Array(input.length);
  let y = 0;
  for (let i = 0; i < input.length; i++) {
    y += alpha * (input[i] - y);
    out[i] = y;
  }
  return out;
}

function subtract(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
  return out;
}

function envelopeGate(input: Float32Array, sampleRate: number, windowSec: number): Float32Array {
  const win = Math.max(1, Math.floor(sampleRate * windowSec));
  const out = new Float32Array(input.length);
  // RMS envelope over window, then soft gate.
  for (let i = 0; i < input.length; i++) {
    const start = Math.max(0, i - win);
    let sum = 0;
    for (let j = start; j <= i; j++) sum += input[j] * input[j];
    const rms = Math.sqrt(sum / (i - start + 1));
    const gate = Math.min(1, rms * 4);
    out[i] = input[i] * gate;
  }
  return out;
}
