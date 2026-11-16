"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, History, Trash2 } from "lucide-react";
import { Dropzone } from "@/components/upload/dropzone";
import { SettingsPanel } from "@/components/stems/settings-panel";
import { ProgressPanel } from "@/components/stems/progress-panel";
import { MultitrackPlayerUI } from "@/components/player/multitrack-player";
import { Waveform } from "@/components/waveform/waveform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSessionStore } from "@/stores/session-store";
import { useSeparation } from "@/hooks/use-separation";
import { formatBytes, formatDuration } from "@/lib/utils";
import { dict, type Locale } from "@/lib/i18n";
import { listHistory, clearHistory, type HistoryEntry } from "@/lib/storage/history";
import { useEffect } from "react";

export default function StudioPage() {
  const [locale] = useState<Locale>("ru");
  const t = dict[locale];
  const { file, job, originalBuffer, reset } = useSessionStore();
  const { start, cancel, downloadStem, downloadAllZip, downloadInstrumental } = useSeparation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    void listHistory().then(setHistory);
  }, [job.status]);

  const busy = job.status === "processing" || job.status === "uploading" || job.status === "queued";
  const done = job.status === "completed";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {locale === "ru" ? "Студия разделения" : "Separation studio"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "ru" ? "Загрузите трек, выберите режим и получите 4 стема." : "Upload a track, pick a mode, get 4 stems."}
        </p>
      </motion.div>

      <div className="mt-8 space-y-6">
        {!file && <Dropzone locale={locale} />}

        {file && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="truncate">{file.name}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDuration(file.duration)} · {formatBytes(file.size)} · {file.mimeType || "audio"}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <Waveform buffer={originalBuffer} height={72} />
              <SettingsPanel locale={locale} />
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => void start()} disabled={busy} className="flex-1 sm:flex-none sm:px-10">
                  <Play className="h-5 w-5" /> {t.startProcessing}
                </Button>
                <Button variant="outline" size="lg" onClick={reset}>
                  <RotateCcw className="h-4 w-4" /> {locale === "ru" ? "Сбросить" : "Reset"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t.copyright}</p>
            </CardContent>
          </Card>
        )}

        {busy && <ProgressPanel locale={locale} onCancel={cancel} />}
        {job.status === "failed" && <ProgressPanel locale={locale} onCancel={cancel} />}

        {done && (
          <MultitrackPlayerUI
            locale={locale}
            onDownloadStem={(id) => void downloadStem(id)}
            onDownloadAll={() => void downloadAllZip()}
            onDownloadInstrumental={() => void downloadInstrumental()}
          />
        )}

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> {locale === "ru" ? "История (локально, без файлов)" : "History (local, metadata only)"}
                <button
                  onClick={() => void clearHistory().then(() => setHistory([]))}
                  className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Clear history"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                    <span className="truncate font-medium">{h.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDuration(h.duration)} · {h.mode} · {new Date(h.createdAt).toLocaleDateString(locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
