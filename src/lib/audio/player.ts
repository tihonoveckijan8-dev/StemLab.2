import type { StemId, StemTrack } from "@/types";
import { ALL_STEMS } from "@/types";

/**
 * Multitrack synchronized player.
 * Uses one AudioContext + per-stem GainNode + BufferSource per stem.
 * All sources start at the same context time for sample-accurate sync.
 */
export class MultitrackPlayer {
  private ctx: AudioContext | null = null;
  private sources = new Map<StemId, AudioBufferSourceNode>();
  private gains = new Map<StemId, GainNode>();
  private masterGain: GainNode | null = null;
  private tracks = new Map<StemId, StemTrack>();
  private startedAt = 0;
  private offset = 0;
  private _isPlaying = false;
  private _duration = 0;
  private rafId = 0;
  onTimeUpdate: ((time: number) => void) | null = null;
  onEnded: (() => void) | null = null;

  get isPlaying() {
    return this._isPlaying;
  }
  get duration() {
    return this._duration;
  }
  get currentTime() {
    if (!this._isPlaying || !this.ctx) return this.offset;
    return this.offset + (this.ctx.currentTime - this.startedAt);
  }

  loadTracks(tracks: StemTrack[]) {
    this.stop();
    this.tracks.clear();
    for (const t of tracks) this.tracks.set(t.id, { ...t });
    const buffers = tracks.map((t) => t.audioBuffer).filter(Boolean) as AudioBuffer[];
    this._duration = buffers.length ? Math.max(...buffers.map((b) => b.duration)) : 0;
    this.offset = 0;
  }

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  play(fromTime = this.offset) {
    const ctx = this.ensureCtx();
    this.stopSources();
    const startAt = ctx.currentTime + 0.05;
    this.startedAt = startAt;
    this.offset = fromTime;
    this._isPlaying = true;

    for (const id of ALL_STEMS) {
      const track = this.tracks.get(id);
      if (!track?.audioBuffer) continue;
      const source = ctx.createBufferSource();
      source.buffer = track.audioBuffer;
      const gain = ctx.createGain();
      gain.gain.value = this.effectiveVolume(track);
      source.connect(gain);
      gain.connect(this.masterGain!);
      source.start(startAt, fromTime % track.audioBuffer.duration);
      this.sources.set(id, source);
      this.gains.set(id, gain);
    }
    const remaining = this._duration - fromTime;
    const lastSource = [...this.sources.values()][0];
    if (lastSource) {
      lastSource.onended = () => {
        if (this._isPlaying && this.currentTime >= this._duration - 0.05) {
          this.pause();
          this.onEnded?.();
        }
      };
    }
    void remaining;
    this.tick();
  }

  pause() {
    this.offset = this.currentTime;
    this.stopSources();
    this._isPlaying = false;
    cancelAnimationFrame(this.rafId);
  }

  seek(time: number) {
    const wasPlaying = this._isPlaying;
    this.offset = Math.max(0, Math.min(time, this._duration));
    if (wasPlaying) this.play(this.offset);
    else this.onTimeUpdate?.(this.offset);
  }

  stop() {
    this.stopSources();
    this._isPlaying = false;
    this.offset = 0;
    if (typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this.rafId);
  }

  private stopSources() {
    for (const s of this.sources.values()) {
      try {
        s.onended = null;
        s.stop();
      } catch {
        /* already stopped */
      }
      s.disconnect();
    }
    this.sources.clear();
    for (const g of this.gains.values()) g.disconnect();
    this.gains.clear();
  }

  private tick = () => {
    if (!this._isPlaying) return;
    this.onTimeUpdate?.(this.currentTime);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private effectiveVolume(track: StemTrack): number {
    const anySolo = [...this.tracks.values()].some((t) => t.solo);
    if (track.muted) return 0;
    if (anySolo && !track.solo) return 0;
    return track.volume;
  }

  setVolume(id: StemId, volume: number) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.volume = volume;
    const gain = this.gains.get(id);
    if (gain && this.ctx) gain.gain.setTargetAtTime(this.effectiveVolume(track), this.ctx.currentTime, 0.02);
  }

  setMuted(id: StemId, muted: boolean) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.muted = muted;
    this.refreshGains();
  }

  setSolo(id: StemId, solo: boolean) {
    const track = this.tracks.get(id);
    if (!track) return;
    track.solo = solo;
    this.refreshGains();
  }

  private refreshGains() {
    if (!this.ctx) return;
    for (const [id, gain] of this.gains) {
      const track = this.tracks.get(id);
      if (track) gain.gain.setTargetAtTime(this.effectiveVolume(track), this.ctx.currentTime, 0.02);
    }
  }

  getTracks(): StemTrack[] {
    return [...this.tracks.values()];
  }

  dispose() {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
  }
}
