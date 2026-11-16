/// <reference lib="webworker" />
import { encodeWav16Bit } from "@/lib/audio/encoder";

interface EncodeRequest {
  id: string;
  left: Float32Array;
  right: Float32Array;
  sampleRate: number;
}

self.onmessage = (event: MessageEvent<{ type: string; payload?: EncodeRequest }>) => {
  const msg = event.data;
  if (msg.type !== "encode" || !msg.payload) return;
  const { id, left, right, sampleRate } = msg.payload;
  try {
    const wav = encodeWav16Bit(left, right, sampleRate);
    (self as unknown as { postMessage: (m: unknown, t?: Transferable[]) => void }).postMessage(
      { id, type: "done", wav },
      [wav]
    );
  } catch (err) {
    (self as unknown as { postMessage: (m: unknown) => void }).postMessage({
      id,
      type: "error",
      error: err instanceof Error ? err.message : "Encode failed",
    });
  }
};
