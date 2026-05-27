import type {
  Campaign,
  Channel,
  LeadRecord,
  PolicyDecision,
  PolicyEvaluationInput
} from "./types";

const socialChannels = new Set<Channel>(["linkedin", "instagram", "facebook", "tiktok"]);
const strictEmailConsentJurisdictions = new Set(["DE", "GERMANY", "EU"]);

export function evaluateLeadAction(input: PolicyEvaluationInput): PolicyDecision {
  const { campaign, channel, hasRiskAcceptance, lead } = input;
  const policyCodes: string[] = [];

  if (!campaign.enabledChannels.includes(channel)) {
    return block(lead, channel, "CHANNEL_DISABLED", "This channel is not enabled for the campaign.");
  }

  if (lead.optOutStatus !== "clear") {
    return block(
      lead,
      channel,
      "SUPPRESSED_IDENTITY",
      "The lead has opted out, complained, been deleted, or is otherwise suppressed."
    );
  }

  if (!campaign.jurisdictions.includes(lead.jurisdiction)) {
    return review(
      lead,
      channel,
      "UNSUPPORTED_JURISDICTION",
      "The lead jurisdiction is outside the campaign's approved jurisdiction set."
    );
  }

  if (lead.sensitiveCategoryFlags.length > 0) {
    return block(
      lead,
      channel,
      "SENSITIVE_CATEGORY",
      "B2C sensitive-category flags are present and cannot be used for autonomous outreach."
    );
  }

  if (lead.type === "b2c_profile" && channel === "email" && !hasConsumerPermission(lead)) {
    return review(
      lead,
      channel,
      "B2C_PERMISSION_REQUIRED",
      "B2C email outreach needs consent, inbound intent, or a reviewed lawful basis."
    );
  }

  if (
    channel === "email" &&
    strictEmailConsentJurisdictions.has(lead.jurisdiction.toUpperCase()) &&
    !hasStrictEmailPermission(lead)
  ) {
    return review(
      lead,
      channel,
      "STRICT_EMAIL_CONSENT_REQUIRED",
      "This jurisdiction should require explicit email permission before automated marketing."
    );
  }

  if (lead.lane === "high_risk_cold_social" && socialChannels.has(channel)) {
    if (campaign.riskAcceptanceRequired && !hasRiskAcceptance) {
      policyCodes.push("RISK_ACCEPTANCE_REQUIRED");
    }

    if (lead.consentStatus === "unknown") {
      policyCodes.push("UNKNOWN_SOCIAL_PERMISSION");
    }

    if (policyCodes.length > 0) {
      return {
        status: "needs_review",
        channel,
        leadId: lead.id,
        policyCodes,
        explanation:
          "Cold social automation is high-risk and must be reviewed with explicit risk acceptance before execution.",
        requiresHumanReview: true
      };
    }
  }

  if (lead.riskScore >= 85) {
    return review(
      lead,
      channel,
      "HIGH_RISK_SCORE",
      "The lead's combined source, consent, and platform risk score exceeds the autonomous threshold."
    );
  }

  if (lead.fitScore < 60) {
    return review(lead, channel, "LOW_FIT_SCORE", "The lead has weak ICP or audience fit.");
  }

  return {
    status: "approved",
    channel,
    leadId: lead.id,
    policyCodes: ["POLICY_CLEAR"],
    explanation: "Lead is eligible for the selected channel under current campaign policy.",
    requiresHumanReview: false
  };
}

export function getPreferredChannel(campaign: Campaign, lead: LeadRecord): Channel {
  const leadChannels = campaign.enabledChannels.filter((channel) => lead.channelIdentities[channel]);

  if (lead.type === "b2b_contact" && leadChannels.includes("email")) {
    return "email";
  }

  if (lead.type === "b2c_profile") {
    const consentedSocial = leadChannels.find((channel) =>
      ["instagram", "facebook", "tiktok"].includes(channel)
    );

    if (consentedSocial) {
      return consentedSocial;
    }
  }

  return leadChannels[0] ?? campaign.enabledChannels[0] ?? "email";
}

export function summarizeCampaign(campaign: Campaign, leads: LeadRecord[]) {
  const scopedLeads = leads.filter((lead) => lead.campaignId === campaign.id);
  const approved = scopedLeads.filter((lead) => lead.status === "qualified").length;
  const review = scopedLeads.filter((lead) => lead.status === "needs_review").length;
  const blocked = scopedLeads.filter((lead) => ["blocked", "suppressed"].includes(lead.status)).length;
  const averageFitScore = scopedLeads.length
    ? Math.round(scopedLeads.reduce((sum, lead) => sum + lead.fitScore, 0) / scopedLeads.length)
    : 0;

  return {
    totalLeads: scopedLeads.length,
    approved,
    review,
    blocked,
    averageFitScore
  };
}

function hasConsumerPermission(lead: LeadRecord) {
  return ["granted", "soft_opt_in"].includes(lead.consentStatus);
}

function hasStrictEmailPermission(lead: LeadRecord) {
  return ["granted", "soft_opt_in"].includes(lead.consentStatus);
}

function block(lead: LeadRecord, channel: Channel, code: string, explanation: string): PolicyDecision {
  return {
    status: "blocked",
    channel,
    leadId: lead.id,
    policyCodes: [code],
    explanation,
    requiresHumanReview: false
  };
}

function review(lead: LeadRecord, channel: Channel, code: string, explanation: string): PolicyDecision {
  return {
    status: "needs_review",
    channel,
    leadId: lead.id,
    policyCodes: [code],
    explanation,
    requiresHumanReview: true
  };
}
