# AI Stem Splitter

Разделение любой песни на 4 стема — **vocals, drums, bass, other** — прямо в браузере (ONNX Runtime Web + WebGPU/WASM) с опциональным Cloud GPU режимом.

## Режимы

| Режим | Где обрабатывается | Приватность |
|---|---|---|
| **Browser-only** (по умолчанию) | Web Worker в браузере, HT-Demucs ONNX | Файл не покидает устройство |
| **Cloud GPU** | FastAPI + Demucs на GPU-сервере | Файл загружается, автоудаление через 1 час |

## Быстрый старт

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit-тесты (кодирование, ресемплинг, чанкинг, плеер)
npm run build
```

## ONNX-модель

Положите `htdemucs.onnx` в `public/models/`. Без модели приложение работает
в **demo fallback** (эвристический сплиттер) — весь flow тестируется, но качество
не Demucs. См. `public/models/README.md`.

> Полная модель — сотни мегабайт. На WASM трек 4 минуты может занять несколько
> минут. Если WebGPU недоступен, UI честно предупреждает и предлагает Cloud GPU.

## Cloud GPU

```bash
docker compose up --build
# web: http://localhost:3000
# inference: http://localhost:8000/health
```

Продакшен-деплой: Vercel (frontend) + Cloudflare R2 (временные файлы) +
Modal / RunPod / Replicate (GPU inference). Очередь: Redis + BullMQ или
Cloudflare Queues. В коде `src/app/api/separate/route.ts` — in-memory очередь
для dev; замените на BullMQ в проде.

## Архитектура

```
src/
  app/            # Next.js App Router: /, /studio, /pricing, /privacy, /terms, /api
  components/     # upload, player, stems, waveform, ui, layout
  lib/
    audio/        # decoder, resampler, encoder, player (multitrack)
    ml/           # demucs-runner (ONNX), webgpu-detector, chunking, fallback
    workers/      # separation.worker, wav-encoder.worker
    storage/      # IndexedDB history (metadata only)
  stores/         # Zustand session-store
  hooks/          # use-separation (browser + cloud orchestration)
backend/          # FastAPI + Demucs (GPU)
```

Ключевые принципы:

- Тяжёлый ML — только в Web Worker, main thread не блокируется.
- Отмена через `AbortController` / `worker.postMessage({type:"cancel"})`.
- Реальный прогресс по этапам: decoding → model-loading → preprocessing →
  inference → post-processing → encoding.
- Мультитрек-плеер: один `AudioContext`, синхронный старт всех стемов,
  solo/mute/volume, seek, loop участка.
- История — только метаданные в IndexedDB, без аудиофайлов.

## API

- `POST /api/separate` — multipart upload → `{ jobId }`
- `GET /api/separate/[jobId]` — статус задачи
- `GET /api/separate/[jobId]/download?stem=vocals` — скачивание стема
- `GET /api/health` — health-check

## Лицензии

Demucs — MIT. Лицензии весов зависят от источника — проверяйте перед
коммерческим использованием. Загружайте только треки, на которые у вас есть права.
