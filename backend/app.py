"""Cloud GPU inference service (FastAPI + Demucs)."""
import os
import uuid
import asyncio
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="AI Stem Splitter — Cloud Inference")

TMP_DIR = Path(os.environ.get("TMP_DIR", "/tmp/stems"))
TMP_DIR.mkdir(parents=True, exist_ok=True)
MAX_SIZE = 100 * 1024 * 1024
ALLOWED_EXTS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"}

jobs: dict[str, dict] = {}


class JobStatus(BaseModel):
    jobId: str
    status: str
    progress: float
    stage: str
    error: str | None = None
    stems: dict[str, str] | None = None


@app.get("/health")
def health():
    return {"ok": True, "service": "cloud-inference"}


@app.post("/api/separate")
async def separate(
    file: UploadFile = File(...),
    quality: str = Form("balanced"),
    exportFormat: str = Form("wav"),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, f"Unsupported format: {ext}")
    job_id = uuid.uuid4().hex[:12]
    jobs[job_id] = {"status": "queued", "progress": 0.05, "stage": "queued", "error": None, "stems": None}
    tmp = TMP_DIR / f"{job_id}{ext}"
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(413, "File too large")
    tmp.write_bytes(content)
    asyncio.create_task(run_demucs(job_id, tmp, quality, exportFormat))
    return {"jobId": job_id}


async def run_demucs(job_id: str, src: Path, quality: str, export_format: str):
    jobs[job_id].update(status="processing", progress=0.1, stage="inference")
    try:
        # Lazy import so the service can boot without torch in dev.
        import torch  # noqa: F401
        from demucs import separate as demucs_separate  # type: ignore

        out_dir = TMP_DIR / job_id / "out"
        out_dir.mkdir(parents=True, exist_ok=True)
        jobs[job_id].update(progress=0.3, stage="inference")
        await asyncio.to_thread(demucs_separate.main, ["--out", str(out_dir), str(src)])
        jobs[job_id].update(progress=0.8, stage="encoding")
        stems = {}
        for stem in ("vocals", "drums", "bass", "other"):
            found = list(out_dir.rglob(f"{stem}.wav"))
            if found:
                stems[stem] = f"/api/separate/{job_id}/download?stem={stem}"
        jobs[job_id].update(status="completed", progress=1.0, stage="done", stems=stems)
    except Exception as e:  # noqa: BLE001
        jobs[job_id].update(status="failed", progress=0.0, stage="idle", error=str(e))


@app.get("/api/separate/{job_id}")
def status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return JobStatus(jobId=job_id, **job)


@app.get("/api/separate/{job_id}/download")
def download(job_id: str, stem: str):
    if stem not in ("vocals", "drums", "bass", "other"):
        raise HTTPException(400, "Invalid stem")
    base = TMP_DIR / job_id / "out"
    for p in base.rglob(f"{stem}.wav"):
        return FileResponse(p, media_type="audio/wav", filename=f"{job_id}_{stem}.wav")
    raise HTTPException(404, "Stem not ready")
