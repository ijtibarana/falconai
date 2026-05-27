import { NextResponse } from "next/server";

import { listAgentRuns, runAgentSimulation } from "@/lib/storage";
import { runAgentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId") ?? undefined;

  return NextResponse.json({ agentRuns: listAgentRuns(campaignId) });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = runAgentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid agent run", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json({
      agentRun: runAgentSimulation(parsed.data.campaignId, parsed.data.hasRiskAcceptance)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 404 });
  }
}
