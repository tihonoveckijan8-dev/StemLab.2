"use client";

import Link from "next/link";
import { AudioWaveform, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

export function Header({ locale, setLocale }: { locale: Locale; setLocale: (l: Locale) => void }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
            <AudioWaveform className="h-5 w-5" />
          </span>
          <span className="text-lg">
            AI Stem <span className="bg-gradient-to-r from-violet-500 to-fuchsia-400 bg-clip-text text-transparent">Splitter</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Main">
          <Link href="/studio" className="hover:text-foreground">Studio</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 text-xs font-medium" role="group" aria-label="Language">
            {(["ru", "en"] as Locale[]).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className={`rounded-md px-2.5 py-1 uppercase ${locale === l ? "bg-primary text-white" : "text-muted-foreground"}`}
                aria-pressed={locale === l}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDark(!dark)}
            className="rounded-lg border border-border p-2 hover:bg-muted"
            aria-label={dark ? "Light theme" : "Dark theme"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            href="/studio"
            className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 sm:inline-flex"
          >
            {locale === "ru" ? "Открыть студию" : "Open studio"}
          </Link>
        </div>
      </div>
    </header>
  );
}
