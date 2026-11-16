import { describe, it, expect } from "vitest";
import { encodeWav16Bit } from "./encoder";

describe("encodeWav16Bit", () => {
  it("produces a valid WAV header", () => {
    const left = new Float32Array([0, 0.5, -0.5, 1]);
    const right = new Float32Array([0, 0.5, -0.5, 1]);
    const buf = encodeWav16Bit(left, right, 44100);
    const view = new DataView(buf);
    const readStr = (off: number, len: number) =>
      String.fromCharCode(...new Uint8Array(buf, off, len));
    expect(readStr(0, 4)).toBe("RIFF");
    expect(readStr(8, 4)).toBe("WAVE");
    expect(readStr(12, 4)).toBe("fmt ");
    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getUint16(22, true)).toBe(2);
    expect(buf.byteLength).toBe(44 + left.length * 4);
  });

  it("clamps out-of-range samples", () => {
    const left = new Float32Array([2, -2]);
    const right = new Float32Array([2, -2]);
    const buf = encodeWav16Bit(left, right, 44100);
    const view = new DataView(buf);
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32767);
  });
});
