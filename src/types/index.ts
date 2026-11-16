export type StemId = "vocals" | "drums" | "bass" | "other";

export type JobStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

export type ProcessingStage =
  | "idle"
  | "decoding"
  | "model-loading"
  | "preprocessing"
  | "inference"
  | "post-processing"
  | "encoding"
  | "done";

export interface AudioFileInfo {
  id: string;
  name: string;
  size: number;
  duration: number;
  mimeType: string;
  file: File;
}

export interface SeparationSettings {
  mode: "browser" | "cloud";
  quality: "fast" | "balanced" | "high";
  stems: StemId[];
  exportFormat: "wav" | "mp3" | "flac";
}

export interface SeparationJob {
  id: string;
  status: JobStatus;
  progress: number;
  stage: ProcessingStage;
  error?: string;
  stems?: Record<StemId, string>;
}

export interface StemTrack {
  id: StemId;
  label: string;
  color: string;
  audioBuffer: AudioBuffer | null;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface DeviceCapabilities {
  webgpu: boolean;
  wasmSimd: boolean;
  memoryGB: number | null;
  browser: string;
  cores: number;
  backend: "webgpu" | "wasm" | "cloud";
}

export const STEM_META: Record<StemId, { label: string; labelRu: string; color: string; description: string }> = {
  vocals: { label: "Vocals", labelRu: "Вокал", color: "#a78bfa", description: "Голос и бэк-вокал" },
  drums: { label: "Drums", labelRu: "Ударные", color: "#34d399", description: "Барабаны и перкуссия" },
  bass: { label: "Bass", labelRu: "Бас", color: "#f472b6", description: "Низкие частоты и бас-гитара" },
  other: { label: "Other", labelRu: "Инструменты", color: "#fbbf24", description: "Остальные инструменты" },
};

export const ALL_STEMS: StemId[] = ["vocals", "drums", "bass", "other"];

export const SUPPORTED_FORMATS = ["mp3", "wav", "flac", "m4a", "aac", "ogg"] as const;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
export const MAX_DURATION = 10 * 60; // 10 minutes
export const TARGET_SAMPLE_RATE = 44100;
