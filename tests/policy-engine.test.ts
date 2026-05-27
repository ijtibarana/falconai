import { describe, expect, it } from "vitest";

import { campaigns, leads } from "@/lib/mock-data";
import { evaluateLeadAction } from "@/lib/policy-engine";

describe("policy engine", () => {
  it("approves a qualified B2B email action with a lawful basis", () => {
    const campaign = campaigns.find((item) => item.id === "cmp_b2b_expansion");
    const lead = leads.find((item) => item.id === "lead_maya");

    expect(campaign).toBeDefined();
    expect(lead).toBeDefined();

    const decision = evaluateLeadAction({
      campaign: campaign!,
      lead: lead!,
      channel: "email",
      hasRiskAcceptance: false
    });

    expect(decision.status).toBe("approved");
    expect(decision.policyCodes).toContain("POLICY_CLEAR");
  });

  it("blocks opted-out consumers before channel routing", () => {
    const campaign = campaigns.find((item) => item.id === "cmp_b2c_social");
    const lead = leads.find((item) => item.id === "lead_olivia");

    expect(campaign).toBeDefined();
    expect(lead).toBeDefined();

    const decision = evaluateLeadAction({
      campaign: campaign!,
      lead: lead!,
      channel: "email",
      hasRiskAcceptance: true
    });

    expect(decision.status).toBe("blocked");
    expect(decision.policyCodes).toContain("SUPPRESSED_IDENTITY");
  });

  it("routes cold social automation to review when permission is unknown", () => {
    const campaign = campaigns.find((item) => item.id === "cmp_b2c_social");
    const lead = leads.find((item) => item.id === "lead_neo");

    expect(campaign).toBeDefined();
    expect(lead).toBeDefined();

    const decision = evaluateLeadAction({
      campaign: campaign!,
      lead: lead!,
      channel: "tiktok",
      hasRiskAcceptance: true
    });

    expect(decision.status).toBe("needs_review");
    expect(decision.policyCodes).toContain("UNKNOWN_SOCIAL_PERMISSION");
    expect(decision.policyCodes).not.toContain("RISK_ACCEPTANCE_REQUIRED");
  });

  it("routes German email marketing to review without explicit permission", () => {
    const campaign = campaigns.find((item) => item.id === "cmp_b2b_expansion");
    const lead = leads.find((item) => item.id === "lead_maya");

    expect(campaign).toBeDefined();
    expect(lead).toBeDefined();

    const decision = evaluateLeadAction({
      campaign: {
        ...campaign!,
        jurisdictions: ["DE"],
        enabledChannels: ["email"]
      },
      lead: {
        ...lead!,
        jurisdiction: "DE",
        consentStatus: "legitimate_interest"
      },
      channel: "email",
      hasRiskAcceptance: false
    });

    expect(decision.status).toBe("needs_review");
    expect(decision.policyCodes).toContain("STRICT_EMAIL_CONSENT_REQUIRED");
  });
});
