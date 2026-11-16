import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTime(seconds: number): string {
  return formatDuration(seconds);
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function isSupportedAudioFile(file: File): { ok: boolean; reason?: string } {
  const ext = getExtension(file.name);
  const allowed = ["mp3", "wav", "flac", "m4a", "aac", "ogg"];
  if (!allowed.includes(ext)) return { ok: false, reason: `Формат .${ext || "неизвестный"} не поддерживается. Разрешены: ${allowed.join(", ").toUpperCase()}.` };
  return { ok: true };
}

export function estimateRemainingTime(progress: number, elapsedMs: number): number | null {
  if (progress <= 0.01 || progress >= 1) return null;
  const elapsed = elapsedMs / 1000;
  const total = elapsed / progress;
  return Math.max(0, total - elapsed);
}
