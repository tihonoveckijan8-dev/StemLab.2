/** Encode Float32 stereo PCM to 16-bit PCM WAV (pure JS, worker-safe). */
export function encodeWav16Bit(left: Float32Array, right: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = left.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l * 0x7fff, true);
    view.setInt16(offset + 2, r * 0x7fff, true);
    offset += 4;
  }
  return buffer;
}

export function encodeWavFromBuffer(buffer: AudioBuffer): ArrayBuffer {
  const left = buffer.getChannelData(0);
  const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : left;
  return encodeWav16Bit(left, right, buffer.sampleRate);
}

/** Encode to MP3 320 kbps via lamejs (browser). */
export async function encodeMp3(left: Float32Array, right: Float32Array, sampleRate: number): Promise<ArrayBuffer> {
  // Dynamic import keeps lamejs out of the initial bundle.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lamejs: any = await import("lamejs");
  const Mp3Encoder = lamejs.Mp3Encoder ?? lamejs.default?.Mp3Encoder;
  if (!Mp3Encoder) throw new Error("MP3 encoder unavailable");
  const encoder = new Mp3Encoder(2, sampleRate, 320);
  const chunks: number[] = [];
  const blockSize = 1152;
  const toInt16 = (f: Float32Array) => {
    const out = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) out[i] = Math.max(-32768, Math.min(32767, f[i] * 32767));
    return out;
  };
  const left16 = toInt16(left);
  const right16 = toInt16(right);
  for (let i = 0; i < left16.length; i += blockSize) {
    const l = left16.subarray(i, i + blockSize);
    const r = right16.subarray(i, i + blockSize);
    const data = encoder.encodeBuffer(l, r);
    for (const d of data) chunks.push(...d);
  }
  const end = encoder.flush();
  for (const d of end) chunks.push(...d);
  return new Uint8Array(chunks).buffer;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
