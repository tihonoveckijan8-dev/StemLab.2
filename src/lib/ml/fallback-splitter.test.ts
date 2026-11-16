import { describe, it, expect } from "vitest";
import { fallbackSeparate } from "./fallback-splitter";

describe("fallbackSeparate", () => {
  it("returns 4 stems with correct length", () => {
    const n = 44100;
    const left = new Float32Array(n).fill(0.3);
    const right = new Float32Array(n).fill(0.3);
    const stems = fallbackSeparate(left, right, 44100);
    for (const id of ["vocals", "drums", "bass", "other"] as const) {
      expect(stems[id].left.length).toBe(n);
      expect(stems[id].right.length).toBe(n);
    }
  });
});
