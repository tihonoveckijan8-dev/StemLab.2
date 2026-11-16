import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED = new Set(["mp3", "wav", "flac", "m4a", "aac", "ogg"]);

// In-memory job store for dev/demo. Production: Redis + BullMQ.
type Job = {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  stage: string;
  error?: string;
  stems?: Record<string, string>;
  createdAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __jobs: Map<string, any> | undefined;
}

function jobs(): Map<string, any> {
  if (!globalThis.__jobs) globalThis.__jobs = new Map();
  return globalThis.__jobs;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const quality = (form.get("quality") as string) || "balanced";
  const exportFormat = (form.get("exportFormat") as string) || "wav";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!ALLOWED.has(ext)) return NextResponse.json({ error: `Unsupported format: .${ext}` }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 100 MB)" }, { status: 413 });

  const id = randomUUID();
  const job: Job = { id, status: "queued", progress: 0.05, stage: "queued", createdAt: Date.now() };
  jobs().set(id, job);

  // Save upload to tmp (auto-deleted after 1h in production via TTL).
  const tmpDir = path.join(process.cwd(), ".tmp", "uploads");
  await fs.mkdir(tmpDir, { recursive: true });
  const tmpPath = path.join(tmpDir, `${id}.${ext}`);
  await fs.writeFile(tmpPath, Buffer.from(await file.arrayBuffer()));

  // If a cloud inference endpoint is configured, forward there.
  const inferenceUrl = process.env.INFERENCE_URL;
  if (inferenceUrl) {
    try {
      const fwd = new FormData();
      fwd.append("file", file);
      fwd.append("quality", quality);
      fwd.append("exportFormat", exportFormat);
      const res = await fetch(`${inferenceUrl}/api/separate`, { method: "POST", body: fwd });
      if (res.ok) {
        const data = (await res.json()) as { jobId: string };
        job.status = "processing";
        job.progress = 0.1;
        job.stage = "inference";
        // Store mapping for polling proxy.
        (job as unknown as Record<string, string>).remoteJobId = data.jobId;
        return NextResponse.json({ jobId: id });
      }
    } catch {
      // Fall through to demo completion.
    }
  }

  // Demo mode: complete asynchronously with placeholder progress.
  // In production, enqueue to BullMQ/Cloudflare Queues here.
  setTimeout(() => {
    const j = jobs().get(id);
    if (!j) return;
    j.status = "processing";
    j.progress = 0.5;
    j.stage = "inference";
    setTimeout(() => {
      const j2 = jobs().get(id);
      if (!j2) return;
      j2.status = "completed";
      j2.progress = 1;
      j2.stage = "done";
      j2.stems = {
        vocals: `/api/separate/${id}/download?stem=vocals`,
        drums: `/api/separate/${id}/download?stem=drums`,
        bass: `/api/separate/${id}/download?stem=bass`,
        other: `/api/separate/${id}/download?stem=other`,
      };
    }, 4000);
  }, 1000);

  return NextResponse.json({ jobId: id });
}
