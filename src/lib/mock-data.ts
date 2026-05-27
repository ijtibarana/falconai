import type {
  Agency,
  AgentDefinition,
  Campaign,
  ChannelPolicy,
  ClientWorkspace,
  LeadRecord,
  RoadmapPhase,
  ToolDefinition
} from "./types";

export const agency: Agency = {
  id: "ag_northstar",
  name: "Northstar Growth Studio",
  defaultRegion: "US",
  status: "active"
};

export const clients: ClientWorkspace[] = [
  {
    id: "cl_cloudops",
    agencyId: agency.id,
    name: "CloudOps Ledger",
    industry: "B2B SaaS",
    websiteUrl: "https://example.com/cloudops",
    riskProfile: "medium",
    defaultJurisdictions: ["US", "UK", "EU"],
    status: "active"
  },
  {
    id: "cl_aster",
    agencyId: agency.id,
    name: "Aster Wellness",
    industry: "Consumer wellness",
    websiteUrl: "https://example.com/aster",
    riskProfile: "high",
    defaultJurisdictions: ["US", "EU"],
    status: "active"
  }
];

export const campaigns: Campaign[] = [
  {
    id: "cmp_b2b_expansion",
    agencyId: agency.id,
    clientId: "cl_cloudops",
    name: "Finance Ops Expansion",
    type: "b2b",
    lane: "consented_inbound",
    status: "active",
    autonomyLevel: "guardrailed_auto",
    goal: "Book demos with finance and operations leaders at mid-market SaaS companies.",
    offer: "Workflow audit and ROI model for invoice reconciliation.",
    jurisdictions: ["US", "UK"],
    dailyActionLimit: 120,
    enabledChannels: ["email", "linkedin", "hubspot"],
    riskAcceptanceRequired: false,
    createdAt: "2026-05-11T07:00:00.000Z"
  },
  {
    id: "cmp_b2c_social",
    agencyId: agency.id,
    clientId: "cl_aster",
    name: "Spring Reset Social Demand",
    type: "b2c",
    lane: "high_risk_cold_social",
    status: "review",
    autonomyLevel: "fully_autonomous",
    goal: "Convert wellness-interested consumers from social engagement into lead-form signups.",
    offer: "Seven-day guided reset with nutrition coaching.",
    jurisdictions: ["US", "EU"],
    dailyActionLimit: 60,
    enabledChannels: ["email", "instagram", "facebook", "tiktok", "hubspot"],
    riskAcceptanceRequired: true,
    createdAt: "2026-05-11T07:15:00.000Z"
  }
];

export const channelPolicies: ChannelPolicy[] = [
  {
    id: "cp_email_b2b",
    campaignId: "cmp_b2b_expansion",
    channel: "email",
    mode: "official_api",
    riskLevel: "medium",
    dailyLimit: 100,
    requiresReview: false,
    requiresRiskAcceptance: false,
    enabled: true
  },
  {
    id: "cp_linkedin_b2b",
    campaignId: "cmp_b2b_expansion",
    channel: "linkedin",
    mode: "assisted_task",
    riskLevel: "high",
    dailyLimit: 20,
    requiresReview: true,
    requiresRiskAcceptance: true,
    enabled: true
  },
  {
    id: "cp_instagram_b2c",
    campaignId: "cmp_b2c_social",
    channel: "instagram",
    mode: "browser_automation",
    riskLevel: "high",
    dailyLimit: 25,
    requiresReview: true,
    requiresRiskAcceptance: true,
    enabled: true
  },
  {
    id: "cp_tiktok_b2c",
    campaignId: "cmp_b2c_social",
    channel: "tiktok",
    mode: "browser_automation",
    riskLevel: "high",
    dailyLimit: 15,
    requiresReview: true,
    requiresRiskAcceptance: true,
    enabled: true
  },
  {
    id: "cp_email_b2c",
    campaignId: "cmp_b2c_social",
    channel: "email",
    mode: "official_api",
    riskLevel: "medium",
    dailyLimit: 40,
    requiresReview: true,
    requiresRiskAcceptance: false,
    enabled: true
  }
];

