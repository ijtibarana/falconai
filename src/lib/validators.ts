import { z } from "zod";

import { apifySourceKeys, campaignTypes, channels, leadLanes } from "./types";

export const createCampaignSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(3).max(120),
  type: z.enum(campaignTypes),
  lane: z.enum(leadLanes),
  goal: z.string().min(10).max(600),
  offer: z.string().min(5).max(400),
  jurisdictions: z.array(z.string().min(2).max(16)).min(1),
  enabledChannels: z.array(z.enum(channels)).min(1)
});

export const runAgentSchema = z.object({
  campaignId: z.string().min(1),
  hasRiskAcceptance: z.boolean().default(false)
});

export const policyEvaluationSchema = z.object({
  campaignId: z.string().min(1),
  leadId: z.string().min(1),
  channel: z.enum(channels),
  hasRiskAcceptance: z.boolean().default(false)
});

export const apifyDiscoverySchema = z.object({
  campaignId: z.string().min(1),
  sourceKey: z.enum(apifySourceKeys).optional(),
  onlyEmails: z.boolean().optional(),
  actorId: z.string().min(1).optional(),
  actorInput: z.record(z.string(), z.unknown()).default({}),
  maxItems: z.number().int().min(1).max(250).default(25),
  timeoutSecs: z.number().int().min(10).max(300).default(120),
  mapping: z
    .object({
      displayName: z.string().min(1).optional(),
      companyName: z.string().min(1).optional(),
      email: z.string().min(1).optional(),
      socialHandle: z.string().min(1).optional(),
      profileUrl: z.string().min(1).optional(),
      sourceUrl: z.string().min(1).optional(),
      jurisdiction: z.string().min(1).optional(),
      segment: z.string().min(1).optional()
    })
    .default({}),
  defaults: z
    .object({
      leadType: z.enum(["b2b_contact", "b2c_profile"]).default("b2b_contact"),
      lane: z.enum(leadLanes).default("consented_inbound"),
      jurisdiction: z.string().min(2).max(16).default("US"),
      segment: z.string().min(1).max(160).default("Apify discovered lead"),
      sourceType: z.string().min(1).max(80).default("apify_actor"),
      channel: z.enum(channels).optional(),
      consentStatus: z
        .enum(["granted", "soft_opt_in", "legitimate_interest", "unknown", "withdrawn"])
        .default("unknown")
    })
    .default({
      leadType: "b2b_contact",
      lane: "consented_inbound",
      jurisdiction: "US",
      segment: "Apify discovered lead",
      sourceType: "apify_actor",
      consentStatus: "unknown"
    })
});
