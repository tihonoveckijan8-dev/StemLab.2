import Link from "next/link";

export function Footer({ locale }: { locale: "ru" | "en" }) {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 text-sm text-muted-foreground sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold text-foreground">AI Stem Splitter</p>
          <p className="mt-2 leading-relaxed">
            {locale === "ru"
              ? "Разделение треков на стемы прямо в браузере. Приватно и бесплатно."
              : "Browser-based stem separation. Private and free."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/privacy" className="hover:text-foreground">{locale === "ru" ? "Политика конфиденциальности" : "Privacy Policy"}</Link>
          <Link href="/terms" className="hover:text-foreground">{locale === "ru" ? "Условия использования" : "Terms of Use"}</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
        </div>
        <p className="leading-relaxed">
          {locale === "ru"
            ? "⚠️ Загружайте только композиции, на которые у вас есть права. Demucs открыт под MIT — соблюдайте лицензии весов."
            : "⚠️ Only upload tracks you have rights to. Demucs is MIT-licensed — respect weight licenses."}
        </p>
      </div>
    </footer>
  );
}