export const leads: LeadRecord[] = [
  {
    id: "lead_maya",
    agencyId: agency.id,
    clientId: "cl_cloudops",
    campaignId: "cmp_b2b_expansion",
    displayName: "Maya Singh",
    type: "b2b_contact",
    companyName: "Northwind Analytics",
    segment: "VP Finance at mid-market SaaS",
    jurisdiction: "US",
    sourceType: "web_research",
    sourceUrl: "https://example.com/northwind",
    lane: "consented_inbound",
    consentStatus: "legitimate_interest",
    optOutStatus: "clear",
    fitScore: 92,
    intentScore: 81,
    riskScore: 28,
    sensitiveCategoryFlags: [],
    channelIdentities: {
      email: "maya@example.com",
      linkedin: "https://linkedin.com/in/example-maya"
    },
    status: "qualified"
  },
  {
    id: "lead_jonah",
    agencyId: agency.id,
    clientId: "cl_cloudops",
    campaignId: "cmp_b2b_expansion",
    displayName: "Jonah Reed",
    type: "b2b_contact",
    companyName: "Brightstack",
    segment: "Operations leader using manual reconciliation",
    jurisdiction: "UK",
    sourceType: "hubspot_import",
    sourceUrl: "hubspot://contacts/9321",
    lane: "consented_inbound",
    consentStatus: "soft_opt_in",
    optOutStatus: "clear",
    fitScore: 86,
    intentScore: 74,
    riskScore: 31,
    sensitiveCategoryFlags: [],
    channelIdentities: {
      email: "jonah@example.com"
    },
    status: "qualified"
  },
  {
    id: "lead_lina",
    agencyId: agency.id,
    clientId: "cl_aster",
    campaignId: "cmp_b2c_social",
    displayName: "Lina P.",
    type: "b2c_profile",
    segment: "Engaged Instagram wellness follower",
    jurisdiction: "US",
    sourceType: "instagram_comment",
    sourceUrl: "https://instagram.com/p/example",
    lane: "consented_inbound",
    consentStatus: "granted",
    optOutStatus: "clear",
    fitScore: 78,
    intentScore: 88,
    riskScore: 35,
    sensitiveCategoryFlags: [],
    channelIdentities: {
      instagram: "@lina_reset",
      email: "lina@example.com"
    },
    status: "qualified"
  },
  {
    id: "lead_neo",
    agencyId: agency.id,
    clientId: "cl_aster",
    campaignId: "cmp_b2c_social",
    displayName: "Neo Fit Daily",
    type: "b2c_profile",
    segment: "TikTok wellness creator",
    jurisdiction: "EU",
    sourceType: "public_tiktok_profile",
    sourceUrl: "https://www.tiktok.com/@example",
    lane: "high_risk_cold_social",
    consentStatus: "unknown",
    optOutStatus: "clear",
    fitScore: 72,
    intentScore: 69,
    riskScore: 84,
    sensitiveCategoryFlags: [],
    channelIdentities: {
      tiktok: "@neo_fit_daily"
    },
    status: "needs_review"
  },
  {
    id: "lead_olivia",
    agencyId: agency.id,
    clientId: "cl_aster",
    campaignId: "cmp_b2c_social",
    displayName: "Olivia R.",
    type: "b2c_profile",
    segment: "Imported consumer subscriber",
    jurisdiction: "US",
    sourceType: "csv_import",
    sourceUrl: "import://aster/subscribers-may",
    lane: "consented_inbound",
    consentStatus: "withdrawn",
    optOutStatus: "opted_out",
    fitScore: 64,
    intentScore: 58,
    riskScore: 95,
    sensitiveCategoryFlags: [],
    channelIdentities: {
      email: "olivia@example.com",
      facebook: "olivia.example"
    },
    status: "suppressed"
  }
];

