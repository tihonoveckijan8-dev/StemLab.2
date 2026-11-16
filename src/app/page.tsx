"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Music2, ArrowRight, Sparkles } from "lucide-react";
import { Dropzone } from "@/components/upload/dropzone";
import { dict, type Locale } from "@/lib/i18n";
import { useState } from "react";

export default function HomePage() {
  const [locale] = useState<Locale>("ru");
  const t = dict[locale];

  return (
    <div className="studio-grid">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-violet-600/15 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> HT-Demucs · ONNX · WebGPU
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              {t.heroTitle.split("на ").map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span className="bg-gradient-to-r from-violet-500 to-fuchsia-400 bg-clip-text text-transparent">на </span>
                  )}
                </span>
              ))}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{t.heroSubtitle}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-600 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> {locale === "ru" ? "100% приватно в Browser-режиме" : "100% private in Browser mode"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                <Zap className="h-4 w-4" /> {locale === "ru" ? "WebGPU-ускорение" : "WebGPU accelerated"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
                <Music2 className="h-4 w-4" /> Vocals · Drums · Bass · Other
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DROPZONE */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6" aria-label="Upload">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Dropzone locale={locale} />
          <div className="mt-4 text-center">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-xl shadow-primary/25 hover:brightness-110"
            >
              {t.startSeparation} <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">{t.copyright}</p>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">{t.howItWorks}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", title: locale === "ru" ? "Загрузите трек" : "Upload a track", desc: locale === "ru" ? "MP3, WAV, FLAC до 100 MB и 10 минут." : "MP3, WAV, FLAC up to 100 MB, 10 minutes." },
            { n: "02", title: locale === "ru" ? "Выберите режим" : "Pick a mode", desc: locale === "ru" ? "Browser-only для приватности или Cloud GPU для скорости." : "Browser-only for privacy or Cloud GPU for speed." },
            { n: "03", title: "HT-Demucs", desc: locale === "ru" ? "ONNX-модель разделяет трек на 4 стема в Web Worker." : "ONNX model splits the track into 4 stems in a Web Worker." },
            { n: "04", title: locale === "ru" ? "Слушайте и скачивайте" : "Listen & download", desc: locale === "ru" ? "Мультитрек-плеер, solo/mute, ZIP и instrumental." : "Multitrack player, solo/mute, ZIP and instrumental." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm font-bold text-primary">{s.n}</p>
              <p className="mt-2 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-600/10 to-fuchsia-500/10 p-6 sm:p-10">
          <h2 className="text-xl font-bold sm:text-2xl">{locale === "ru" ? "Демо: что вы получите" : "Demo: what you get"}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Vocals", color: "#a78bfa", desc: locale === "ru" ? "Вокал для каверов и аранжировок" : "Vocals for covers & arrangements" },
              { label: "Drums", color: "#34d399", desc: locale === "ru" ? "Ударные для ремиксов" : "Drums for remixes" },
              { label: "Bass", color: "#f472b6", desc: locale === "ru" ? "Бас для грува" : "Bass for groove" },
              { label: "Other", color: "#fbbf24", desc: locale === "ru" ? "Инструменты и гармонии" : "Instruments & harmonies" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card p-4 shadow-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <p className="mt-2 font-semibold">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="text-center text-2xl font-bold">{t.faq}</h2>
        <div className="mt-6 space-y-3">
          {[
            {
              q: locale === "ru" ? "Мой файл покидает браузер?" : "Does my file leave the browser?",
              a: locale === "ru" ? "Нет — в Browser-режиме всё происходит локально через ONNX Runtime Web. В Cloud-режиме файл отправляется на GPU-сервер и удаляется через 1 час." : "No — in Browser mode everything runs locally via ONNX Runtime Web. In Cloud mode the file goes to a GPU server and is deleted after 1 hour.",
            },
            {
              q: locale === "ru" ? "Почему обработка долгая без WebGPU?" : "Why is processing slow without WebGPU?",
              a: locale === "ru" ? "Полная модель Demucs — сотни мегабайт. На WASM трек 4 минуты может занять несколько минут. Мы предложим Cloud GPU." : "The full Demucs model is hundreds of MB. On WASM a 4-minute track may take several minutes. We'll suggest Cloud GPU.",
            },
            {
              q: locale === "ru" ? "Какие форматы поддерживаются?" : "Which formats are supported?",
              a: locale === "ru" ? "MP3, WAV, FLAC, M4A, AAC, OGG. Экспорт: WAV, MP3 320 kbps, FLAC (cloud)." : "MP3, WAV, FLAC, M4A, AAC, OGG. Export: WAV, MP3 320 kbps, FLAC (cloud).",
            },
          ].map((f) => (
            <details key={f.q} className="rounded-2xl border border-border bg-card p-5">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
