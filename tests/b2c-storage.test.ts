import { describe, expect, it, vi } from "vitest";

import { discoverLeadsWithApify } from "@/lib/storage";
import type { ApifyDiscoveryRequest, Campaign, LeadRecord } from "@/lib/types";

// Mock runApifyLeadDiscovery to avoid actual Apify network requests
vi.mock("@/lib/apify-discovery", () => ({
  runApifyLeadDiscovery: vi.fn(async (request: ApifyDiscoveryRequest, campaign: Campaign) => {
    return {
      actorId: request.actorId,
      runId: "run_mock_123",
      datasetId: "ds_mock_123",
      rawItemCount: 1,
      importedLeads: [
        {
          id: "lead_mock_1",
          agencyId: campaign.agencyId,
          clientId: campaign.clientId,
          campaignId: campaign.id,
          displayName: "Test Lead",
          type: "b2b_contact", // default
          segment: "retail",
          jurisdiction: "US",
          sourceType: "apify_actor",
          sourceUrl: "https://example.com/test",
          lane: "consented_inbound", // default
          consentStatus: "unknown",
          optOutStatus: "clear",
          fitScore: 85,
          intentScore: 50,
          riskScore: 30,
          sensitiveCategoryFlags: [],
          channelIdentities: { email: "test@example.com" }
        } as LeadRecord
      ]
    };
  })
}));

// Mock node:fs module
vi.mock("node:fs", () => ({
  default: {
    existsSync: vi.fn((path: string) => {
      if (path.endsWith(".data.json")) return true;
      return false;
    }),
    readFileSync: vi.fn((path: string) => {
      if (path.endsWith(".data.json")) {
        return JSON.stringify({
          campaigns: [
            {
              id: "cmp_test_b2b",
              agencyId: "agency_1",
              clientId: "client_1",
              name: "Test B2B Campaign",
              type: "b2b",
              lane: "public_business_research",
              status: "active",
              autonomyLevel: "review_required",
              goal: "B2B test goal",
              offer: "B2B test offer",
              jurisdictions: ["US"],
              dailyActionLimit: 50,
              enabledChannels: ["email"],
              riskAcceptanceRequired: false
            },
            {
              id: "cmp_test_b2c",
              agencyId: "agency_1",
              clientId: "client_1",
              name: "Test B2C Campaign",
              type: "b2c",
              lane: "high_risk_cold_social",
              status: "active",
              autonomyLevel: "review_required",
              goal: "B2C test goal",
              offer: "B2C test offer",
              jurisdictions: ["US"],
              dailyActionLimit: 50,
              enabledChannels: ["email"],
              riskAcceptanceRequired: true
            }
          ],
          leads: [],
          emailConnections: [],
          emailTemplates: [],
          sentMessages: []
        });
      }
      return "";
    }),
    writeFileSync: vi.fn()
  }
}));

describe("discoverLeadsWithApify Campaign Alignment", () => {
  it("forces leads to B2C profile and high risk social lane when campaign type is b2c", async () => {
    const request: ApifyDiscoveryRequest = {
      campaignId: "cmp_test_b2c",
      actorId: "apify/instagram-api-scraper",
      actorInput: {},
      maxItems: 1,
      timeoutSecs: 60,
      mapping: {},
      defaults: {
        leadType: "b2b_contact",
        lane: "consented_inbound",
        jurisdiction: "US",
        segment: "Retail consumers",
        sourceType: "apify_actor",
        consentStatus: "unknown"
      }
    };

    const result = await discoverLeadsWithApify(request);
    expect(result.importedLeads).toHaveLength(1);
    
    const lead = result.importedLeads[0];
    expect(lead.type).toBe("b2c_profile");
    expect(lead.lane).toBe("high_risk_cold_social");
  });

  it("forces leads to B2B contact and public business research lane when campaign type is b2b", async () => {
    const request: ApifyDiscoveryRequest = {
      campaignId: "cmp_test_b2b",
      actorId: "compass/crawler-google-places",
      actorInput: {},
      maxItems: 1,
      timeoutSecs: 60,
      mapping: {},
      defaults: {
        leadType: "b2c_profile",
        lane: "high_risk_cold_social",
        jurisdiction: "US",
        segment: "Retail businesses",
        sourceType: "apify_actor",
        consentStatus: "unknown"
      }
    };

    const result = await discoverLeadsWithApify(request);
    expect(result.importedLeads).toHaveLength(1);
    
    const lead = result.importedLeads[0];
    expect(lead.type).toBe("b2b_contact");
    expect(lead.lane).toBe("public_business_research");
  });
});
