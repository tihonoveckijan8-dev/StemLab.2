"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle, Ban } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { estimateRemainingTime } from "@/lib/utils";
import { dict, type Locale } from "@/lib/i18n";

const STAGES = ["decoding", "model-loading", "preprocessing", "inference", "post-processing", "encoding", "done"] as const;

export function ProgressPanel({ locale, onCancel }: { locale: Locale; onCancel: () => void }) {
  const t = dict[locale];
  const job = useSessionStore((s) => s.job);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const stageLabel: Record<string, string> = {
    decoding: t.decoding,
    "model-loading": t.modelLoading,
    preprocessing: t.preprocessing,
    inference: t.inference,
    "post-processing": t.postProcessing,
    encoding: t.encoding,
    done: t.completed,
    idle: t.processing,
  };

  const remaining = estimateRemainingTime(job.progress, elapsed);
  const currentIdx = STAGES.indexOf(job.stage as (typeof STAGES)[number]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          {job.status === "processing" || job.status === "uploading" || job.status === "queued" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : job.status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : job.status === "failed" ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Ban className="h-5 w-5 text-muted-foreground" />
          )}
          {stageLabel[job.stage] ?? job.stage} · {Math.round(job.progress * 100)}%
        </h2>
        {(job.status === "processing" || job.status === "uploading" || job.status === "queued") && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            {t.cancel}
          </Button>
        )}
      </div>

      <Progress value={job.progress} className="mt-4" />

      <ol className="mt-5 space-y-2" aria-label="Stages">
        {STAGES.map((s, i) => {
          const state = i < currentIdx || job.stage === "done" ? "done" : i === currentIdx ? "current" : "todo";
          return (
            <li key={s} className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  state === "done"
                    ? "bg-emerald-500 text-white"
                    : state === "current"
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span className={state === "todo" ? "text-muted-foreground" : "font-medium"}>{stageLabel[s] ?? s}</span>
            </li>
          );
        })}
      </ol>

      {remaining !== null && (
        <p className="mt-4 text-xs text-muted-foreground">
          {locale === "ru" ? `Осталось примерно ${Math.round(remaining)} сек.` : `About ${Math.round(remaining)}s remaining.`}
        </p>
      )}
      {job.error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          {job.error}
        </p>
      )}
    </motion.div>
  );
}
