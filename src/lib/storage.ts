import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import {
  agents,
  channelPolicies,
  clients,
  roadmap,
  tools
} from "./mock-data";
import { runAutonomySimulation } from "./agent-runtime";
import { runApifyLeadDiscovery } from "./apify-discovery";
import type {
  AgentRunResult,
  ApifyDiscoveryRequest,
  Campaign,
  CampaignType,
  Channel,
  LeadLane,
  LeadRecord,
  EmailConnection,
  EmailTemplate,
  SentMessage
} from "./types";

const DB_FILE = path.join(process.cwd(), ".data.json");

interface DbSchema {
  campaigns: Campaign[];
  leads: LeadRecord[];
  agentRuns: AgentRunResult[];
  emailConnections: EmailConnection[];
  emailTemplates: EmailTemplate[];
  sentMessages: SentMessage[];
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl_b2b_coat",
    name: "B2B Boutique Outreach",
    subject: "Partnership Inquiry: Modest Coat Collection for {{companyName}}",
    body: "Hi {{name}},\n\nI hope this email finds you well. I was researching boutiques and stores in {{jurisdiction}} and came across {{companyName}}. Your collection looks like a wonderful fit for our new modest long coat collection.\n\nWe are offering wholesale and affiliate partnerships. Our offer: {{offer}}.\n\nWould you be open to receiving a few sample images and wholesale pricing details?\n\nBest regards,\nThe Outbound Team",
    createdAt: new Date().toISOString()
  },
  {
    id: "tpl_b2c_wellness",
    name: "B2C Wellness Reset Offer",
    subject: "Special Invitation for {{name}}",
    body: "Hi {{name}},\n\nThanks for your interest. As an active follower, we wanted to share our latest offer: {{offer}}.\n\nThis reset is designed to help you jumpstart your nutrition and wellness goals.\n\nReply directly to this email to claim your spot or get more details!\n\nWarmly,\nAster Wellness Team",
    createdAt: new Date().toISOString()
  }
];

function loadDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    return { campaigns: [], leads: [], agentRuns: [], emailConnections: [], emailTemplates: DEFAULT_TEMPLATES, sentMessages: [] };
  }
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(data);
    return {
      campaigns: parsed.campaigns || [],
      leads: parsed.leads || [],
      agentRuns: parsed.agentRuns || [],
      emailConnections: parsed.emailConnections || [],
      emailTemplates: parsed.emailTemplates && parsed.emailTemplates.length ? parsed.emailTemplates : DEFAULT_TEMPLATES,
      sentMessages: parsed.sentMessages || []
    };
  } catch {
    return { campaigns: [], leads: [], agentRuns: [], emailConnections: [], emailTemplates: DEFAULT_TEMPLATES, sentMessages: [] };
  }
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let db = loadDb();

export function listDashboardData() {
  db = loadDb(); // refresh on load
  return {
    clients,
    campaigns: db.campaigns,
    channelPolicies,
    leads: db.leads,
    agents,
    tools,
    roadmap,
    agentRuns: db.agentRuns,
    emailConnections: db.emailConnections,
    emailTemplates: db.emailTemplates,
    sentMessages: db.sentMessages
  };
}


export function listCampaigns() {
  db = loadDb();
  return db.campaigns;
}

export function listLeads(campaignId?: string) {
  db = loadDb();
  if (!campaignId) {
    return db.leads;
  }
  return db.leads.filter((lead) => lead.campaignId === campaignId);
}

export function clearLeads(campaignId?: string) {
  db = loadDb();
  if (!campaignId) {
    const removed = db.leads.length;
    db.leads = [];
    saveDb(db);
    return { removed };
  }

  const initialLength = db.leads.length;
  db.leads = db.leads.filter((lead) => lead.campaignId !== campaignId);
  saveDb(db);
  return { removed: initialLength - db.leads.length };
}

export function clearDemoData() {
  db = loadDb();
  const removedCampaigns = db.campaigns.length;
  const removedLeads = db.leads.length;
  const removedRuns = db.agentRuns.length;

  db.campaigns = [];
  db.leads = [];
  db.agentRuns = [];
  saveDb(db);

  return {
    removedCampaigns,
    removedLeads,
    removedRuns
  };
}

interface CreateCampaignInput {
  clientId: string;
  name: string;
  type: CampaignType;
  lane: LeadLane;
  goal: string;
  offer: string;
  jurisdictions: string[];
  enabledChannels: Channel[];
}

