import { describe, expect, it } from "vitest";

import { normalizeApifyItemToLead } from "@/lib/apify-discovery";
import { campaigns } from "@/lib/mock-data";
import type { ApifyDiscoveryRequest } from "@/lib/types";

describe("Apify discovery normalizer", () => {
  it("maps a generic Apify dataset item into an internal lead", () => {
    const campaign = campaigns.find((item) => item.id === "cmp_b2b_expansion");

    expect(campaign).toBeDefined();

    const request: ApifyDiscoveryRequest = {
      campaignId: "cmp_b2b_expansion",
      actorId: "example/lead-source",
      actorInput: {},
      maxItems: 10,
      timeoutSecs: 60,
      mapping: {
        displayName: "person.name",
        companyName: "company.name",
        email: "person.email",
        sourceUrl: "source.url",
        jurisdiction: "country"
      },
      defaults: {
        leadType: "b2b_contact",
        lane: "consented_inbound",
        jurisdiction: "US",
        segment: "Finance operators",
        sourceType: "apify_actor",
        channel: "email",
        consentStatus: "legitimate_interest"
      }
    };

    const lead = normalizeApifyItemToLead(
      {
        person: { name: "Avery Carter", email: "avery@example.com" },
        company: { name: "Ledgerly" },
        source: { url: "https://example.com/avery" },
        country: "us"
      },
      request,
      campaign!
    );

    expect(lead.displayName).toBe("Avery Carter");
    expect(lead.companyName).toBe("Ledgerly");
    expect(lead.channelIdentities.email).toBe("avery@example.com");
    expect(lead.jurisdiction).toBe("US");
    expect(lead.fitScore).toBeGreaterThanOrEqual(80);
  });
});
