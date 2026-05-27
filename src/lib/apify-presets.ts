import type {
  ApifyDiscoveryRequest,
  ApifySourceKey,
  ApifySourcePreset,
  Channel,
  ConsentStatus,
  LeadLane
} from "./types";

interface PresetRequestInput {
  campaignId: string;
  sourceKey?: ApifySourceKey;
  actorId?: string;
  actorInput?: Record<string, unknown>;
  maxItems?: number;
  timeoutSecs?: number;
  mapping?: Record<string, string | undefined>;
  defaults?: {
    leadType?: "b2b_contact" | "b2c_profile";
    lane?: LeadLane;
    jurisdiction?: string;
    segment?: string;
    sourceType?: string;
    channel?: Channel;
    consentStatus?: ConsentStatus;
  };
}

export function getApifySourcePresets(): ApifySourcePreset[] {
  return [
    {
      key: "google_search",
      label: "Google Search",
      actorId: process.env.APIFY_GOOGLE_SEARCH_ACTOR_ID || "apify/google-search-scraper",
      riskLevel: "medium",
      recommendedUse: "Find shop websites, boutiques, blogs, directories, and market research pages.",
      notFor: "Do not treat search results as consent to email consumers.",
      defaultActorInput: {
        queries: "modest fashion boutique UK\nIslamic clothing store USA\nabaya coat shop Germany",
        countryCode: "us",
        languageCode: "en",
        maxPagesPerQuery: 1,
        maxConcurrency: 5
      },
      mapping: {
        displayName: "title",
        companyName: "title",
        sourceUrl: "url",
        segment: "searchQuery.term",
        jurisdiction: "searchQuery.countryCode"
      },
      defaults: {
        leadType: "b2b_contact",
        lane: "public_business_research",
        jurisdiction: "US",
        segment: "Search-discovered modest fashion business",
        sourceType: "apify_google_search",
        channel: "email",
        consentStatus: "legitimate_interest"
      }
    },
    {
      key: "google_maps",
      label: "Google Maps",
      actorId: process.env.APIFY_GOOGLE_MAPS_ACTOR_ID || "compass/crawler-google-places",
      riskLevel: "medium",
      recommendedUse: "Find public business listings for Islamic clothing stores and modest fashion boutiques.",
      notFor: "Do not use reviewer personal data or private consumer profiles for email marketing.",
      defaultActorInput: {
        searchStringsArray: ["Islamic clothing store", "modest fashion boutique", "abaya store"],
        locationQuery: "London, United Kingdom",
        maxCrawledPlacesPerSearch: 5,
        website: "allPlaces",
        skipClosedPlaces: true,
        scrapePlaceDetailPage: true,
        scrapeContacts: true,
        scrapeReviewsPersonalData: false
      },
      mapping: {
        displayName: "title",
        companyName: "title",
        email: "emails",
        sourceUrl: "url",
        jurisdiction: "countryCode",
        segment: "categoryName"
      },
      defaults: {
        leadType: "b2b_contact",
        lane: "public_business_research",
        jurisdiction: "UK",
        segment: "Google Maps modest fashion business",
        sourceType: "apify_google_maps",
        channel: "email",
        consentStatus: "legitimate_interest"
      }
    },
    {
      key: "instagram",
      label: "Instagram",
      actorId: process.env.APIFY_INSTAGRAM_ACTOR_ID || "apify/instagram-api-scraper",
      riskLevel: "high",
      recommendedUse: "Creator discovery, public brand research, hashtag research, and manual partnership review.",
      notFor: "Do not scrape private consumers' emails or auto-DM people from religious targeting.",
      defaultActorInput: {
        directUrls: ["https://www.instagram.com/explore/tags/modestfashion/"],
        resultsType: "posts",
        resultsLimit: 5,
        searchLimit: 1
      },
      mapping: {
        displayName: "ownerFullName",
        socialHandle: "ownerUsername",
        profileUrl: "ownerUrl",
        sourceUrl: "url",
        segment: "caption"
      },
      defaults: {
        leadType: "b2c_profile",
        lane: "high_risk_cold_social",
        jurisdiction: "US",
        segment: "Instagram modest fashion research lead",
        sourceType: "apify_instagram",
        channel: "instagram",
        consentStatus: "unknown"
      }
    },
    {
      key: "tiktok",
      label: "TikTok",
      actorId: process.env.APIFY_TIKTOK_ACTOR_ID || "dltik/tiktok-scraper",
      riskLevel: "high",
      recommendedUse: "Creator discovery, content research, hashtag research, and manual partnership review.",
      notFor: "Do not scrape consumers' contact data or auto-DM users from religious targeting.",
      defaultActorInput: {
        mode: "search",
        searchQuery: "modest fashion long coat",
        searchType: "keyword",
        maxItems: 5
      },
      mapping: {
        displayName: "author.nickname",
        socialHandle: "author.username",
        profileUrl: "author.url",
        sourceUrl: "video.url",
        segment: "video.title"
      },
      defaults: {
        leadType: "b2c_profile",
        lane: "high_risk_cold_social",
        jurisdiction: "US",
        segment: "TikTok modest fashion research lead",
        sourceType: "apify_tiktok",
        channel: "tiktok",
        consentStatus: "unknown"
      }
    },
    {
      key: "website_contacts",
      label: "Website Contact Scraper",
      actorId: process.env.APIFY_CONTACTS_ACTOR_ID || "apify/contact-details-scraper",
      riskLevel: "low",
      recommendedUse: "Extract emails and phone numbers directly from a list of target website domains.",
      notFor: "Do not crawl personal profiles or non-business URLs.",
      defaultActorInput: {
        startUrls: [{ url: "https://example.com" }],
        maxCrawlDepth: 1,
        stayWithinDomain: true,
        maxCrawlPages: 20
      },
      mapping: {
        displayName: "url",
        companyName: "url",
        email: "emails",
        sourceUrl: "url",
        jurisdiction: "countryCode",
        segment: "title"
      },
      defaults: {
        leadType: "b2b_contact",
        lane: "consented_inbound",
        jurisdiction: "UK",
        segment: "Website direct contact",
        sourceType: "apify_website_contact",
        channel: "email",
        consentStatus: "legitimate_interest"
      }
    },
    {
      key: "instagram_profile",
      label: "Instagram Profile Email Extractor",
      actorId: process.env.APIFY_GOOGLE_SEARCH_ACTOR_ID || "apify/google-search-scraper",
      riskLevel: "high",
      recommendedUse: "Extract public contact email addresses and bio data from Instagram creator profiles using Google index query.",
      notFor: "Do not scrape private personal consumer profiles.",
      defaultActorInput: {
        queries: "site:instagram.com \"Islamic clothing store\" \"London\" \"@gmail.com\" OR \"@yahoo.com\" OR \"email\"",
        maxPagesPerQuery: 1,
        maxConcurrency: 5
      },
      mapping: {
        displayName: "title",
        companyName: "title",
        email: "email",
        socialHandle: "username",
        profileUrl: "url",
        sourceUrl: "url",
        segment: "description"
      },
      defaults: {
        leadType: "b2c_profile",
        lane: "high_risk_cold_social",
        jurisdiction: "US",
        segment: "Instagram profile lead",
        sourceType: "apify_instagram_profile",
        channel: "instagram",
        consentStatus: "unknown"
      }
    },
    {
      key: "tiktok_profile",
      label: "TikTok Profile Email Extractor",
      actorId: process.env.APIFY_TIKTOK_PROFILE_ACTOR_ID || "apify/tiktok-profile-scraper",
      riskLevel: "high",
      recommendedUse: "Extract public emails and bio details from TikTok influencer profiles.",
      notFor: "Do not crawl private consumer accounts.",
      defaultActorInput: {
        profiles: ["modestfashion"],
        resultsLimit: 5
      },
      mapping: {
        displayName: "nickname",
        companyName: "nickname",
        email: "email",
        socialHandle: "uniqueId",
        profileUrl: "url",
        sourceUrl: "url",
        segment: "signature"
      },
      defaults: {
        leadType: "b2c_profile",
        lane: "high_risk_cold_social",
        jurisdiction: "US",
        segment: "TikTok profile lead",
        sourceType: "apify_tiktok_profile",
        channel: "tiktok",
        consentStatus: "unknown"
      }
    },
    {
      key: "facebook_pages",
      label: "Facebook Pages Email Extractor",
      actorId: process.env.APIFY_FACEBOOK_PAGES_ACTOR_ID || "apify/facebook-pages-scraper",
      riskLevel: "medium",
      recommendedUse: "Scrape public emails and contact details from Facebook business pages.",
      notFor: "Do not scrape personal Facebook user profile timelines.",
      defaultActorInput: {
        startUrls: [{ url: "https://www.facebook.com/search/pages/?q=modest%20fashion" }],
        maxResults: 5
      },
      mapping: {
        displayName: "name",
        companyName: "name",
        email: "email",
        sourceUrl: "url",
        segment: "category"
      },
      defaults: {
        leadType: "b2b_contact",
        lane: "public_business_research",
        jurisdiction: "US",
        segment: "Facebook Page business lead",
        sourceType: "apify_facebook_pages",
        channel: "email",
        consentStatus: "legitimate_interest"
      }
    }
  ];
}

