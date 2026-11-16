"use client";

import { create } from "zustand";
import type { AudioFileInfo, SeparationJob, SeparationSettings, StemId, StemTrack } from "@/types";
import { ALL_STEMS, STEM_META } from "@/types";

interface SessionState {
  file: AudioFileInfo | null;
  settings: SeparationSettings;
  job: SeparationJob;
  tracks: StemTrack[];
  originalBuffer: AudioBuffer | null;
  usedFallback: boolean;
  backend: string;
  startedAt: number | null;

  setFile: (file: AudioFileInfo | null) => void;
  setSettings: (s: Partial<SeparationSettings>) => void;
  setJob: (j: Partial<SeparationJob>) => void;
  setTracks: (t: StemTrack[]) => void;
  setOriginalBuffer: (b: AudioBuffer | null) => void;
  setMeta: (usedFallback: boolean, backend: string) => void;
  reset: () => void;
  updateTrack: (id: StemId, patch: Partial<StemTrack>) => void;
}

const initialSettings: SeparationSettings = {
  mode: "browser",
  quality: "balanced",
  stems: [...ALL_STEMS],
  exportFormat: "wav",
};

const initialJob: SeparationJob = {
  id: "",
  status: "idle",
  progress: 0,
  stage: "idle",
};

export const useSessionStore = create<SessionState>((set) => ({
  file: null,
  settings: initialSettings,
  job: initialJob,
  tracks: ALL_STEMS.map((id) => ({
    id,
    label: STEM_META[id].label,
    color: STEM_META[id].color,
    audioBuffer: null,
    volume: 0.8,
    muted: false,
    solo: false,
  })),
  originalBuffer: null,
  usedFallback: false,
  backend: "",
  startedAt: null,

  setFile: (file) => set({ file, job: { ...initialJob } }),
  setSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
  setJob: (j) => set((state) => ({ job: { ...state.job, ...j } })),
  setTracks: (tracks) => set({ tracks }),
  setOriginalBuffer: (b) => set({ originalBuffer: b }),
  setMeta: (usedFallback, backend) => set({ usedFallback, backend }),
  reset: () =>
    set({
      file: null,
      settings: initialSettings,
      job: initialJob,
      tracks: ALL_STEMS.map((id) => ({
        id,
        label: STEM_META[id].label,
        color: STEM_META[id].color,
        audioBuffer: null,
        volume: 0.8,
        muted: false,
        solo: false,
      })),
      originalBuffer: null,
      usedFallback: false,
      backend: "",
      startedAt: null,
    }),
  updateTrack: (id, patch) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
}));
