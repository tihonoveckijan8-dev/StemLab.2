/** Chunking + overlap-add helpers for long-track inference. */

export interface ChunkPlan {
  start: number;
  end: number; // exclusive
  weightStart: number;
  weightEnd: number;
}

export function planChunks(totalSamples: number, chunkSize: number, overlap: number): ChunkPlan[] {
  if (totalSamples <= chunkSize) return [{ start: 0, end: totalSamples, weightStart: 1, weightEnd: 1 }];
  const step = chunkSize - overlap;
  const chunks: ChunkPlan[] = [];
  for (let start = 0; start < totalSamples; start += step) {
    const end = Math.min(totalSamples, start + chunkSize);
    chunks.push({ start, end, weightStart: 1, weightEnd: 1 });
    if (end >= totalSamples) break;
  }
  return chunks;
}

/** Hann-like crossfade window for overlap-add. */
export function crossfadeWeight(position: number, overlap: number): number {
  if (overlap <= 0) return 1;
  if (position < overlap) return 0.5 - 0.5 * Math.cos((Math.PI * position) / overlap);
  return 1;
}

export function overlapAdd(
  totalLength: number,
  chunks: { start: number; data: Float32Array }[],
  overlap: number
): Float32Array {
  const output = new Float32Array(totalLength);
  const weights = new Float32Array(totalLength);
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.data.length; i++) {
      const pos = chunk.start + i;
      if (pos >= totalLength) break;
      // Fade in at chunk start, fade out at chunk end (except track edges).
      let w = 1;
      if (chunk.start > 0 && i < overlap) w = crossfadeWeight(i, overlap);
      else if (chunk.start + chunk.data.length < totalLength && i > chunk.data.length - overlap) {
        w = crossfadeWeight(chunk.data.length - i, overlap);
      }
      output[pos] += chunk.data[i] * w;
      weights[pos] += w;
    }
  }
  for (let i = 0; i < totalLength; i++) {
    if (weights[i] > 0) output[i] /= weights[i];
  }
  return output;
}
