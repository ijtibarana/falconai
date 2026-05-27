import { NextResponse } from "next/server";

import { getApifySourcePresets } from "@/lib/apify-presets";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ presets: getApifySourcePresets() });
}
