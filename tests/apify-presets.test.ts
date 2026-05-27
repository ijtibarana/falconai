import { describe, expect, it } from "vitest";

import { getApifySourcePresets, resolveApifyDiscoveryRequest } from "@/lib/apify-presets";

describe("Apify source presets", () => {
  it("includes the selected sources", () => {
    const keys = getApifySourcePresets().map((preset) => preset.key);

    expect(keys).toEqual(["google_search", "google_maps", "instagram", "tiktok", "website_contacts", "instagram_profile", "tiktok_profile", "facebook_pages"]);
  });

  it("marks Instagram as high-risk cold social by default", () => {
    const request = resolveApifyDiscoveryRequest({
      campaignId: "cmp_b2c_social",
      sourceKey: "instagram"
    });

    expect(request.actorId).toBe("apify/instagram-api-scraper");
    expect(request.defaults.lane).toBe("high_risk_cold_social");
    expect(request.defaults.channel).toBe("instagram");
    expect(request.defaults.consentStatus).toBe("unknown");
  });

  it("uses Google Maps as public business research by default", () => {
    const request = resolveApifyDiscoveryRequest({
      campaignId: "cmp_b2b_expansion",
      sourceKey: "google_maps",
      actorInput: {
        locationQuery: "New York, United States",
        maxCrawledPlacesPerSearch: 5
      }
    });

    expect(request.actorId).toBe("compass/crawler-google-places");
    expect(request.defaults.lane).toBe("public_business_research");
    expect(request.actorInput.locationQuery).toBe("New York, United States");
    expect(request.actorInput.maxCrawledPlacesPerSearch).toBe(5);
  });
});
