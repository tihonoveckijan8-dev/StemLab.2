import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "ai-stem-splitter",
    version: "1.0.0",
    inferenceUrl: process.env.INFERENCE_URL ? "configured" : "demo",
  });
}
