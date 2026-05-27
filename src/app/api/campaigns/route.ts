import { NextResponse } from "next/server";

import { clearDemoData, createCampaign, listCampaigns, updateCampaign } from "@/lib/storage";
import { createCampaignSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ campaigns: listCampaigns() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid campaign", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json({ campaign: createCampaign(parsed.data) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 404 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    return NextResponse.json({ campaign: updateCampaign(id, updates) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ result: clearDemoData() });
}