export function createCampaign(input: CreateCampaignInput) {
  db = loadDb();
  const client = clients.find((item) => item.id === input.clientId);

  if (!client) {
    throw new Error("Client not found");
  }

  const campaign: Campaign = {
    id: `cmp_${randomUUID()}`,
    agencyId: client.agencyId,
    clientId: input.clientId,
    name: input.name,
    type: input.type,
    lane: input.lane,
    status: "draft",
    autonomyLevel: "review_required",
    goal: input.goal,
    offer: input.offer,
    jurisdictions: input.jurisdictions,
    dailyActionLimit: 50,
    enabledChannels: input.enabledChannels,
    riskAcceptanceRequired:
      input.lane === "high_risk_cold_social" ||
      input.enabledChannels.some((channel) => ["linkedin", "instagram", "facebook", "tiktok"].includes(channel)),
    createdAt: new Date().toISOString()
  };

  db.campaigns.unshift(campaign);
  saveDb(db);
  return campaign;
}

export function updateCampaign(id: string, input: Partial<Omit<Campaign, "id" | "agencyId" | "clientId" | "createdAt">>) {
  db = loadDb();
  const campaign = db.campaigns.find((item) => item.id === id);
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  Object.assign(campaign, input);
  saveDb(db);
  return campaign;
}


export function runAgentSimulation(campaignId: string, hasRiskAcceptance: boolean) {
  db = loadDb();
  const campaign = db.campaigns.find((item) => item.id === campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  const result = runAutonomySimulation({
    campaign,
    leads: db.leads,
    hasRiskAcceptance
  });

  db.agentRuns.unshift(result);
  saveDb(db);
  return result;
}

export function listAgentRuns(campaignId?: string) {
  db = loadDb();
  if (!campaignId) {
    return db.agentRuns;
  }
  return db.agentRuns.filter((run) => run.campaignId === campaignId);
}

export async function discoverLeadsWithApify(request: ApifyDiscoveryRequest & { onlyEmails?: boolean }) {
  db = loadDb();
  const campaign = db.campaigns.find((item) => item.id === request.campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (!request.actorId) {
    throw new Error("Apify actorId is required.");
  }

  const result = await runApifyLeadDiscovery(request, campaign);

  // Dynamically align lead type and outreach lane with campaign type
  if (campaign.type === "b2c") {
    result.importedLeads.forEach((lead) => {
      lead.type = "b2c_profile";
      lead.lane = "high_risk_cold_social";
    });
  } else if (campaign.type === "b2b") {
    result.importedLeads.forEach((lead) => {
      lead.type = "b2b_contact";
      lead.lane = "public_business_research";
    });
  }

  const filteredLeads = request.onlyEmails
    ? result.importedLeads.filter((lead) => Boolean(lead.channelIdentities?.email))
    : result.importedLeads;

  db.leads.unshift(...filteredLeads);
  saveDb(db);

  return {
    ...result,
    importedLeads: filteredLeads
  };
}

export function listEmailConnections() {
  db = loadDb();
  return db.emailConnections;
}

export function createEmailConnection(input: Omit<EmailConnection, "id" | "isActive" | "createdAt">) {
  db = loadDb();
  const conn: EmailConnection = {
    id: `conn_${randomUUID()}`,
    ...input,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  db.emailConnections.unshift(conn);
  saveDb(db);
  return conn;
}

export function deleteEmailConnection(id: string) {
  db = loadDb();
  const initialLength = db.emailConnections.length;
  db.emailConnections = db.emailConnections.filter((item) => item.id !== id);
  saveDb(db);
  return { success: initialLength > db.emailConnections.length };
}

export function listEmailTemplates() {
  db = loadDb();
  return db.emailTemplates;
}

export function createEmailTemplate(input: Omit<EmailTemplate, "id" | "createdAt">) {
  db = loadDb();
  const tpl: EmailTemplate = {
    id: `tpl_${randomUUID()}`,
    ...input,
    createdAt: new Date().toISOString()
  };
  db.emailTemplates.unshift(tpl);
  saveDb(db);
  return tpl;
}

export function updateEmailTemplate(id: string, input: Partial<Omit<EmailTemplate, "id" | "createdAt">>) {
  db = loadDb();
  const tpl = db.emailTemplates.find((item) => item.id === id);
  if (!tpl) {
    throw new Error("Template not found");
  }
  Object.assign(tpl, input);
  saveDb(db);
  return tpl;
}

export function deleteEmailTemplate(id: string) {
  db = loadDb();
  const initialLength = db.emailTemplates.length;
  db.emailTemplates = db.emailTemplates.filter((item) => item.id !== id);
  saveDb(db);
  return { success: initialLength > db.emailTemplates.length };
}

export function listSentMessages() {
  db = loadDb();
  return db.sentMessages;
}

export function addSentMessage(sent: SentMessage) {
  db = loadDb();
  db.sentMessages.unshift(sent);
  saveDb(db);
  return sent;
}

