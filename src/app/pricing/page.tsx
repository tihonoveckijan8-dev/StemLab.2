import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Browser Free",
      price: "0 ₽",
      features: ["Browser-only режим", "4 стема HT-Demucs", "WAV / MP3 экспорт", "Без регистрации", "Приватно: файл не покидает устройство"],
      cta: "Начать бесплатно",
      highlight: true,
    },
    {
      name: "Cloud GPU",
      price: "Pay-as-you-go",
      features: ["GPU-ускорение (Modal / RunPod)", "FLAC экспорт", "Очередь и приоритеты", "Автоудаление через 1 час", "Для слабых устройств"],
      cta: "Попробовать Cloud",
      highlight: false,
    },
    {
      name: "Pro / Studio",
      price: "Скоро",
      features: ["Batch-обработка", "API-доступ", "Высокий приоритет", "Коммерческая лицензия весов", "Поддержка"],
      cta: "В лист ожидания",
      highlight: false,
    },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-center text-3xl font-extrabold sm:text-4xl">Pricing</h1>
      <p className="mt-3 text-center text-muted-foreground">Browser-режим бесплатен навсегда. Cloud GPU — по факту использования.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`rounded-3xl border p-6 ${p.highlight ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" : "border-border bg-card"}`}>
            <p className="font-semibold">{p.name}</p>
            <p className="mt-2 text-2xl font-extrabold">{p.price}</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/studio" className={`mt-6 block rounded-xl px-4 py-3 text-center font-medium ${p.highlight ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
