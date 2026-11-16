"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, Cloud, AlertTriangle, ShieldCheck } from "lucide-react";
import { useSessionStore } from "@/stores/session-store";
import { detectCapabilities, recommendMode } from "@/lib/ml/webgpu-detector";
import type { DeviceCapabilities, SeparationSettings } from "@/types";
import { dict, type Locale } from "@/lib/i18n";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SettingsPanel({ locale }: { locale: Locale }) {
  const t = dict[locale];
  const { settings, setSettings } = useSessionStore();
  const [caps, setCaps] = useState<DeviceCapabilities | null>(null);
  const [showCloudConsent, setShowCloudConsent] = useState(false);
  const [pendingMode, setPendingMode] = useState<"browser" | "cloud">("browser");

  useEffect(() => {
    void detectCapabilities().then((c) => {
      setCaps(c);
      // Graceful degradation: suggest cloud when WebGPU missing + low RAM.
      if (recommendMode(c) === "cloud" && settings.mode === "browser") {
        // Keep browser default but show warning; user decides.
      }
    });
  }, [settings.mode]);

  const pickMode = (mode: "browser" | "cloud") => {
    if (mode === "cloud") {
      setPendingMode(mode);
      setShowCloudConsent(true);
    } else {
      setSettings({ mode });
    }
  };

  const confirmCloud = () => {
    setSettings({ mode: pendingMode });
    setShowCloudConsent(false);
  };

  const modes: { id: "browser" | "cloud"; icon: React.ReactNode; title: string; desc: string }[] = [
    { id: "browser", icon: <MonitorSmartphone className="h-5 w-5" />, title: t.browserMode, desc: t.browserDesc },
    { id: "cloud", icon: <Cloud className="h-5 w-5" />, title: t.cloudMode, desc: t.cloudDesc },
  ];

  const qualities: { id: SeparationSettings["quality"]; label: string }[] = [
    { id: "fast", label: t.fast },
    { id: "balanced", label: t.balanced },
    { id: "high", label: t.high },
  ];

  const formats: { id: SeparationSettings["exportFormat"]; label: string }[] = [
    { id: "wav", label: "WAV 44.1 kHz" },
    { id: "mp3", label: "MP3 320 kbps" },
    { id: "flac", label: "FLAC" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">{locale === "ru" ? "Режим обработки" : "Processing mode"}</p>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mode">
          {modes.map((m) => (
            <button
              key={m.id}
              role="radio"
              aria-checked={settings.mode === m.id}
              onClick={() => pickMode(m.id)}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                settings.mode === m.id
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className={cn("rounded-xl p-2", settings.mode === m.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                {m.icon}
              </span>
              <span>
                <span className="block font-semibold">{m.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{m.desc}</span>
              </span>
            </button>
          ))}
        </div>
        {settings.mode === "browser" && caps && !caps.webgpu && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t.webgpuWarning} {caps.memoryGB ? `RAM: ~${caps.memoryGB} GB.` : ""} {locale === "ru" ? "Полная модель Demucs — сотни мегабайт; трек 4 минуты на WASM может занять несколько минут." : "Full Demucs model is hundreds of MB; a 4-minute track on WASM may take several minutes."}
            </span>
          </p>
        )}
        {settings.mode === "browser" && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            {locale === "ru" ? "Файл не покидает устройство. Никаких трекеров без согласия." : "File never leaves your device. No trackers without consent."}
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{t.quality}</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Quality">
          {qualities.map((q) => (
            <button
              key={q.id}
              role="radio"
              aria-checked={settings.quality === q.id}
              onClick={() => setSettings({ quality: q.id })}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                settings.quality === q.id ? "border-primary bg-primary text-white" : "border-border bg-card hover:bg-muted"
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">{t.exportFormat}</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Export format">
          {formats.map((f) => (
            <button
              key={f.id}
              role="radio"
              aria-checked={settings.exportFormat === f.id}
              onClick={() => setSettings({ exportFormat: f.id })}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                settings.exportFormat === f.id ? "border-primary bg-primary text-white" : "border-border bg-card hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {settings.exportFormat === "flac" && settings.mode === "browser" && (
          <p className="mt-2 text-xs text-muted-foreground">
            {locale === "ru" ? "FLAC доступен только в Cloud-режиме — браузерное кодирование FLAC недоступно, будет выдан WAV." : "FLAC is cloud-only — browser FLAC encoding is unavailable, WAV will be delivered."}
          </p>
        )}
      </div>

      <Dialog open={showCloudConsent} onClose={() => setShowCloudConsent(false)}>
        <h2 className="text-lg font-semibold">{t.cloudConsentTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.cloudConsentText}</p>
        <div className="mt-5 flex gap-3">
          <Button onClick={confirmCloud} className="flex-1">{t.consent}</Button>
          <Button variant="outline" onClick={() => setShowCloudConsent(false)} className="flex-1">{t.decline}</Button>
        </div>
      </Dialog>
    </div>
  );
}
