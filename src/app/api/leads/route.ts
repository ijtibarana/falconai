import { NextResponse } from "next/server";

import { clearLeads, listLeads } from "@/lib/storage";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;

  return NextResponse.json({ leads: listLeads(campaignId) });
}

export function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;

  return NextResponse.json({ result: clearLeads(campaignId) });
}
