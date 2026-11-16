import { describe, it, expect } from "vitest";
import { MultitrackPlayer } from "./player";
import type { StemTrack } from "@/types";

// Player logic that doesn't require AudioContext: volume/solo/mute bookkeeping.
describe("MultitrackPlayer state", () => {
  it("stores tracks and computes duration", () => {
    const p = new MultitrackPlayer();
    const fakeBuffer = { duration: 10, numberOfChannels: 2, sampleRate: 44100 } as unknown as AudioBuffer;
    const tracks: StemTrack[] = [
      { id: "vocals", label: "Vocals", color: "#fff", audioBuffer: fakeBuffer, volume: 0.8, muted: false, solo: false },
      { id: "drums", label: "Drums", color: "#fff", audioBuffer: fakeBuffer, volume: 0.8, muted: false, solo: false },
      { id: "bass", label: "Bass", color: "#fff", audioBuffer: fakeBuffer, volume: 0.8, muted: false, solo: false },
      { id: "other", label: "Other", color: "#fff", audioBuffer: fakeBuffer, volume: 0.8, muted: false, solo: false },
    ];
    p.loadTracks(tracks);
    expect(p.duration).toBe(10);
    expect(p.getTracks()).toHaveLength(4);
    p.setVolume("vocals", 0.5);
    expect(p.getTracks().find((t) => t.id === "vocals")?.volume).toBe(0.5);
    p.setMuted("drums", true);
    expect(p.getTracks().find((t) => t.id === "drums")?.muted).toBe(true);
    p.setSolo("bass", true);
    expect(p.getTracks().find((t) => t.id === "bass")?.solo).toBe(true);
  });
});
