import { describe, it, expect } from "vitest";
import { formatBytes, formatDuration, getExtension, isSupportedAudioFile, clamp } from "./utils";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  });
});

describe("formatDuration", () => {
  it("formats mm:ss", () => {
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("isSupportedAudioFile", () => {
  it("accepts mp3", () => {
    expect(isSupportedAudioFile(new File(["x"], "a.mp3", { type: "audio/mpeg" })).ok).toBe(true);
  });
  it("rejects exe", () => {
    expect(isSupportedAudioFile(new File(["x"], "a.exe")).ok).toBe(false);
  });
});

describe("clamp", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("getExtension", () => {
  it("extracts extension", () => {
    expect(getExtension("song.MP3")).toBe("mp3");
    expect(getExtension("noext")).toBe("");
  });
});
