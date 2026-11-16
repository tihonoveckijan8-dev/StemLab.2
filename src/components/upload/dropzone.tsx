"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileAudio, X, AlertTriangle } from "lucide-react";
import { MAX_FILE_SIZE, MAX_DURATION } from "@/types";
import { formatBytes, formatDuration, isSupportedAudioFile, uid } from "@/lib/utils";
import { decodeAudioFile } from "@/lib/audio/decoder";
import { useSessionStore } from "@/stores/session-store";
import type { Locale } from "@/lib/i18n";
import { dict } from "@/lib/i18n";

export function Dropzone({ locale }: { locale: Locale }) {
  const t = dict[locale];
  const setFile = useSessionStore((s) => s.setFile);
  const file = useSessionStore((s) => s.file);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(
    async (f: File) => {
      setError(null);
      const check = isSupportedAudioFile(f);
      if (!check.ok) {
        setError(check.reason ?? "Unsupported format");
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`Файл слишком большой: ${formatBytes(f.size)}. Максимум ${formatBytes(MAX_FILE_SIZE)}.`);
        return;
      }
      setLoading(true);
      try {
        const { buffer } = await decodeAudioFile(f);
        if (buffer.duration > MAX_DURATION) {
          setError(`Трек слишком длинный: ${formatDuration(buffer.duration)}. Максимум ${formatDuration(MAX_DURATION)}.`);
          return;
        }
        setFile({
          id: uid(),
          name: f.name,
          size: f.size,
          duration: buffer.duration,
          mimeType: f.type,
          file: f,
        });
      } catch {
        setError("Не удалось декодировать файл. Возможно, формат не поддерживается браузером.");
      } finally {
        setLoading(false);
      }
    },
    [setFile]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void validate(f);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={t.dropTitle}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
          dragging
            ? "border-primary bg-primary/10 scale-[1.01]"
            : "border-border bg-card/60 hover:border-primary/50 hover:bg-card"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.flac,.m4a,.aac,.ogg,audio/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void validate(f);
          }}
        />
        <motion.div
          animate={dragging ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-xl shadow-violet-500/30"
        >
          <UploadCloud className="h-8 w-8" />
        </motion.div>
        <p className="text-lg font-semibold">{loading ? "Анализ файла…" : t.dropTitle}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.dropHint}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <FileAudio className="h-3.5 w-3.5" /> 🔒 {locale === "ru" ? "Файл не покидает устройство в Browser-режиме" : "File never leaves your device in Browser mode"}
        </p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {file && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileAudio className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDuration(file.duration)} · {formatBytes(file.size)} · {file.mimeType || "audio"}
            </p>
          </div>
          <button
            onClick={() => setFile(null)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            aria-label="Remove file"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
