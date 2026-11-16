import { describe, it, expect } from "vitest";
import { resampleFloat32, normalizeToPeak } from "./resampler";

describe("resampleFloat32", () => {
  it("returns same length when rates equal", () => {
    const input = new Float32Array([1, 2, 3, 4]);
    expect(resampleFloat32(input, 44100, 44100)).toEqual(input);
  });

  it("downsamples 48000 -> 44100", () => {
    const input = new Float32Array(48000).fill(0.5);
    const out = resampleFloat32(input, 48000, 44100);
    expect(out.length).toBe(Math.floor(48000 / (48000 / 44100)));
    expect(out[0]).toBeCloseTo(0.5);
  });
});

describe("normalizeToPeak", () => {
  it("scales loud signal to 0.99 peak", () => {
    const ch = new Float32Array([0.5, 2.0, -1.0]);
    const [out] = normalizeToPeak([ch]);
    expect(Math.max(...out.map(Math.abs))).toBeCloseTo(0.99);
  });

  it("leaves quiet signal untouched", () => {
    const ch = new Float32Array([0.1, -0.2]);
    const [out] = normalizeToPeak([ch]);
    expect(out).toEqual(ch);
  });
});
