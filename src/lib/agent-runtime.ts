import { randomUUID } from "node:crypto";

import { agents } from "./mock-data";
import { evaluateLeadAction, getPreferredChannel } from "./policy-engine";
import type {
  AgentRunResult,
  Campaign,
  GeneratedMessage,
  LeadRecord,
  ToolCallSummary
} from "./types";

interface RunSimulationInput {
  campaign: Campaign;
  leads: LeadRecord[];
  hasRiskAcceptance: boolean;
}

export function runAutonomySimulation(input: RunSimulationInput): AgentRunResult {
  const startedAt = new Date();
  const scopedLeads = input.leads.filter((lead) => lead.campaignId === input.campaign.id);

  const decisions = scopedLeads.map((lead) =>
    evaluateLeadAction({
      campaign: input.campaign,
      lead,
      channel: getPreferredChannel(input.campaign, lead),
      hasRiskAcceptance: input.hasRiskAcceptance
    })
  );

  const generatedMessages = decisions
    .filter((decision) => decision.status === "approved")
    .slice(0, 4)
    .map((decision): GeneratedMessage => {
      const lead = scopedLeads.find((item) => item.id === decision.leadId);

      return {
        channel: decision.channel,
        leadId: decision.leadId,
        subject: decision.channel === "email" ? `Idea for ${lead?.companyName ?? lead?.displayName}` : undefined,
        body: buildMessageBody(input.campaign, lead, decision.channel),
        claims: [
          "Uses approved campaign offer",
          "Avoids sensitive personal traits",
          "Requires source-backed personalization before production send"
        ]
      };
    });

  const blockedActions = decisions.filter((decision) => decision.status === "blocked").length;
  const reviewActions = decisions.filter((decision) => decision.status === "needs_review").length;
  const approvedActions = decisions.filter((decision) => decision.status === "approved").length;
  const averageFitScore = scopedLeads.length
    ? Math.round(scopedLeads.reduce((sum, lead) => sum + lead.fitScore, 0) / scopedLeads.length)
    : 0;

  const completedAt = new Date(startedAt.getTime() + 1470);

  return {
    id: `run_${randomUUID()}`,
    campaignId: input.campaign.id,
    status: "completed",
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    summary: {
      leadsEvaluated: scopedLeads.length,
      approvedActions,
      reviewActions,
      blockedActions,
      averageFitScore
    },
    decisions,
    generatedMessages,
    toolCalls: buildToolCalls(input.campaign.type)
  };
}

function buildMessageBody(campaign: Campaign, lead: LeadRecord | undefined, channel: string) {
  const name = lead?.displayName ?? "there";
  const context =
    lead?.type === "b2b_contact"
      ? `teams like ${lead.companyName ?? "yours"}`
      : "people who have shown interest in this kind of offer";

  if (channel === "email") {
    return `Hi ${name},\n\nI noticed ${context} often need a simple next step before committing. ${campaign.offer} could be a useful way to evaluate fit without a long sales process.\n\nWould you be open to a quick look this week?\n\nYou can opt out of future messages at any time.`;
  }

  return `Hi ${name}, quick note from ${campaign.name}: ${campaign.offer}. If this is useful, I can send the short details.`;
}

function buildToolCalls(campaignType: Campaign["type"]): ToolCallSummary[] {
  const agentCount = agents.filter((agent) => agent.status !== "blocked").length;

  return [
    {
      toolName: "consent.check",
      status: "success",
      evidence: `Checked consent, lawful basis, and suppression state across ${agentCount} active agents.`
    },
    {
      toolName: "policy.evaluate",
      status: "success",
      evidence: `Applied ${campaignType.toUpperCase()} channel and jurisdiction policies.`
    },
    {
      toolName: "vector.search",
      status: "success",
      evidence: "Retrieved scoped brand voice, objection handling, and approved message examples."
    },
    {
      toolName: "browser.social_action",
      status: campaignType === "b2c" ? "blocked" : "skipped",
      evidence:
        campaignType === "b2c"
          ? "Browser automation remains gated until risk acceptance and per-account limits are active."
          : "No browser action required for this run."
    }
  ];
}