export const agents: AgentDefinition[] = [
  {
    id: "agent_audience",
    name: "Audience Strategy Agent",
    purpose: "Turns client goals into B2B ICPs or B2C audience segments.",
    riskControls: ["Sensitive-category exclusion", "Jurisdiction defaults", "Client-specific scoring"],
    tools: ["vector.search", "policy.evaluate"],
    status: "ready"
  },
  {
    id: "agent_discovery",
    name: "Lead Discovery Agent",
    purpose: "Finds or imports leads from approved sources and labels the risk lane.",
    riskControls: ["Source attribution", "Lane separation", "Import consent declaration"],
    tools: ["web.search", "company.crawl", "enrichment.lookup_contact"],
    status: "ready"
  },
  {
    id: "agent_research",
    name: "Research & Context Agent",
    purpose: "Collects source-backed facts for scoring and personalization.",
    riskControls: ["Citation required", "Prompt-injection filtering", "Sensitive fact labeling"],
    tools: ["web.fetch", "vector.upsert"],
    status: "ready"
  },
  {
    id: "agent_qualification",
    name: "Qualification Agent",
    purpose: "Scores fit, intent, and risk before outreach.",
    riskControls: ["Suppression checks", "Consent checks", "Dedupe rules"],
    tools: ["consent.check", "policy.evaluate"],
    status: "ready"
  },
  {
    id: "agent_content",
    name: "Content & Outreach Agent",
    purpose: "Generates email and social messages with source-backed claims.",
    riskControls: ["Claim mapping", "Deceptive-content checks", "B2C sensitive-trait blocking"],
    tools: ["vector.search", "moderation.check"],
    status: "ready"
  },
  {
    id: "agent_orchestrator",
    name: "Channel Orchestrator Agent",
    purpose: "Routes approved actions to email, social, CRM, or review queues.",
    riskControls: ["Rate limits", "Account-health pauses", "Kill switches"],
    tools: ["email.send", "browser.social_action", "hubspot.sync"],
    status: "ready"
  },
  {
    id: "agent_social",
    name: "Social Automation Agent",
    purpose: "Runs approved browser automation actions in isolated workers.",
    riskControls: ["No CAPTCHA bypass", "No access-control circumvention", "Per-account throttles"],
    tools: ["browser.social_action", "audit.write"],
    status: "beta"
  },
  {
    id: "agent_compliance",
    name: "Compliance & Safety Agent",
    purpose: "Blocks missing consent, risky claims, unsupported channels, and opt-outs.",
    riskControls: ["Policy codes", "Human review routes", "Immutable audit"],
    tools: ["consent.check", "moderation.check", "audit.write"],
    status: "ready"
  },
  {
    id: "agent_reporting",
    name: "CRM & Reporting Agent",
    purpose: "Syncs HubSpot and reports attribution, replies, conversions, costs, and risk.",
    riskControls: ["Idempotency", "Conflict review", "Opt-out preservation"],
    tools: ["hubspot.sync", "audit.write"],
    status: "ready"
  }
];

export const tools: ToolDefinition[] = [
  { id: "tool_apify", name: "apify.actor_run", category: "lead_source", riskLevel: "medium", enabled: true },
  { id: "tool_web_search", name: "web.search", category: "research", riskLevel: "medium", enabled: true },
  { id: "tool_web_fetch", name: "web.fetch", category: "research", riskLevel: "medium", enabled: true },
  { id: "tool_enrichment", name: "enrichment.lookup_contact", category: "research", riskLevel: "medium", enabled: true },
  { id: "tool_email", name: "email.send", category: "messaging", riskLevel: "medium", enabled: true },
  { id: "tool_hubspot", name: "hubspot.sync", category: "crm", riskLevel: "medium", enabled: true },
  { id: "tool_meta", name: "meta.lead_forms", category: "social", riskLevel: "medium", enabled: true },
  { id: "tool_tiktok", name: "tiktok.inbound", category: "social", riskLevel: "medium", enabled: true },
  { id: "tool_browser", name: "browser.social_action", category: "social", riskLevel: "high", enabled: false },
  { id: "tool_consent", name: "consent.check", category: "compliance", riskLevel: "low", enabled: true },
  { id: "tool_policy", name: "policy.evaluate", category: "compliance", riskLevel: "low", enabled: true },
  { id: "tool_vector", name: "vector.search", category: "memory", riskLevel: "low", enabled: true }
];

export const roadmap: RoadmapPhase[] = [
  {
    id: "phase_1",
    name: "SaaS Foundation",
    status: "in_progress",
    deliverables: ["Next.js app shell", "Typed API contracts", "Mock tenant data", "Audit-ready domain model"]
  },
  {
    id: "phase_2",
    name: "Lead Model And Policy Engine",
    status: "ready_next",
    deliverables: ["B2B/B2C lead entities", "Consent and suppression checks", "Jurisdiction policy evaluator"]
  },
  {
    id: "phase_3",
    name: "Research And Generation",
    status: "not_started",
    deliverables: ["Research fact storage", "Vector memory", "Message generation review"]
  },
  {
    id: "phase_4",
    name: "Email And HubSpot",
    status: "not_started",
    deliverables: ["Inbox connection", "Send scheduler", "HubSpot sync", "Reply handling"]
  },
  {
    id: "phase_5",
    name: "Social APIs And Browser Beta",
    status: "not_started",
    deliverables: ["Official inbound flows", "Browser worker isolation", "Risk acceptance", "Kill switches"]
  }
];
