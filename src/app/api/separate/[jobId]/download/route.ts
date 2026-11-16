import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Serves a generated stem WAV. In production this proxies R2/S3 signed URLs. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const stem = req.nextUrl.searchParams.get("stem") ?? "vocals";
  if (!["vocals", "drums", "bass", "other"].includes(stem)) {
    return NextResponse.json({ error: "Invalid stem" }, { status: 400 });
  }
  // Demo: return a short silent WAV so the download flow is testable.
  // Real implementation: fetch from object storage.
  const sampleRate = 44100;
  const seconds = 1;
  const dataLen = sampleRate * seconds * 4;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/wav",
      "Content-Disposition": `attachment; filename="${jobId}_${stem}.wav"`,
    },
  });
}
