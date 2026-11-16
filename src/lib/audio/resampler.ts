/** Pure-JS linear resampler for Float32 PCM (used in workers where OfflineAudioContext is unavailable). */
export function resampleFloat32(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return new Float32Array(input);
  const ratio = fromRate / toRate;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    output[i] = a + (b - a) * frac;
  }
  return output;
}

export function resampleStereo(
  left: Float32Array,
  right: Float32Array,
  fromRate: number,
  toRate: number
): { left: Float32Array; right: Float32Array } {
  return {
    left: resampleFloat32(left, fromRate, toRate),
    right: resampleFloat32(right, fromRate, toRate),
  };
}

/** Normalize to avoid clipping: scale so peak <= 0.99. */
export function normalizeToPeak(channels: Float32Array[], peak = 0.99): Float32Array[] {
  let max = 0;
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const v = Math.abs(ch[i]);
      if (v > max) max = v;
    }
  }
  if (max <= peak || max === 0) return channels;
  const gain = peak / max;
  return channels.map((ch) => {
    const out = new Float32Array(ch.length);
    for (let i = 0; i < ch.length; i++) out[i] = ch[i] * gain;
    return out;
  });
}
