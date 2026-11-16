export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold">Политика конфиденциальности</h1>
      <p className="mt-2 text-sm text-muted-foreground">Privacy Policy · Обновлено: 2026-11-16</p>
      <div className="prose prose-neutral mt-8 max-w-none space-y-6 text-sm leading-relaxed dark:prose-invert">
        <section>
          <h2 className="text-lg font-semibold">1. Browser-only режим (по умолчанию)</h2>
          <p>В этом режиме аудиофайл обрабатывается полностью на вашем устройстве через ONNX Runtime Web (WebGPU / WASM). Файл не отправляется на сервер, не сохраняется и не анализируется третьими лицами. История обработок хранится локально в IndexedDB и содержит только метаданные (название, длительность, режим) — аудиофайлы не сохраняются без вашего явного согласия.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Cloud GPU режим</h2>
          <p>Если вы явно выбираете Cloud GPU, файл загружается на защищённый серверный воркер для GPU-обработки. Перед отправкой показывается модальное окно согласия. Загруженные файлы и результаты автоматически удаляются через 1 час (настраивается). Мы не используем файлы для обучения моделей.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Трекеры и cookies</h2>
          <p>Мы не используем сторонние трекеры без вашего согласия. Аналитика, если подключена, работает только после opt-in.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Ваши права</h2>
          <p>Вы можете очистить локальную историю в любой момент в разделе Studio. Для вопросов о Cloud-обработке напишите нам — удалим данные досрочно.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Авторские права</h2>
          <p>Вы несёте ответственность за загружаемые композиции. Загружайте только треки, на которые у вас есть права. Модель Demucs открыта под MIT; при использовании весов соблюдайте лицензии конкретного источника.</p>
        </section>
      </div>
    </div>
  );
}
