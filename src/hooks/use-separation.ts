"use client";

import { useCallback, useRef, useState } from "react";
import { useSessionStore } from "@/stores/session-store";
import { decodeAudioFile, bufferToStereoFloat32, stereoToBuffer } from "@/lib/audio/decoder";
import { detectCapabilities } from "@/lib/ml/webgpu-detector";
import { encodeMp3, downloadBlob } from "@/lib/audio/encoder";
import { saveHistory } from "@/lib/storage/history";
import { uid } from "@/lib/utils";
import type { StemId } from "@/types";
import { STEM_META } from "@/types";

interface WorkerProgress {
  id: string;
  type: "progress" | "done" | "error";
  stage?: string;
  progress?: number;
  stems?: Record<StemId, ArrayBuffer>;
  usedFallback?: boolean;
  backend?: string;
  error?: string;
}

export function useSeparation() {
  const { file, settings, setJob, setTracks, setOriginalBuffer, setMeta } = useSessionStore();
  const workerRef = useRef<Worker | null>(null);
  const [canceled, setCanceled] = useState(false);

  const cancel = useCallback(() => {
    setCanceled(true);
    workerRef.current?.postMessage({ type: "cancel" });
    setJob({ status: "canceled", stage: "idle", progress: 0 });
  }, [setJob]);

  const startBrowser = useCallback(
    async (audioBuffer: AudioBuffer) => {
      const jobId = uid();
      setJob({ id: jobId, status: "processing", stage: "decoding", progress: 0.01 });
      const caps = await detectCapabilities();
      const { left, right } = bufferToStereoFloat32(audioBuffer);

      const worker = new Worker(new URL("@/lib/workers/separation.worker.ts", import.meta.url), {
        type: "module",
      });
      workerRef.current = worker;

      return new Promise<void>((resolve, reject) => {
        worker.onmessage = async (event: MessageEvent<WorkerProgress>) => {
          const msg = event.data;
          if (msg.id !== jobId) return;
          if (msg.type === "progress") {
            setJob({ status: "processing", stage: (msg.stage as never) ?? "inference", progress: msg.progress ?? 0 });
          } else if (msg.type === "error") {
            if (msg.error === "canceled") {
              setJob({ status: "canceled", stage: "idle" });
              resolve();
            } else {
              setJob({ status: "failed", stage: "idle", error: msg.error });
              reject(new Error(msg.error));
            }
            worker.terminate();
          } else if (msg.type === "done" && msg.stems) {
            try {
              const ctx = new AudioContext();
              const tracks = await Promise.all(
                (Object.keys(msg.stems) as StemId[]).map(async (id) => {
                  const decoded = await ctx.decodeAudioData(msg.stems![id].slice(0));
                  return {
                    id,
                    label: STEM_META[id].label,
                    color: STEM_META[id].color,
                    audioBuffer: decoded,
                    volume: 0.8,
                    muted: false,
                    solo: false,
                  };
                })
              );
              setTracks(tracks);
              setMeta(!!msg.usedFallback, msg.backend ?? caps.backend);
              setJob({ status: "completed", stage: "done", progress: 1 });
              if (file) {
                void saveHistory({
                  id: jobId,
                  name: file.name,
                  duration: file.duration,
                  size: file.size,
                  createdAt: Date.now(),
                  mode: "browser",
                  quality: settings.quality,
                  stems: tracks.map((t) => t.id),
                });
              }
              resolve();
            } catch (e) {
              setJob({ status: "failed", stage: "idle", error: e instanceof Error ? e.message : "Decode failed" });
              reject(e);
            } finally {
              worker.terminate();
            }
          }
        };
        worker.onerror = (e) => {
          setJob({ status: "failed", stage: "idle", error: e.message || "Worker error" });
          reject(new Error(e.message || "Worker error"));
          worker.terminate();
        };
        worker.postMessage({
          type: "separate",
          payload: {
            id: jobId,
            left,
            right,
            sampleRate: audioBuffer.sampleRate,
            backend: caps.backend === "cloud" ? "wasm" : caps.backend,
            quality: settings.quality,
            exportFormat: settings.exportFormat,
          },
        });
      });
    },
    [file, settings, setJob, setTracks, setMeta]
  );

  const startCloud = useCallback(
    async (audioBuffer: AudioBuffer) => {
      const jobId = uid();
      setJob({ id: jobId, status: "uploading", stage: "decoding", progress: 0.02 });
      const form = new FormData();
      if (file) form.append("file", file.file);
      form.append("quality", settings.quality);
      form.append("exportFormat", settings.exportFormat);

      const res = await fetch("/api/separate", { method: "POST", body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Cloud request failed (${res.status})`);
      }
      const data = (await res.json()) as { jobId: string };
      setJob({ id: data.jobId, status: "queued", stage: "inference", progress: 0.1 });

      // Poll status.
      const poll = async (): Promise<void> => {
        const statusRes = await fetch(`/api/separate/${data.jobId}`);
        if (!statusRes.ok) throw new Error("Status check failed");
        const status = (await statusRes.json()) as {
          status: string;
          progress: number;
          stage: string;
          error?: string;
          stems?: Record<string, string>;
        };
        setJob({
          status: status.status as never,
          stage: status.stage as never,
          progress: status.progress,
          error: status.error,
        });
        if (status.status === "completed" && status.stems) {
          const ctx = new AudioContext();
          const tracks = await Promise.all(
            (Object.keys(status.stems) as StemId[]).map(async (id) => {
              const buf = await (await fetch(status.stems![id])).arrayBuffer();
              const decoded = await ctx.decodeAudioData(buf);
              return {
                id,
                label: STEM_META[id].label,
                color: STEM_META[id].color,
                audioBuffer: decoded,
                volume: 0.8,
                muted: false,
                solo: false,
              };
            })
          );
          setTracks(tracks);
          setMeta(false, "cloud-gpu");
          setJob({ status: "completed", stage: "done", progress: 1 });
          return;
        }
        if (status.status === "failed") throw new Error(status.error ?? "Cloud processing failed");
        if (status.status === "canceled") return;
        await new Promise((r) => setTimeout(r, 1500));
        await poll();
      };
      await poll();
      void audioBuffer;
    },
    [file, settings, setJob, setTracks, setMeta]
  );

  const start = useCallback(async () => {
    if (!file) return;
    setCanceled(false);
    try {
      const { buffer } = await decodeAudioFile(file.file);
      setOriginalBuffer(buffer);
      if (settings.mode === "browser") await startBrowser(buffer);
      else await startCloud(buffer);
    } catch (e) {
      if (!canceled) {
        setJob({ status: "failed", stage: "idle", error: e instanceof Error ? e.message : "Failed" });
      }
    }
  }, [file, settings, startBrowser, startCloud, setOriginalBuffer, setJob, canceled]);

  const downloadStem = useCallback(
    async (stemId: StemId) => {
      const { tracks } = useSessionStore.getState();
      const track = tracks.find((t) => t.id === stemId);
      if (!track?.audioBuffer || !file) return;
      const { left, right } = bufferToStereoFloat32(track.audioBuffer);
      const base = file.name.replace(/\.[^.]+$/, "");
      if (settings.exportFormat === "mp3") {
        const mp3 = await encodeMp3(left, right, track.audioBuffer.sampleRate);
        downloadBlob(new Blob([mp3], { type: "audio/mpeg" }), `${base}_${stemId}.mp3`);
      } else {
        const { encodeWav16Bit } = await import("@/lib/audio/encoder");
        const wav = encodeWav16Bit(left, right, track.audioBuffer.sampleRate);
        downloadBlob(new Blob([wav], { type: "audio/wav" }), `${base}_${stemId}.wav`);
      }
    },
    [file, settings]
  );

  const downloadAllZip = useCallback(async () => {
    const { tracks } = useSessionStore.getState();
    if (!file) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const { encodeWav16Bit } = await import("@/lib/audio/encoder");
    for (const track of tracks) {
      if (!track.audioBuffer) continue;
      const { left, right } = bufferToStereoFloat32(track.audioBuffer);
      const wav = encodeWav16Bit(left, right, track.audioBuffer.sampleRate);
      const base = file.name.replace(/\.[^.]+$/, "");
      zip.file(`${base}_${track.id}.wav`, wav);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const base = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(blob, `${base}_stems.zip`);
  }, [file]);

  const downloadInstrumental = useCallback(async () => {
    const { tracks, originalBuffer } = useSessionStore.getState();
    if (!originalBuffer || !file) return;
    const vocals = tracks.find((t) => t.id === "vocals");
    const orig = bufferToStereoFloat32(originalBuffer);
    let left = orig.left;
    let right = orig.right;
    if (vocals?.audioBuffer) {
      const v = bufferToStereoFloat32(vocals.audioBuffer);
      left = new Float32Array(orig.left.length);
      right = new Float32Array(orig.right.length);
      for (let i = 0; i < orig.left.length; i++) {
        left[i] = orig.left[i] - (v.left[i] ?? 0);
        right[i] = orig.right[i] - (v.right[i] ?? 0);
      }
    }
    const buffer = stereoToBuffer(left, right, originalBuffer.sampleRate);
    const { encodeWav16Bit } = await import("@/lib/audio/encoder");
    const wav = encodeWav16Bit(left, right, buffer.sampleRate);
    const base = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(new Blob([wav], { type: "audio/wav" }), `${base}_instrumental.wav`);
  }, [file]);

  return { start, cancel, downloadStem, downloadAllZip, downloadInstrumental };
}
