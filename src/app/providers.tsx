"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Locale } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru");
  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} setLocale={setLocale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  );
}
