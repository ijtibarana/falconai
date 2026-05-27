import { NextResponse } from "next/server";

import { roadmap } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ roadmap });
}