export function getApifySourcePreset(sourceKey: ApifySourceKey) {
  return getApifySourcePresets().find((preset) => preset.key === sourceKey);
}

export function resolveApifyDiscoveryRequest(input: PresetRequestInput): ApifyDiscoveryRequest {
  const preset = input.sourceKey ? getApifySourcePreset(input.sourceKey) : undefined;
  const actorId = input.actorId ?? preset?.actorId;

  if (!actorId) {
    throw new Error("Apify actorId is required. Select a source preset or pass actorId directly.");
  }

  return {
    campaignId: input.campaignId,
    actorId,
    actorInput: {
      ...(preset?.defaultActorInput ?? {}),
      ...(input.actorInput ?? {})
    },
    maxItems: input.maxItems ?? 5,
    timeoutSecs: input.timeoutSecs ?? 120,
    mapping: {
      ...(preset?.mapping ?? {}),
      ...(input.mapping ?? {})
    },
    defaults: {
      leadType: input.defaults?.leadType ?? preset?.defaults.leadType ?? "b2b_contact",
      lane: input.defaults?.lane ?? preset?.defaults.lane ?? "public_business_research",
      jurisdiction: input.defaults?.jurisdiction ?? preset?.defaults.jurisdiction ?? "US",
      segment: input.defaults?.segment ?? preset?.defaults.segment ?? "Apify discovered lead",
      sourceType: input.defaults?.sourceType ?? preset?.defaults.sourceType ?? "apify_actor",
      channel: input.defaults?.channel ?? preset?.defaults.channel,
      consentStatus: input.defaults?.consentStatus ?? preset?.defaults.consentStatus ?? "unknown"
    }
  };
}
