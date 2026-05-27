import { randomUUID } from "node:crypto";

import { ApifyClient } from "apify-client";

import type {
  ApifyDiscoveryRequest,
  ApifyDiscoveryResult,
  ApifyFieldMapping,
  Campaign,
  Channel,
  LeadRecord
} from "./types";

type ApifyDatasetItem = Record<string, unknown>;

const displayNameFallbacks = [
  "displayName",
  "fullName",
  "name",
  "title",
  "contactName",
  "authorName",
  "profileName",
  "username"
];

const companyFallbacks = ["companyName", "company", "organization", "businessName", "placeName", "title", "name"];
const emailFallbacks = [
  "email",
  "emails",
  "emailAddress",
  "emailAddresses",
  "mail",
  "mails",
  "contactEmail",
  "contactEmails",
  "socials.email",
  "socials.emails"
];
const handleFallbacks = ["handle", "username", "userName", "profileUsername"];
const profileUrlFallbacks = ["profileUrl", "profileURL", "url", "link", "publicUrl"];
const sourceUrlFallbacks = ["sourceUrl", "sourceURL", "url", "link", "website", "profileUrl", "google_maps_url"];
const jurisdictionFallbacks = ["jurisdiction", "countryCode", "country", "region"];
const segmentFallbacks = ["segment", "categoryName", "category", "industry", "headline", "description"];

export async function runApifyLeadDiscovery(
  request: ApifyDiscoveryRequest,
  campaign: Campaign
): Promise<ApifyDiscoveryResult> {
  const token = process.env.APIFY_TOKEN;

  if (!token) {
    throw new Error("APIFY_TOKEN is missing. Add it to .env.local before running real discovery.");
  }

  const client = new ApifyClient({ token });
  const run = await client.actor(request.actorId).call(request.actorInput, {
    waitSecs: request.timeoutSecs
  });

  if (!run.defaultDatasetId) {
    throw new Error(`Apify actor ${request.actorId} finished without a default dataset.`);
  }

  const { items } = await client.dataset<ApifyDatasetItem>(run.defaultDatasetId).listItems({
    clean: true,
    limit: request.maxItems
  });

  const importedLeads = items.map((item) => normalizeApifyItemToLead(item, request, campaign));

  return {
    actorId: request.actorId,
    runId: run.id,
    datasetId: run.defaultDatasetId,
    rawItemCount: items.length,
    importedLeads
  };
}

export function normalizeApifyItemToLead(
  item: ApifyDatasetItem,
  request: ApifyDiscoveryRequest,
  campaign: Campaign
): LeadRecord {
  const displayName = readMappedString(item, request.mapping, "displayName", displayNameFallbacks);
  const companyName = readMappedString(item, request.mapping, "companyName", companyFallbacks);
  let email = readMappedString(item, request.mapping, "email", emailFallbacks);
  const socialHandle = readMappedString(item, request.mapping, "socialHandle", handleFallbacks);
  const profileUrl = readMappedString(item, request.mapping, "profileUrl", profileUrlFallbacks);
  const sourceUrl = readMappedString(item, request.mapping, "sourceUrl", sourceUrlFallbacks);

  // Robust Email Scan: If email is not found, extract any email address from any string fields in the item
  if (!email) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const itemString = JSON.stringify(item);
    const matches = itemString.match(emailRegex);
    if (matches && matches.length > 0) {
      email = matches[0];
    }
  }

  // Parse Instagram username if profileUrl is an Instagram link
  let parsedUsername = socialHandle;
  const targetUrl = profileUrl ?? sourceUrl;
  if (!parsedUsername && targetUrl && targetUrl.includes("instagram.com/")) {
    const parts = targetUrl.split("instagram.com/")[1]?.split("/");
    if (parts && parts[0]) {
      parsedUsername = parts[0].split("?")[0].trim();
    }
  }

  // Squeaky-clean display name logic (removes Google Search suffixes like "• Instagram photos")
  let cleanDisplayName = displayName ?? companyName ?? parsedUsername ?? "Apify discovered lead";
  if (cleanDisplayName.includes("• Instagram photos")) {
    cleanDisplayName = cleanDisplayName.split("• Instagram")[0].trim();
  }
  if (cleanDisplayName.includes("(@")) {
    // If username is in the display name, make it more readable
    const parts = cleanDisplayName.split("(@");
    cleanDisplayName = parts[0].trim();
  }

  const jurisdiction =
    readMappedString(item, request.mapping, "jurisdiction", jurisdictionFallbacks) ??
    request.defaults.jurisdiction;
  const segment =
    readMappedString(item, request.mapping, "segment", segmentFallbacks) ?? request.defaults.segment;
  const channelIdentities = buildChannelIdentities(request.defaults.channel, email, parsedUsername ?? socialHandle, profileUrl);

  const website = readMappedString(item, request.mapping, "website" as any, ["website", "url", "sourceUrl"]);
  const phone = readMappedString(item, request.mapping, "phone" as any, ["phone", "phoneNumber", "phoneNormalized", "telephone"]);
  const address = readMappedString(item, request.mapping, "address" as any, ["address", "street", "city", "postalCode", "addressString", "location"]);

  return {
    id: `lead_${randomUUID()}`,
    agencyId: campaign.agencyId,
    clientId: campaign.clientId,
    campaignId: campaign.id,
    displayName: cleanDisplayName,
    type: request.defaults.leadType,
    companyName: request.defaults.leadType === "b2b_contact" ? (companyName ?? cleanDisplayName) : undefined,
    segment,
    jurisdiction: jurisdiction.toUpperCase(),
    sourceType: request.defaults.sourceType,
    sourceUrl: sourceUrl ?? profileUrl ?? `apify://${request.actorId}`,
    lane: request.defaults.lane,
    consentStatus: request.defaults.consentStatus,
    optOutStatus: "clear",
    fitScore: scoreFit(item, request),
    intentScore: scoreIntent(item),
    riskScore: scoreRisk(request),
    sensitiveCategoryFlags: [],
    channelIdentities,
    website,
    phone,
    address,
    status: request.defaults.consentStatus === "withdrawn" ? "suppressed" : "candidate"
  };
}

