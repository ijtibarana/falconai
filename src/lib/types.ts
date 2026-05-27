export const campaignTypes = ["b2b", "b2c", "mixed"] as const;
export type CampaignType = (typeof campaignTypes)[number];

export const channels = [
  "email",
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "hubspot"
] as const;
export type Channel = (typeof channels)[number];

export const leadLanes = ["consented_inbound", "public_business_research", "high_risk_cold_social"] as const;
export type LeadLane = (typeof leadLanes)[number];

export const apifySourceKeys = ["google_search", "google_maps", "instagram", "tiktok", "website_contacts", "instagram_profile", "tiktok_profile", "facebook_pages"] as const;
export type ApifySourceKey = (typeof apifySourceKeys)[number];

export type CampaignStatus = "draft" | "review" | "active" | "paused" | "completed";
export type AutonomyLevel = "review_required" | "guardrailed_auto" | "fully_autonomous";
export type RiskLevel = "low" | "medium" | "high" | "blocked";
export type ConsentStatus = "granted" | "soft_opt_in" | "legitimate_interest" | "unknown" | "withdrawn";
export type OptOutStatus = "clear" | "opted_out" | "complained" | "deleted";
export type LeadStatus = "candidate" | "qualified" | "needs_review" | "blocked" | "suppressed";
export type AgentRunStatus = "queued" | "running" | "completed" | "failed";
export type PolicyDecisionStatus = "approved" | "needs_review" | "blocked";
export type ApifyLeadType = "b2b_contact" | "b2c_profile";

export interface Agency {
  id: string;
  name: string;
  defaultRegion: string;
  status: "active" | "paused";
}

export interface ClientWorkspace {
  id: string;
  agencyId: string;
  name: string;
  industry: string;
  websiteUrl: string;
  riskProfile: RiskLevel;
  defaultJurisdictions: string[];
  status: "active" | "paused";
}

export interface Campaign {
  id: string;
  agencyId: string;
  clientId: string;
  name: string;
  type: CampaignType;
  lane: LeadLane;
  status: CampaignStatus;
  autonomyLevel: AutonomyLevel;
  goal: string;
  offer: string;
  jurisdictions: string[];
  dailyActionLimit: number;
  enabledChannels: Channel[];
  riskAcceptanceRequired: boolean;
  connectedInboxId?: string;
  isActiveAutomation?: boolean;
  templateId?: string;
  attachments?: { name: string; url: string; size: string }[];
  createdAt: string;
}

export interface ChannelPolicy {
  id: string;
  campaignId: string;
  channel: Channel;
  mode: "official_api" | "inbound_only" | "assisted_task" | "browser_automation";
  riskLevel: RiskLevel;
  dailyLimit: number;
  requiresReview: boolean;
  requiresRiskAcceptance: boolean;
  enabled: boolean;
}

export interface LeadRecord {
  id: string;
  agencyId: string;
  clientId: string;
  campaignId: string;
  displayName: string;
  type: "b2b_contact" | "b2c_profile";
  companyName?: string;
  segment: string;
  jurisdiction: string;
  sourceType: string;
  sourceUrl: string;
  lane: LeadLane;
  consentStatus: ConsentStatus;
  optOutStatus: OptOutStatus;
  fitScore: number;
  intentScore: number;
  riskScore: number;
  sensitiveCategoryFlags: string[];
  channelIdentities: Partial<Record<Channel, string>>;
  website?: string;
  phone?: string;
  address?: string;
  status: LeadStatus;
}


export interface AgentDefinition {
  id: string;
  name: string;
  purpose: string;
  riskControls: string[];
  tools: string[];
  status: "ready" | "beta" | "blocked";
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: "lead_source" | "research" | "messaging" | "crm" | "social" | "compliance" | "memory";
  riskLevel: RiskLevel;
  enabled: boolean;
}

export interface PolicyDecision {
  status: PolicyDecisionStatus;
  channel: Channel;
  leadId: string;
  policyCodes: string[];
  explanation: string;
  requiresHumanReview: boolean;
}

export interface ToolCallSummary {
  toolName: string;
  status: "success" | "skipped" | "blocked";
  evidence: string;
}

export interface GeneratedMessage {
  channel: Channel;
  leadId: string;
  subject?: string;
  body: string;
  claims: string[];
}

export interface AgentRunResult {
  id: string;
  campaignId: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt: string;
  summary: {
    leadsEvaluated: number;
    approvedActions: number;
    reviewActions: number;
    blockedActions: number;
    averageFitScore: number;
  };
  decisions: PolicyDecision[];
  generatedMessages: GeneratedMessage[];
  toolCalls: ToolCallSummary[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "ready_next" | "done";
  deliverables: string[];
}

export interface PolicyEvaluationInput {
  campaign: Campaign;
  lead: LeadRecord;
  channel: Channel;
  hasRiskAcceptance: boolean;
}

export interface ApifyFieldMapping {
  displayName?: string;
  companyName?: string;
  email?: string;
  socialHandle?: string;
  profileUrl?: string;
  sourceUrl?: string;
  jurisdiction?: string;
  segment?: string;
}

export interface ApifyDiscoveryDefaults {
  leadType: ApifyLeadType;
  lane: LeadLane;
  jurisdiction: string;
  segment: string;
  sourceType: string;
  channel?: Channel;
  consentStatus: ConsentStatus;
}

export interface ApifyDiscoveryRequest {
  campaignId: string;
  actorId: string;
  actorInput: Record<string, unknown>;
  maxItems: number;
  timeoutSecs: number;
  mapping: ApifyFieldMapping;
  defaults: ApifyDiscoveryDefaults;
}

export interface ApifyDiscoveryResult {
  actorId: string;
  runId: string;
  datasetId: string;
  rawItemCount: number;
  importedLeads: LeadRecord[];
}

export interface ApifySourcePreset {
  key: ApifySourceKey;
  label: string;
  actorId: string;
  riskLevel: RiskLevel;
  recommendedUse: string;
  notFor: string;
  defaultActorInput: Record<string, unknown>;
  mapping: ApifyFieldMapping;
  defaults: ApifyDiscoveryDefaults;
}

export interface EmailConnection {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  provider: "smtp" | "gmail" | "outlook";
  isActive: boolean;
  createdAt: string;
}


export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  htmlContent?: string;
  createdAt: string;
}

export interface SentMessage {
  id: string;
  campaignId: string;
  leadId: string;
  leadEmail: string;
  leadName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "sent" | "failed";
  error?: string;
}
