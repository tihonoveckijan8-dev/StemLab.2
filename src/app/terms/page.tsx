export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold">Условия использования</h1>
      <p className="mt-2 text-sm text-muted-foreground">Terms of Use · Обновлено: 2026-11-16</p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. Сервис</h2>
          <p>AI Stem Splitter разделяет аудиофайлы на стемы (vocals, drums, bass, other) с помощью модели HT-Demucs. Сервис предоставляется «как есть».</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Права на контент</h2>
          <p>Вы гарантируете, что имеете права на загружаемую композицию (владение, лицензия или общественное достояние). Запрещено загружать контент, нарушающий права третьих лиц.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Лимиты</h2>
          <p>Максимальный размер файла — 100 MB, длительность — 10 минут. Cloud-режим может иметь rate limiting и очередь для защиты от злоупотреблений.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Лицензии</h2>
          <p>Demucs открыт под MIT. Веса моделей могут иметь дополнительные условия — проверяйте источник весов перед коммерческим использованием.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Ответственность</h2>
          <p>Мы не несём ответственности за качество разделения, потерю данных или последствия использования результатов. Рекомендуем делать резервные копии оригиналов.</p>
        </section>
      </div>
    </div>
  );
}
