import { NextResponse } from "next/server";

import { evaluateLeadAction } from "@/lib/policy-engine";
import { listCampaigns, listLeads } from "@/lib/storage";
import { policyEvaluationSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = policyEvaluationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid policy request", details: parsed.error.flatten() }, { status: 400 });
  }

  const campaign = listCampaigns().find((item) => item.id === parsed.data.campaignId);
  const lead = listLeads(parsed.data.campaignId).find((item) => item.id === parsed.data.leadId);

  if (!campaign || !lead) {
    return NextResponse.json({ error: "Campaign or lead not found" }, { status: 404 });
  }

  return NextResponse.json({
    decision: evaluateLeadAction({
      campaign,
      lead,
      channel: parsed.data.channel,
      hasRiskAcceptance: parsed.data.hasRiskAcceptance
    })
  });
}
