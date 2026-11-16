"use client";

import { useEffect, useRef } from "react";
import { computePeaks } from "@/lib/audio/decoder";
import { cn } from "@/lib/utils";

interface WaveformProps {
  buffer: AudioBuffer | null;
  color?: string;
  progress?: number; // 0..1
  height?: number;
  onSeek?: (ratio: number) => void;
  className?: string;
}

export function Waveform({ buffer, color = "#8b5cf6", progress = 0, height = 64, onSeek, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || 600;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const buckets = Math.max(60, Math.floor(width / 3));
    const peaks = buffer ? computePeaks(buffer, buckets) : new Float32Array(buckets).fill(0.08);
    const mid = height / 2;

    for (let i = 0; i < buckets; i++) {
      const x = (i / buckets) * width;
      const h = Math.max(2, peaks[i] * (height - 8));
      const played = i / buckets <= progress;
      ctx.fillStyle = played ? color : `${color}55`;
      ctx.fillRect(x, mid - h / 2, 2, h);
    }
  }, [buffer, color, progress, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)));
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className={cn("w-full cursor-pointer rounded-lg", onSeek && "hover:opacity-90", className)}
      style={{ height }}
      role={onSeek ? "slider" : "img"}
      aria-label="Waveform"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      tabIndex={onSeek ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onSeek) return;
        if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
        if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
      }}
    />
  );
}