function readMappedString(
  item: ApifyDatasetItem,
  mapping: ApifyFieldMapping,
  key: keyof ApifyFieldMapping,
  fallbacks: string[]
) {
  const explicitPath = mapping[key];
  const explicitValue = explicitPath ? readPath(item, explicitPath) : undefined;
  const fallbackValue = explicitValue ?? fallbacks.map((path) => readPath(item, path)).find((val) => val !== undefined && val !== null);

  if (fallbackValue === undefined || fallbackValue === null) {
    return undefined;
  }

  if (typeof fallbackValue === "string") {
    return fallbackValue.trim() || undefined;
  }

  if (typeof fallbackValue === "number" || typeof fallbackValue === "boolean") {
    return String(fallbackValue);
  }

  if (Array.isArray(fallbackValue)) {
    // 1. If it's an array of strings, find first non-empty string
    const firstStr = fallbackValue.find((val) => typeof val === "string" && val.trim());
    if (firstStr) return (firstStr as string).trim();

    // 2. If it's an array of objects, check if any object has common value/email properties
    for (const val of fallbackValue) {
      if (val && typeof val === "object") {
        const candidate = (val as Record<string, unknown>).value ?? 
                          (val as Record<string, unknown>).email ?? 
                          (val as Record<string, unknown>).url ?? 
                          (val as Record<string, unknown>).phone;
        if (typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
    }

    // 3. Fallback to first item converted to string if any
    if (fallbackValue.length > 0) {
      const firstItem = fallbackValue[0];
      if (firstItem !== undefined && firstItem !== null) {
        return String(firstItem).trim() || undefined;
      }
    }
  }

  if (typeof fallbackValue === "object") {
    // If it's a direct object, check for common values
    const obj = fallbackValue as Record<string, unknown>;
    const candidate = obj.value ?? obj.email ?? obj.url ?? obj.phone;
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return undefined;
}

function readPath(item: ApifyDatasetItem, path: string) {
  return path.split(".").reduce<unknown>((value, part) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[part];
  }, item);
}

function buildChannelIdentities(
  preferredChannel: Channel | undefined,
  email: string | undefined,
  socialHandle: string | undefined,
  profileUrl: string | undefined
): Partial<Record<Channel, string>> {
  const identities: Partial<Record<Channel, string>> = {};

  if (email) {
    identities.email = email;
  }

  if (preferredChannel && preferredChannel !== "email" && preferredChannel !== "hubspot") {
    identities[preferredChannel] = socialHandle ?? profileUrl;
  }

  return identities;
}

function scoreFit(item: ApifyDatasetItem, request: ApifyDiscoveryRequest) {
  const hasIdentity = Boolean(
    readMappedString(item, request.mapping, "displayName", displayNameFallbacks) ||
      readMappedString(item, request.mapping, "companyName", companyFallbacks)
  );
  const hasContactPath = Boolean(
    readMappedString(item, request.mapping, "email", emailFallbacks) ||
      readMappedString(item, request.mapping, "socialHandle", handleFallbacks) ||
      readMappedString(item, request.mapping, "profileUrl", profileUrlFallbacks)
  );

  return Math.min(95, 45 + (hasIdentity ? 20 : 0) + (hasContactPath ? 20 : 0));
}

function scoreIntent(item: ApifyDatasetItem) {
  const text = JSON.stringify(item).toLowerCase();
  const intentWords = ["lead", "contact", "email", "review", "comment", "inquiry", "demo", "pricing"];
  const hits = intentWords.filter((word) => text.includes(word)).length;

  return Math.min(90, 35 + hits * 8);
}

function scoreRisk(request: ApifyDiscoveryRequest) {
  const laneRisk = request.defaults.lane === "high_risk_cold_social" ? 62 : 28;
  const consentRisk = request.defaults.consentStatus === "unknown" ? 22 : 0;

  return Math.min(98, laneRisk + consentRisk);
}
