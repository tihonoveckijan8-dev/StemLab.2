"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Repeat, Download, Volume2, VolumeX, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { MultitrackPlayer } from "@/lib/audio/player";
import { useSessionStore } from "@/stores/session-store";
import { Waveform } from "@/components/waveform/waveform";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";
import { dict, type Locale } from "@/lib/i18n";
import { ALL_STEMS } from "@/types";

export function MultitrackPlayerUI({ locale, onDownloadStem, onDownloadAll, onDownloadInstrumental }: {
  locale: Locale;
  onDownloadStem: (id: (typeof ALL_STEMS)[number]) => void;
  onDownloadAll: () => void;
  onDownloadInstrumental: () => void;
}) {
  const t = dict[locale];
  const tracks = useSessionStore((s) => s.tracks);
  const originalBuffer = useSessionStore((s) => s.originalBuffer);
  const updateTrack = useSessionStore((s) => s.updateTrack);
  const usedFallback = useSessionStore((s) => s.usedFallback);
  const backend = useSessionStore((s) => s.backend);

  const playerRef = useRef<MultitrackPlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [loop, setLoop] = useState(false);
  const [loopRange, setLoopRange] = useState<[number, number] | null>(null);

  const duration = useMemo(() => {
    const d = tracks.map((tr) => tr.audioBuffer?.duration ?? 0);
    return d.length ? Math.max(...d) : 0;
  }, [tracks]);

  useEffect(() => {
    if (!playerRef.current) playerRef.current = new MultitrackPlayer();
    const p = playerRef.current;
    p.loadTracks(tracks);
    p.onTimeUpdate = (t) => {
      setTime(t);
      if (loop && loopRange && t >= loopRange[1]) {
        p.seek(loopRange[0]);
      }
    };
    p.onEnded = () => setPlaying(false);
    return () => {
      p.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  useEffect(() => {
    return () => playerRef.current?.dispose();
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pause();
      setPlaying(false);
    } else {
      p.play();
      setPlaying(true);
    }
  };

  const progress = duration > 0 ? time / duration : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {usedFallback && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          {t.demoFallback} Backend: {backend || "fallback"}
        </p>
      )}

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="h-12 w-12 rounded-full">
            {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
          </Button>
          <div className="text-sm tabular-nums">
            <span className="font-semibold">{formatDuration(time)}</span>
            <span className="text-muted-foreground"> / {formatDuration(duration)}</span>
          </div>
          <Button
            variant={loop ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (loop) {
                setLoop(false);
                setLoopRange(null);
              } else {
                setLoop(true);
                setLoopRange([Math.max(0, time - 5), Math.min(duration, time + 5)]);
              }
            }}
            aria-pressed={loop}
          >
            <Repeat className="h-4 w-4" /> {locale === "ru" ? "Петля ±5с" : "Loop ±5s"}
          </Button>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onDownloadInstrumental}>
              <Download className="h-4 w-4" /> {t.instrumental}
            </Button>
            <Button size="sm" onClick={onDownloadAll}>
              <Download className="h-4 w-4" /> {t.downloadAll}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{locale === "ru" ? "Оригинал" : "Original"}</p>
          <Waveform
            buffer={originalBuffer}
            color="#8b5cf6"
            progress={progress}
            height={56}
            onSeek={(r) => playerRef.current?.seek(r * duration)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => {
          const anySolo = tracks.some((x) => x.solo);
          const audible = !track.muted && (!anySolo || track.solo);
          return (
            <div
              key={track.id}
              className={`rounded-2xl border p-4 transition-all ${audible ? "border-border bg-card" : "border-border/50 bg-card/50 opacity-60"}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: track.color }}
                  aria-hidden
                />
                <span className="font-semibold">{track.label}</span>
                <span className="text-xs text-muted-foreground">
                  {locale === "ru" ? track.label : track.label}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <Button
                    variant={track.solo ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      updateTrack(track.id, { solo: !track.solo });
                      playerRef.current?.setSolo(track.id, !track.solo);
                    }}
                    aria-pressed={track.solo}
                    aria-label={`Solo ${track.label}`}
                  >
                    <Lock className="h-3.5 w-3.5" /> Solo
                  </Button>
                  <Button
                    variant={track.muted ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      updateTrack(track.id, { muted: !track.muted });
                      playerRef.current?.setMuted(track.id, !track.muted);
                    }}
                    aria-pressed={track.muted}
                    aria-label={`Mute ${track.label}`}
                  >
                    {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />} Mute
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDownloadStem(track.id)} aria-label={`Download ${track.label}`}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px] md:items-center">
                <Waveform
                  buffer={track.audioBuffer}
                  color={track.color}
                  progress={progress}
                  height={48}
                  onSeek={(r) => playerRef.current?.seek(r * duration)}
                />
                <Slider
                  label={`${track.label} volume`}
                  value={track.volume}
                  onChange={(v) => {
                    updateTrack(track.id, { volume: v });
                    playerRef.current?.setVolume(track.id, v);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-3 py-1.5">{t.karaoke} = original − vocals</span>
        <span className="rounded-full bg-muted px-3 py-1.5">{t.acapella} = vocals</span>
      </div>
    </motion.div>
  );
}
