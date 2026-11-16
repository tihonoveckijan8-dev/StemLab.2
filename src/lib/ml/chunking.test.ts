import { describe, it, expect } from "vitest";
import { planChunks, overlapAdd } from "./chunking";

describe("planChunks", () => {
  it("returns single chunk for short input", () => {
    expect(planChunks(100, 1000, 100)).toHaveLength(1);
  });

  it("splits long input with overlap", () => {
    const chunks = planChunks(2500, 1000, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].start).toBe(0);
    expect(chunks[chunks.length - 1].end).toBe(2500);
  });
});

describe("overlapAdd", () => {
  it("reconstructs a constant signal", () => {
    const total = 2000;
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = planChunks(total, chunkSize, overlap).map((c) => ({
      start: c.start,
      data: new Float32Array(c.end - c.start).fill(1),
    }));
    const out = overlapAdd(total, chunks, overlap);
    for (let i = 0; i < total; i++) {
      expect(out[i]).toBeCloseTo(1, 3);
    }
  });
});
