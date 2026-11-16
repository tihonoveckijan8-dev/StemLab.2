import { TARGET_SAMPLE_RATE } from "@/types";

/** Decode an audio File/ArrayBuffer to Float32 stereo PCM at 44.1 kHz. */
export async function decodeAudioFile(
  file: File | ArrayBuffer,
  ctx?: AudioContext
): Promise<{ buffer: AudioBuffer; sampleRate: number }> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const audioCtx = ctx ?? new AudioContext();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  if (decoded.sampleRate === TARGET_SAMPLE_RATE) {
    return { buffer: decoded, sampleRate: TARGET_SAMPLE_RATE };
  }
  const resampled = await resampleBuffer(decoded, TARGET_SAMPLE_RATE);
  return { buffer: resampled, sampleRate: TARGET_SAMPLE_RATE };
}

export async function resampleBuffer(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
  const duration = buffer.duration;
  const length = Math.ceil(duration * targetRate);
  const offline = new OfflineAudioContext(buffer.numberOfChannels, length, targetRate);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);
  return offline.startRendering();
}

/** Extract interleaved Float32 stereo channels from an AudioBuffer. */
export function bufferToStereoFloat32(buffer: AudioBuffer): { left: Float32Array; right: Float32Array } {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : new Float32Array(left.length);
  return { left: Float32Array.from(left), right: Float32Array.from(right) };
}

export function stereoToBuffer(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  ctx?: BaseAudioContext
): AudioBuffer {
  const audioCtx = ctx ?? new AudioContext();
  const buffer = audioCtx.createBuffer(2, left.length, sampleRate);
  buffer.copyToChannel(left as Float32Array<ArrayBuffer>, 0);
  buffer.copyToChannel(right as Float32Array<ArrayBuffer>, 1);
  return buffer;
}

/** Get min/max peaks for waveform rendering (normalized -1..1). */
export function computePeaks(buffer: AudioBuffer, buckets: number): Float32Array {
  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;
  const peaks = new Float32Array(buckets);
  const perBucket = Math.max(1, Math.floor(ch0.length / buckets));
  for (let i = 0; i < buckets; i++) {
    let max = 0;
    const start = i * perBucket;
    const end = Math.min(ch0.length, start + perBucket);
    for (let j = start; j < end; j += 4) {
      const v = Math.max(Math.abs(ch0[j]), Math.abs(ch1[j]));
      if (v > max) max = v;
    }
    peaks[i] = max;
  }
  return peaks;
}
