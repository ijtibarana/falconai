import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "ai-lead-agent",
    version: "0.1.0",
    architectureVersion: "2026-05-11"
  });
}
