"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eraser,
  Facebook,
  Flag,
  Instagram,
  Linkedin,
  Mail,
  MessageSquare,
  PauseCircle,
  Play,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  Users
} from "lucide-react";

import { summarizeCampaign } from "@/lib/policy-engine";
import type {
  AgentDefinition,
  AgentRunResult,
  ApifySourceKey,
  Campaign,
  CampaignType,
  Channel,
  ChannelPolicy,
  ClientWorkspace,
  LeadRecord,
  RoadmapPhase,
  ToolDefinition,
  EmailConnection,
  EmailTemplate,
  SentMessage
} from "@/lib/types";

interface CommandCenterProps {
  initialData: {
    clients: ClientWorkspace[];
    campaigns: Campaign[];
    channelPolicies: ChannelPolicy[];
    leads: LeadRecord[];
    agents: AgentDefinition[];
    tools: ToolDefinition[];
    roadmap: RoadmapPhase[];
    agentRuns: AgentRunResult[];
    emailConnections?: EmailConnection[];
    emailTemplates?: EmailTemplate[];
    sentMessages?: SentMessage[];
  };
}


const channelIcons = {
  email: Mail,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: MessageSquare,
  hubspot: Database
} satisfies Record<Channel, typeof Mail>;

const statusLabel = {
  active: "Active",
  review: "Review",
  draft: "Draft",
  paused: "Paused",
  completed: "Done"
};

export function CommandCenter({ initialData }: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<"campaigns" | "leads" | "agents" | "compliance" | "roadmap" | "inboxes" | "outreach">("campaigns");
  const [campaigns, setCampaigns] = useState(initialData.campaigns);
  const [leads, setLeads] = useState(initialData.leads);
  const [selectedCampaignId, setSelectedCampaignId] = useState(initialData.campaigns[0]?.id ?? "");
  const [agentRun, setAgentRun] = useState<AgentRunResult | null>(null);

  // New features state
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>(initialData.sentMessages ?? []);

  // Load configurations and sync with ephemeral serverless DB on mount
  useEffect(() => {
    let activeConns = initialData.emailConnections ?? [];
    let activeTpls = initialData.emailTemplates ?? [];

    // Load connections from local storage
    const savedConnsStr = localStorage.getItem("falcon_smtp_connections");
    if (savedConnsStr) {
      try {
        const parsed = JSON.parse(savedConnsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeConns = parsed;
        }
      } catch (e) {
        console.error("Failed to load connections from local storage:", e);
      }
    }
    setConnections(activeConns);

    // Load templates from local storage
    const savedTplsStr = localStorage.getItem("falcon_email_templates");
    if (savedTplsStr) {
      try {
        const parsed = JSON.parse(savedTplsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeTpls = parsed;
        }
      } catch (e) {
        console.error("Failed to load templates from local storage:", e);
      }
    }
    setTemplates(activeTpls);

    // Background Database Sync: Reconstruct ephemeral /tmp database on cold-start or redeploy
    const syncDatabase = async () => {
      // Restore connections
      const missingConns = activeConns.filter(
        (c) => !initialData.emailConnections?.some((srv) => srv.id === c.id)
      );
      for (const conn of missingConns) {
        await fetch("/api/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conn)
        }).catch(console.error);
      }

      // Restore templates
      const missingTpls = activeTpls.filter(
        (t) => !initialData.emailTemplates?.some((srv) => srv.id === t.id)
      );
      for (const tpl of missingTpls) {
        await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tpl)
        }).catch(console.error);
      }
    };

    syncDatabase();
  }, [initialData.emailConnections, initialData.emailTemplates]);

  const [isConnectingEmail, setIsConnectingEmail] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isSendingOutreach, setIsSendingOutreach] = useState(false);

  const [emailForm, setEmailForm] = useState({
    email: "",
    smtpHost: "",
    smtpPort: 465,
    smtpUser: "",
    smtpPass: "",
    provider: "smtp" as "smtp" | "gmail" | "outlook"
  });

  const [templateForm, setTemplateForm] = useState({
    id: "",
    name: "",
    subject: "",
    body: "",
    isHtml: false,
    htmlContent: ""
  });


  const [outreachForm, setOutreachForm] = useState({
    leadId: "",
    connectionId: "",
    templateId: "",
    subject: "",
    body: "",
    customEmail: "",
    customName: "",
    customCompany: "",
    customJurisdiction: ""
  });

  const [outreachStatusMessage, setOutreachStatusMessage] = useState<string | null>(null);
  const [templateStatusMessage, setTemplateStatusMessage] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [campaignMessage, setCampaignMessage] = useState<string | null>(null);
  const [discoveryMessage, setDiscoveryMessage] = useState<string | null>(null);
  const [sourceKey, setSourceKey] = useState<ApifySourceKey>("google_maps");
  const [locationQuery, setLocationQuery] = useState("London, United Kingdom");
  const [searchTerms, setSearchTerms] = useState("Islamic clothing store\nmodest fashion boutique\nabaya store");
  const [leadLimit, setLeadLimit] = useState(5);
  const [onlyEmails, setOnlyEmails] = useState(true);
  const [campaignForm, setCampaignForm] = useState({
    name: "Modest Long Coat Outreach",
    type: "b2b" as CampaignType,
    jurisdiction: "UK",
    goal: "Find shops and boutiques that may stock or promote modest long coats.",
    offer: "Wholesale or affiliate access to a modest long coat collection.",
    channels: {
      email: true,
      hubspot: true,
      instagram: false,
      tiktok: false
    }
  });

  const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0];
  const selectedClient = initialData.clients.find((client) => client.id === selectedCampaign?.clientId);
  const campaignLeads = useMemo(
    () => leads.filter((lead) => lead.campaignId === selectedCampaign?.id),
    [leads, selectedCampaign?.id]
  );
  const metrics = selectedCampaign
    ? summarizeCampaign(selectedCampaign, leads)
    : { totalLeads: 0, approved: 0, review: 0, blocked: 0, averageFitScore: 0 };
  const enabledPolicies = initialData.channelPolicies.filter(
    (policy) => policy.campaignId === selectedCampaign?.id && policy.enabled
  );
  const highRiskTools = initialData.tools.filter((tool) => tool.riskLevel === "high");

  async function runAgents() {
    if (!selectedCampaign) {
      return;
    }

    setIsRunning(true);
    setRunError(null);

    try {
      const response = await fetch("/api/agent-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          hasRiskAcceptance: selectedCampaign.riskAcceptanceRequired
        })
      });

      if (!response.ok) {
        throw new Error("Agent run failed");
      }

      const payload = (await response.json()) as { agentRun: AgentRunResult };
      setAgentRun(payload.agentRun);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsRunning(false);
    }
  }

  async function createCoatCampaign() {
    setIsCreatingCampaign(true);
    setCampaignMessage(null);
    setRunError(null);

    const enabledChannels = Object.entries(campaignForm.channels)
      .filter(([, enabled]) => enabled)
      .map(([channel]) => channel as Channel);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: initialData.clients[0]?.id,
          name: campaignForm.name,
          type: campaignForm.type,
          lane: campaignForm.type === "b2c" ? "high_risk_cold_social" : "public_business_research",
          goal: campaignForm.goal,
          offer: campaignForm.offer,
          jurisdictions: [campaignForm.jurisdiction],
          enabledChannels
        })
      });

      const payload = (await response.json()) as { campaign?: Campaign; error?: string };

      if (!response.ok || !payload.campaign) {
        throw new Error(payload.error ?? "Campaign creation failed");
      }

      setCampaigns((current) => [payload.campaign!, ...current]);
      setSelectedCampaignId(payload.campaign.id);
      setCampaignMessage("Campaign created. Now run Apify discovery for this campaign.");
    } catch (error) {
      setCampaignMessage(error instanceof Error ? error.message : "Campaign creation failed");
    } finally {
      setIsCreatingCampaign(false);
    }
  }

  async function runApifyDiscovery() {
    if (!selectedCampaign) {
      setDiscoveryMessage("Create or select a campaign first.");
      return;
    }

    setIsDiscovering(true);
    setDiscoveryMessage(null);
    setRunError(null);

    try {
      const response = await fetch("/api/discovery/apify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildDiscoveryPayload(selectedCampaign.id, sourceKey, locationQuery, searchTerms, leadLimit),
          onlyEmails
        })
      });

      const payload = (await response.json()) as {
        discovery?: { importedLeads: LeadRecord[]; rawItemCount: number };
        error?: string;
      };

      if (!response.ok || !payload.discovery) {
        throw new Error(payload.error ?? "Apify discovery failed");
      }

      setLeads((current) => [...payload.discovery!.importedLeads, ...current]);
      setDiscoveryMessage(`Imported ${payload.discovery.importedLeads.length} lead candidates from Apify.`);
    } catch (error) {
      setDiscoveryMessage(error instanceof Error ? error.message : "Apify discovery failed");
    } finally {
      setIsDiscovering(false);
    }
  }

  async function clearCurrentLeads() {
    if (!selectedCampaign) {
      return;
    }

    setIsClearing(true);

    try {
      await fetch(`/api/leads?campaignId=${encodeURIComponent(selectedCampaign.id)}`, {
        method: "DELETE"
      });
      setLeads((current) => current.filter((lead) => lead.campaignId !== selectedCampaign.id));
      setDiscoveryMessage("Cleared leads for the selected campaign.");
    } finally {
      setIsClearing(false);
    }
  }

  async function clearAllDemoData() {
    setIsClearing(true);

    try {
      await fetch("/api/campaigns", {
        method: "DELETE"
      });
      setCampaigns([]);
      setLeads([]);
      setSelectedCampaignId("");
      setAgentRun(null);
      setCampaignMessage("Dummy campaigns and leads cleared. Create your own campaign next.");
    } finally {
      setIsClearing(false);
    }
  }

  async function toggleCampaignAutomation() {
    if (!selectedCampaign) return;
    const nextActiveState = !selectedCampaign.isActiveAutomation;
    
    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCampaign.id,
          isActiveAutomation: nextActiveState,
          status: nextActiveState ? "active" : "paused"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update campaign automation");
      
      setCampaigns((prev) => prev.map((c) => c.id === selectedCampaign.id ? data.campaign : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle automation");
    }
  }

  async function saveCampaignAutomationSettings(inboxId: string, templateId: string) {
    if (!selectedCampaign) return;
    
    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCampaign.id,
          connectedInboxId: inboxId || undefined,
          templateId: templateId || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save campaign settings");
      
      setCampaigns((prev) => prev.map((c) => c.id === selectedCampaign.id ? data.campaign : c));
      alert("Campaign settings saved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  async function addMockPdfToCampaign(fileName: string) {
    if (!selectedCampaign) return;
    const currentAttachments = selectedCampaign.attachments || [];
    if (currentAttachments.some((a) => a.name === fileName)) {
      alert("This attachment already exists.");
      return;
    }
    const newAttachment = {
      name: fileName,
      url: `/attachments/${fileName}`,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`
    };

    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCampaign.id,
          attachments: [...currentAttachments, newAttachment]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add PDF");

      setCampaigns((prev) => prev.map((c) => c.id === selectedCampaign.id ? data.campaign : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add PDF");
    }
  }

  async function removePdfFromCampaign(fileName: string) {
    if (!selectedCampaign) return;
    const currentAttachments = selectedCampaign.attachments || [];
    const updated = currentAttachments.filter((a) => a.name !== fileName);

    try {
      const res = await fetch("/api/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedCampaign.id,
          attachments: updated
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove PDF");

      setCampaigns((prev) => prev.map((c) => c.id === selectedCampaign.id ? data.campaign : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove PDF");
    }
  }

  async function connectEmailInbox() {
    if (!emailForm.email || !emailForm.smtpHost || !emailForm.smtpUser || !emailForm.smtpPass) {
      alert("Please fill in all connection fields.");
      return;
    }
    setIsConnectingEmail(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to connect email");
      
      setConnections((prev) => {
        const next = [data.connection, ...prev];
        localStorage.setItem("falcon_smtp_connections", JSON.stringify(next));
        return next;
      });

      setEmailForm({
        email: "",
        smtpHost: "",
        smtpPort: 465,
        smtpUser: "",
        smtpPass: "",
        provider: "smtp"
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to connect email");
    } finally {
      setIsConnectingEmail(false);
    }
  }

  async function removeConnection(id: string) {
    if (!confirm("Are you sure you want to disconnect this inbox?")) return;
    try {
      const res = await fetch(`/api/connections?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete connection");
      
      setConnections((prev) => {
        const next = prev.filter((item) => item.id !== id);
        localStorage.setItem("falcon_smtp_connections", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove connection");
    }
  }

  async function saveEmailTemplate() {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      setTemplateStatusMessage("Please fill in all template fields.");
      return;
    }
    setIsSavingTemplate(true);
    setTemplateStatusMessage(null);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save template");
      
      if (templateForm.id) {
        setTemplates((prev) => {
          const next = prev.map((item) => item.id === templateForm.id ? data.template : item);
          localStorage.setItem("falcon_email_templates", JSON.stringify(next));
          return next;
        });
        setTemplateStatusMessage("Template updated successfully!");
      } else {
        setTemplates((prev) => {
          const next = [data.template, ...prev];
          localStorage.setItem("falcon_email_templates", JSON.stringify(next));
          return next;
        });
        setTemplateStatusMessage("Template created successfully!");
      }
      setTemplateForm({ id: "", name: "", subject: "", body: "", isHtml: false, htmlContent: "" });
    } catch (err) {
      setTemplateStatusMessage(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setIsSavingTemplate(false);
    }
  }

  async function removeTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete template");
      
      setTemplates((prev) => {
        const next = prev.filter((item) => item.id !== id);
        localStorage.setItem("falcon_email_templates", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove template");
    }
  }

  async function sendDirectOutreach() {
    if (!outreachForm.leadId || !outreachForm.connectionId || !outreachForm.subject || !outreachForm.body) {
      setOutreachStatusMessage("Please fill in all outreach fields.");
      return;
    }
    setIsSendingOutreach(true);
    setOutreachStatusMessage(null);

    let toEmail = "";
    let toName = "";

    if (outreachForm.leadId === "custom") {
      toEmail = outreachForm.customEmail.trim();
      toName = outreachForm.customName.trim() || "Valued Customer";
      if (!toEmail) {
        setOutreachStatusMessage("Please enter a custom email address.");
        setIsSendingOutreach(false);
        return;
      }
      if (!/\S+@\S+\.\S+/.test(toEmail)) {
        setOutreachStatusMessage("Please enter a valid email address.");
        setIsSendingOutreach(false);
        return;
      }
    } else {
      const lead = leads.find((l) => l.id === outreachForm.leadId);
      toEmail = lead?.channelIdentities?.email || "";
      toName = lead?.displayName || "";

      if (!toEmail) {
        setOutreachStatusMessage("Selected lead does not have a connected email address.");
        setIsSendingOutreach(false);
        return;
      }
    }

    const template = templates.find((t) => t.id === outreachForm.templateId);
    const isHtml = template?.isHtml || false;
    const attachments = selectedCampaign?.attachments || [];

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: outreachForm.leadId,
          campaignId: selectedCampaign?.id,
          connectionId: outreachForm.connectionId,
          subject: outreachForm.subject,
          emailBody: outreachForm.body,
          toEmail,
          toName,
          isHtml,
          attachments
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      
      setSentMessages((prev) => [data.record, ...prev]);
      setOutreachStatusMessage("Email sent successfully!");
      setOutreachForm((prev) => ({
        ...prev,
        subject: "",
        body: "",
        customEmail: "",
        customName: "",
        customCompany: "",
        customJurisdiction: ""
      }));
    } catch (err) {
      setOutreachStatusMessage(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setIsSendingOutreach(false);
    }
  }

  function updateOutreachTemplateFields(templateId: string, leadId: string, customStateOverride?: Partial<typeof outreachForm>) {
    setOutreachForm((prev) => {
      const currentState = { ...prev, ...customStateOverride };
      
      const template = templates.find((t) => t.id === templateId);
      if (!template) return currentState;

      let body = template.isHtml ? (template.htmlContent || "") : template.body;
      let subject = template.subject;

      let name = "there";
      let companyName = "your company";
      let jurisdiction = "your area";

      if (leadId === "custom") {
        name = currentState.customName || "there";
        companyName = currentState.customCompany || "your company";
        jurisdiction = currentState.customJurisdiction || "your area";
      } else {
        const lead = leads.find((l) => l.id === leadId);
        if (lead) {
          name = lead.displayName || "there";
          companyName = lead.companyName || lead.displayName || "your company";
          jurisdiction = lead.jurisdiction || "your area";
        }
      }

      const offerText = selectedCampaign?.offer || "our latest collections";

      const replaceVars = (text: string) => {
        if (!text) return "";
        return text
          .replaceAll("{{name}}", name)
          .replaceAll("{{Name}}", name)
          .replaceAll("{{NAME}}", name)
          
          .replaceAll("{{companyName}}", companyName)
          .replaceAll("{{company}}", companyName)
          .replaceAll("{{CompanyName}}", companyName)
          .replaceAll("{{Company}}", companyName)
          .replaceAll("{{COMPANY}}", companyName)
          
          .replaceAll("{{jurisdiction}}", jurisdiction)
          .replaceAll("{{Jurisdiction}}", jurisdiction)
          
          .replaceAll("{{offer}}", offerText)
          .replaceAll("{{Offer}}", offerText);
      };

      return {
        ...currentState,
        templateId,
        subject: replaceVars(subject),
        body: replaceVars(body)
      };
    });
  }


  return (
    <main className="dashboard-shell">
      <aside className="sidebar" aria-label="Workspace navigation">
        <div className="brand-lockup">
          <span className="brand-mark">
            <Bot size={22} aria-hidden="true" />
          </span>
          <div>
            <strong>AI Lead Agent</strong>
            <span>Agency console</span>
          </div>
        </div>

        <nav className="nav-stack">
          <button className={`nav-item ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
            <Target size={18} aria-hidden="true" />
            Campaigns
          </button>
          <button className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`} onClick={() => setActiveTab('leads')}>
            <Users size={18} aria-hidden="true" />
            Extracted Leads
          </button>
          <button className={`nav-item ${activeTab === 'inboxes' ? 'active' : ''}`} onClick={() => setActiveTab('inboxes')}>
            <Mail size={18} aria-hidden="true" />
            Inboxes & Templates
          </button>
          <button className={`nav-item ${activeTab === 'outreach' ? 'active' : ''}`} onClick={() => setActiveTab('outreach')}>
            <Play size={18} aria-hidden="true" />
            Outreach Direct
          </button>
          <button className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`} onClick={() => setActiveTab('agents')}>
            <Sparkles size={18} aria-hidden="true" />
            Agents
          </button>
          <button className={`nav-item ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>
            <ShieldCheck size={18} aria-hidden="true" />
            Compliance
          </button>
          <button className={`nav-item ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => setActiveTab('roadmap')}>
            <ClipboardCheck size={18} aria-hidden="true" />
            Roadmap
          </button>
        </nav>


        <div className="sidebar-note">
          <AlertTriangle size={18} aria-hidden="true" />
          Browser automation is gated behind risk acceptance, audit logs, and kill switches.
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Northstar Growth Studio</p>
            <h1>Lead generation command center</h1>
            <p className="subtle">
              Run B2B and B2C campaigns while keeping consented leads separate from high-risk social automation.
            </p>
          </div>
          <button className="primary-action" onClick={runAgents} disabled={isRunning} title="Run agent simulation">
            {isRunning ? <RefreshCcw size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {isRunning ? "Running" : "Run agents"}
          </button>
        </header>

        <section className="metric-grid" aria-label="Campaign metrics">
          <Metric label="Leads" value={metrics.totalLeads} icon={Users} tone="teal" />
          <Metric label="Qualified" value={metrics.approved} icon={CheckCircle2} tone="green" />
          <Metric label="Review" value={metrics.review} icon={TriangleAlert} tone="amber" />
          <Metric label="Avg fit" value={`${metrics.averageFitScore}%`} icon={TrendingUp} tone="coral" />
        </section>

        {activeTab === 'campaigns' && (
          <div className="tab-content campaigns-tab">
            {/* Simple Premium Explanatory Banner */}
            <div style={{
              background: "#edf8f5",
              border: "1px solid rgba(15, 118, 110, 0.2)",
              borderRadius: "8px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              color: "var(--ink)",
              fontSize: "0.9rem",
              lineHeight: "1.5"
            }}>
              <h3 style={{ margin: "0 0 0.5rem", color: "var(--teal)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: "700" }}>
                🎯 Easy Start Guide: How to Generate Leads
              </h3>
              <p style={{ margin: 0, opacity: 0.9 }}>
                A <strong>Campaign</strong> is a project folder for your business goal. Setting up is as simple as 1-2-3:
              </p>
              <ol style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", display: "grid", gap: "0.25rem" }}>
                <li><strong>Create a Campaign:</strong> Enter your Campaign Name, select the target Country, and click <strong>+ Create campaign</strong> on the left.</li>
                <li><strong>Select Scraper Settings:</strong> On the right, choose your source (like <strong>Google Maps</strong>), select the location, and type your search keywords.</li>
                <li><strong>Run:</strong> Check <strong>"Only extract/import leads with email addresses"</strong> to get only emails, and click <strong>Run Apify</strong>! Your new leads will appear in the <strong>Extracted Leads</strong> tab on the left.</li>
              </ol>
            </div>

            <section className="split-grid">
          <article className="panel action-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create campaign</p>
                <h2>Modest coat outreach</h2>
              </div>
              <Plus size={20} aria-hidden="true" />
            </div>

            <div className="form-grid">
              <label className="wide-field">
                <span>Campaign name</span>
                <input
                  value={campaignForm.name}
                  onChange={(event) => setCampaignForm((form) => ({ ...form, name: event.target.value }))}
                />
              </label>
              <label>
                <span>Campaign Type</span>
                <select
                  value={campaignForm.type}
                  onChange={(event) => setCampaignForm((form) => ({ ...form, type: event.target.value as CampaignType }))}
                >
                  <option value="b2b">B2B (Business Outreach)</option>
                  <option value="b2c">B2C (Consumer Outreach)</option>
                </select>
              </label>
              <label>
                <span>Country</span>
                <select
                  value={campaignForm.jurisdiction}
                  onChange={(event) => setCampaignForm((form) => ({ ...form, jurisdiction: event.target.value }))}
                >
                  {/* Core requested markets */}
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="US">United States (USA)</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  
                  {/* Middle East & Gulf States */}
                  <option value="AE">United Arab Emirates (UAE)</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="KW">Kuwait</option>
                  <option value="QA">Qatar</option>
                  <option value="BH">Bahrain</option>
                  
                  {/* European Countries */}
                  <option value="AT">Austria</option>
                  <option value="BE">Belgium</option>
                  <option value="DK">Denmark</option>
                  <option value="FI">Finland</option>
                  <option value="FR">France</option>
                  <option value="DE">Germany</option>
                  <option value="GR">Greece</option>
                  <option value="IE">Ireland</option>
                  <option value="IT">Italy</option>
                  <option value="NL">Netherlands</option>
                  <option value="NO">Norway</option>
                  <option value="PL">Poland</option>
                  <option value="PT">Portugal</option>
                  <option value="ES">Spain</option>
                  <option value="SE">Sweden</option>
                  <option value="CH">Switzerland</option>
                </select>
              </label>
              <label className="wide-field">
                <span>Goal</span>
                <textarea
                  value={campaignForm.goal}
                  onChange={(event) => setCampaignForm((form) => ({ ...form, goal: event.target.value }))}
                  rows={3}
                />
              </label>
              <label className="wide-field">
                <span>Offer</span>
                <textarea
                  value={campaignForm.offer}
                  onChange={(event) => setCampaignForm((form) => ({ ...form, offer: event.target.value }))}
                  rows={2}
                />
              </label>
            </div>

            <div className="button-row">
              <button className="primary-action" onClick={createCoatCampaign} disabled={isCreatingCampaign}>
                <Plus size={18} aria-hidden="true" />
                {isCreatingCampaign ? "Creating" : "Create campaign"}
              </button>
              <button className="secondary-action danger" onClick={clearAllDemoData} disabled={isClearing}>
                <Eraser size={18} aria-hidden="true" />
                Clear dummy data
              </button>
            </div>
            {campaignMessage ? <p className="helper-text">{campaignMessage}</p> : null}
          </article>

          <article className="panel action-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Run discovery</p>
                <h2>Apify lead source</h2>
              </div>
              <Search size={20} aria-hidden="true" />
            </div>

            <div className="form-grid">
              <label>
                <span>Source</span>
                <select value={sourceKey} onChange={(event) => setSourceKey(event.target.value as ApifySourceKey)}>
                  <option value="google_maps">Google Maps Scraper (with Emails)</option>
                  <option value="google_search">Google Search Scraper</option>
                  <option value="website_contacts">Website Email & Contact Extractor</option>
                  <option value="instagram_profile">Instagram Profile Email Extractor</option>
                  <option value="tiktok_profile">TikTok Profile Email Extractor</option>
                  <option value="facebook_pages">Facebook Pages Email Extractor</option>
                  <option value="instagram">Instagram Hashtag research</option>
                  <option value="tiktok">TikTok Video keyword research</option>
                </select>
              </label>
              <label>
                <span>Lead limit</span>
                <input
                  min={1}
                  max={250}
                  type="number"
                  value={leadLimit}
                  onChange={(event) => setLeadLimit(Number(event.target.value))}
                />
              </label>

              {sourceKey !== "website_contacts" && (
                <label className="wide-field">
                  <span>Location / Country</span>
                  <input 
                    value={locationQuery} 
                    onChange={(event) => setLocationQuery(event.target.value)} 
                    placeholder="e.g. London, United Kingdom or Austin, TX"
                  />
                </label>
              )}

              <label className="wide-field">
                <span>{sourceKey === "website_contacts" ? "Website domains / URLs" : "Search categories / keywords"}</span>
                <textarea
                  value={searchTerms}
                  onChange={(event) => setSearchTerms(event.target.value)}
                  rows={4}
                  placeholder={
                    sourceKey === "website_contacts"
                      ? "Enter website domains/URLs (one per line)\ne.g.\nmodestangel.co.uk\nalmanaar.co.uk"
                      : "Enter search keywords (one per line)\ne.g.\nIslamic clothing store\nmodest boutique\nabaya store"
                  }
                />
              </label>

              {/* Only Emails switch checkbox */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", gridColumn: "1 / -1", cursor: "pointer", marginTop: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={onlyEmails}
                  onChange={(event) => setOnlyEmails(event.target.checked)}
                  style={{ width: "auto", height: "auto", cursor: "pointer" }}
                />
                <span style={{ fontSize: "0.85rem", textTransform: "none", color: "var(--ink)", fontWeight: 500 }}>
                  Only extract/import leads with email addresses
                </span>
              </label>
            </div>

            <div className="button-row">
              <button className="primary-action" onClick={runApifyDiscovery} disabled={isDiscovering || !selectedCampaign}>
                <Search size={18} aria-hidden="true" />
                {isDiscovering ? "Discovering" : "Run Apify"}
              </button>
              <button className="secondary-action" onClick={clearCurrentLeads} disabled={isClearing || !selectedCampaign}>
                <Eraser size={18} aria-hidden="true" />
                Clear leads
              </button>
            </div>
            {discoveryMessage ? <p className="helper-text">{discoveryMessage}</p> : null}
          </article>
        </section>

        <section className="main-grid" id="campaigns">
          <article className="panel campaign-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Campaigns</p>
                <h2>Client workspaces</h2>
              </div>
              <span className="count-pill">{campaigns.length} live records</span>
            </div>

            <div className="campaign-list">
              {campaigns.map((campaign) => {
                const client = initialData.clients.find((item) => item.id === campaign.clientId);
                const isSelected = campaign.id === selectedCampaign?.id;

                return (
                  <button
                    className={`campaign-row ${isSelected ? "selected" : ""}`}
                    key={campaign.id}
                    onClick={() => setSelectedCampaignId(campaign.id)}
                  >
                    <span>
                      <strong>{campaign.name}</strong>
                      <small>{client?.name ?? "Unknown client"}</small>
                    </span>
                    <span className={`status-badge ${campaign.status}`}>{statusLabel[campaign.status]}</span>
                  </button>
                );
              })}
              {campaigns.length === 0 ? (
                <div className="empty-state compact">
                  <p>No campaigns yet. Create your first campaign above.</p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="panel" style={{ flex: 1.5 }}>
            <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p className="eyebrow">Control Center & Automation Room</p>
                <h2>{selectedCampaign ? `${selectedCampaign.name} Suite` : "No campaign selected"}</h2>
              </div>
              <span className={`lane-badge ${selectedCampaign?.lane}`} style={{ padding: "0.25rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" }}>
                {formatLane(selectedCampaign?.lane)}
              </span>
            </div>

            {selectedCampaign ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
                {/* 1. Live Automation Control Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", padding: "1.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem" }}>
                      <Activity size={18} style={{ color: selectedCampaign.isActiveAutomation ? "#22c55e" : "#ef4444" }} />
                      Campaign Automation Status
                    </h3>
                    <p style={{ margin: "0", fontSize: "0.85rem", opacity: 0.7 }}>
                      {selectedCampaign.isActiveAutomation
                        ? "LIVE: Actively delivering outbound outreach using connected credentials in the background."
                        : "PAUSED: Campaign automation is suspended. Select credentials and templates below."}
                    </p>
                  </div>
                  
                  <button
                    className={`primary-action ${selectedCampaign.isActiveAutomation ? "danger" : ""}`}
                    style={{ padding: "0.5rem 1.25rem", borderRadius: "30px", fontWeight: "bold", background: selectedCampaign.isActiveAutomation ? "#ef4444" : "#22c55e" }}
                    onClick={toggleCampaignAutomation}
                  >
                    {selectedCampaign.isActiveAutomation ? <PauseCircle size={18} /> : <Play size={18} />}
                    {selectedCampaign.isActiveAutomation ? "Stop Automation" : "Start Automation"}
                  </button>
                </div>

                {/* 2. Credentials and Template Linker */}
                <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <label>
                    <span>Connected Dispatch Inbox</span>
                    <select
                      value={selectedCampaign.connectedInboxId || ""}
                      onChange={(e) => saveCampaignAutomationSettings(e.target.value, selectedCampaign.templateId || "")}
                    >
                      <option value="">No inbox connected...</option>
                      {connections.map((c) => (
                        <option value={c.id} key={c.id}>{c.email} ({c.smtpHost})</option>
                      ))}
                    </select>
                  </label>
                  
                  <label>
                    <span>Outbound Copy Template</span>
                    <select
                      value={selectedCampaign.templateId || ""}
                      onChange={(e) => saveCampaignAutomationSettings(selectedCampaign.connectedInboxId || "", e.target.value)}
                    >
                      <option value="">No template associated...</option>
                      {templates.map((t) => (
                        <option value={t.id} key={t.id}>{t.name} ({t.isHtml ? "HTML" : "Text"})</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* 3. Rich Document Builder & PDF Attachments */}
                <div style={{ background: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem" }}>
                    <ClipboardCheck size={16} /> Rich Document Explorer (PDFs & Catalogs)
                  </h3>
                  <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0 0 1rem 0" }}>
                    Configure sales attachments (catalog, wholesale price briefs, partnership agreements) that will be appended to outgoing emails automatically.
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    {selectedCampaign.attachments?.map((att) => (
                      <div key={att.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.15)", padding: "0.35rem 0.75rem", borderRadius: "30px", fontSize: "0.75rem" }}>
                        <span>📁 <strong>{att.name}</strong> ({att.size})</span>
                        <button
                          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold", marginLeft: "0.25rem" }}
                          onClick={() => removePdfFromCampaign(att.name)}
                          title="Remove PDF"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {(!selectedCampaign.attachments || selectedCampaign.attachments.length === 0) && (
                      <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>No rich documents attached yet. Quick-add below:</span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button className="secondary-action" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={() => addMockPdfToCampaign("wholesale_catalog.pdf")}>
                      + Attach wholesale_catalog.pdf
                    </button>
                    <button className="secondary-action" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }} onClick={() => addMockPdfToCampaign("partnership_agreement.pdf")}>
                      + Attach partnership_agreement.pdf
                    </button>
                  </div>
                </div>

                {/* 4. Beautiful Design Mode Indicator */}
                <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", opacity: 0.8 }}>
                  <div>
                    <strong>Enabled Channels:</strong> {selectedCampaign.enabledChannels.join(", ")}
                  </div>
                  <div>
                    <strong>AUTONOMY:</strong> {formatSnake(selectedCampaign.autonomyLevel).toUpperCase()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Target size={28} aria-hidden="true" />
                <p>Create or select a campaign to configure its SMTP routing, rich templates, HTML copy, and start automation.</p>
              </div>
            )}
          </article>
        </section>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="tab-content leads-tab">
            <section className="panel" id="leads" style={{ marginBottom: "1.5rem" }}>
              <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p className="eyebrow">Apify Extracted Data</p>
                  <h2>Discovered Leads Explorer ({campaignLeads.length} total)</h2>
                </div>
                <Users size={20} aria-hidden="true" />
              </div>

              <div className="lead-table" role="table" aria-label="Extracted Leads" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--ink)", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid var(--line)", paddingBottom: "0.5rem", opacity: 0.8 }}>
                      <th style={{ padding: "0.75rem" }}>Lead & Segment</th>
                      <th style={{ padding: "0.75rem" }}>Contact Details</th>
                      <th style={{ padding: "0.75rem" }}>Physical Location</th>
                      <th style={{ padding: "0.75rem" }}>Source</th>
                      <th style={{ padding: "0.75rem" }}>Scores & Lane</th>
                      <th style={{ padding: "0.75rem" }}>Direct Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLeads.map((lead) => {
                      const hasEmail = Boolean(lead.channelIdentities?.email);
                      return (
                        <tr key={lead.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <strong>{lead.displayName}</strong>
                            <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{lead.segment}</div>
                            {lead.companyName && (
                              <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>🏢 {lead.companyName}</div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <div>📧 {hasEmail ? lead.channelIdentities.email : <span style={{ opacity: 0.5, fontStyle: "italic" }}>No direct email</span>}</div>
                            {lead.phone && <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>📞 {lead.phone}</div>}
                            {lead.website && (
                              <div style={{ fontSize: "0.75rem" }}>
                                🔗 <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", textDecoration: "underline" }}>
                                  {lead.website.replace("https://", "").replace("http://", "").split("/")[0]}
                                </a>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem", opacity: 0.8 }}>
                            {lead.address ? lead.address : <span style={{ opacity: 0.4 }}>-</span>}
                            <div style={{ fontSize: "0.7rem", opacity: 0.5 }}>Region: {lead.jurisdiction}</div>
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{ fontSize: "0.75rem", opacity: 0.7, textTransform: "capitalize" }}>{lead.sourceType.replaceAll("_", " ")}</span>
                            {lead.sourceUrl && (
                              <div style={{ fontSize: "0.7rem" }}>
                                <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>
                                  View platform listing
                                </a>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ fontSize: "0.75rem" }}>Fit: <strong style={{ color: "#22c55e" }}>{lead.fitScore}</strong> | Risk: <strong style={{ color: lead.riskScore > 75 ? "#ef4444" : "#eab308" }}>{lead.riskScore}</strong></div>
                            <span className={`lane-dot ${lead.lane}`} style={{ display: "inline-block", marginTop: "0.25rem", fontSize: "0.7rem" }}>
                              {formatLane(lead.lane)}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <button
                              className="primary-action"
                              disabled={!hasEmail}
                              style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", background: hasEmail ? "#22c55e" : "rgba(255,255,255,0.06)", cursor: hasEmail ? "pointer" : "not-allowed" }}
                              onClick={() => {
                                if (selectedCampaign?.templateId) {
                                  updateOutreachTemplateFields(selectedCampaign.templateId, lead.id, { leadId: lead.id });
                                } else {
                                  setOutreachForm((prev) => ({ ...prev, leadId: lead.id }));
                                }
                                setActiveTab("outreach");
                              }}
                              title={hasEmail ? "Compose and send email" : "Cannot send direct email without email address"}
                            >
                              Dispatch Email
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {campaignLeads.length === 0 && (
                  <div className="empty-state compact" style={{ padding: "2rem" }}>
                    <p>No discovered leads in this campaign yet. Run Apify discovery under the Campaigns tab.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'compliance' && (
          <section className="panel" id="compliance">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Compliance controls</p>
                <h2>Channel policy</h2>
              </div>
              <ShieldCheck size={20} aria-hidden="true" />
            </div>

            <div className="policy-list">
              {enabledPolicies.map((policy) => {
                const Icon = channelIcons[policy.channel];
                return (
                  <div className="policy-row" key={policy.id}>
                    <span className="policy-channel">
                      <Icon size={16} aria-hidden="true" />
                      {policy.channel}
                    </span>
                    <span>{formatSnake(policy.mode)}</span>
                    <span className={`risk-pill ${policy.riskLevel}`}>{policy.riskLevel}</span>
                  </div>
                );
              })}
            </div>

            <div className="risk-callout">
              <PauseCircle size={18} aria-hidden="true" />
              <span>{highRiskTools.length} high-risk tool is present and disabled by default in the tool gateway.</span>
            </div>
          </section>
        )}

        {activeTab === 'agents' && (
          <section className="split-grid">
          <article className="panel" id="agents">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Agent mesh</p>
                <h2>Specialized workers</h2>
              </div>
              <Activity size={20} aria-hidden="true" />
            </div>

            <div className="agent-grid">
              {initialData.agents.map((agent) => (
                <div className="agent-card" key={agent.id}>
                  <div>
                    <strong>{agent.name}</strong>
                    <p>{agent.purpose}</p>
                  </div>
                  <span className={`agent-status ${agent.status}`}>{agent.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Latest run</p>
                <h2>Autonomy simulation</h2>
              </div>
              <Bot size={20} aria-hidden="true" />
            </div>

            {runError ? <p className="error-text">{runError}</p> : null}
            {agentRun ? (
              <div className="run-result">
                <div className="run-metrics">
                  <Detail label="Evaluated" value={String(agentRun.summary.leadsEvaluated)} />
                  <Detail label="Approved" value={String(agentRun.summary.approvedActions)} />
                  <Detail label="Review" value={String(agentRun.summary.reviewActions)} />
                  <Detail label="Blocked" value={String(agentRun.summary.blockedActions)} />
                </div>
                <div className="decision-list">
                  {agentRun.decisions.map((decision) => (
                    <div className={`decision-row ${decision.status}`} key={`${decision.leadId}-${decision.channel}`}>
                      <span>{decision.channel}</span>
                      <strong>{decision.status.replace("_", " ")}</strong>
                      <small>{decision.policyCodes.join(", ")}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <Bot size={28} aria-hidden="true" />
                <p>Run the agents to simulate discovery, compliance checks, and channel routing for this campaign.</p>
              </div>
            )}
          </article>
        </section>
        )}

        {activeTab === 'roadmap' && (
          <section className="panel roadmap-panel" id="roadmap">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Implementation roadmap</p>
              <h2>Build sequence</h2>
            </div>
            <ClipboardCheck size={20} aria-hidden="true" />
          </div>
          <div className="roadmap-list">
            {initialData.roadmap.map((phase) => (
              <div className="roadmap-item" key={phase.id}>
                <span className={`roadmap-status ${phase.status}`}>{formatSnake(phase.status)}</span>
                <strong>{phase.name}</strong>
                <p>{phase.deliverables.join(" / ")}</p>
              </div>
            ))}
          </div>
        </section>
        )}

        {activeTab === 'inboxes' && (
          <div className="tab-content inboxes-tab">
            <section className="split-grid">
              <article className="panel action-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">SMTP connections</p>
                    <h2>Connect email inbox</h2>
                  </div>
                  <Mail size={20} aria-hidden="true" />
                </div>

                <div className="form-grid">
                  <label>
                    <span>Sender Email Address</span>
                    <input
                      placeholder="e.g. outreach@agency.com"
                      value={emailForm.email}
                      onChange={(event) => setEmailForm((form) => ({ ...form, email: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>Provider</span>
                    <select
                      value={emailForm.provider}
                      onChange={(event) => setEmailForm((form) => ({ ...form, provider: event.target.value as any }))}
                    >
                      <option value="smtp">Standard SMTP</option>
                      <option value="gmail">Gmail</option>
                      <option value="outlook">Outlook</option>
                    </select>
                  </label>
                  <label>
                    <span>SMTP Host</span>
                    <input
                      placeholder="smtp.resend.com"
                      value={emailForm.smtpHost}
                      onChange={(event) => setEmailForm((form) => ({ ...form, smtpHost: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>SMTP Port</span>
                    <input
                      type="number"
                      value={emailForm.smtpPort}
                      onChange={(event) => setEmailForm((form) => ({ ...form, smtpPort: Number(event.target.value) }))}
                    />
                  </label>
                  <label>
                    <span>SMTP Username</span>
                    <input
                      placeholder="smtp_user"
                      value={emailForm.smtpUser}
                      onChange={(event) => setEmailForm((form) => ({ ...form, smtpUser: event.target.value }))}
                    />
                  </label>
                  <label>
                    <span>SMTP Password</span>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={emailForm.smtpPass}
                      onChange={(event) => setEmailForm((form) => ({ ...form, smtpPass: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="button-row">
                  <button className="primary-action" onClick={connectEmailInbox} disabled={isConnectingEmail}>
                    <Plus size={18} aria-hidden="true" />
                    {isConnectingEmail ? "Connecting..." : "Connect Inbox"}
                  </button>
                </div>

                <div className="connection-list" style={{ marginTop: "1.5rem" }}>
                  <h3>Connected Inboxes ({connections.length})</h3>
                  {connections.map((conn) => (
                    <div className="policy-row" key={conn.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div>
                        <strong>{conn.email}</strong>
                        <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{conn.smtpHost}:{conn.smtpPort} ({conn.provider})</div>
                      </div>
                      <button className="secondary-action danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => removeConnection(conn.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: "0.5rem" }}>No inboxes connected yet. Add SMTP details above.</p>
                  )}
                </div>
              </article>

              <article className="panel action-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Outreach copy</p>
                    <h2>Template builder</h2>
                  </div>
                  <Sparkles size={20} aria-hidden="true" />
                </div>

                <div className="form-grid">
                  <label className="wide-field">
                    <span>Template Name</span>
                    <input
                      placeholder="e.g. Autumn boutique partnership"
                      value={templateForm.name}
                      onChange={(event) => setTemplateForm((form) => ({ ...form, name: event.target.value }))}
                    />
                  </label>
                  <label className="wide-field">
                    <span>Subject Line</span>
                    <input
                      placeholder="Partnership Inquiry for {{companyName}}"
                      value={templateForm.subject}
                      onChange={(event) => setTemplateForm((form) => ({ ...form, subject: event.target.value }))}
                    />
                  </label>
                  
                  {/* HTML mode selector */}
                  <label className="wide-field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={templateForm.isHtml}
                      onChange={(event) => setTemplateForm((form) => ({ ...form, isHtml: event.target.checked }))}
                    />
                    <span>Design in Custom HTML Code Mode</span>
                  </label>

                  {templateForm.isHtml ? (
                    <label className="wide-field">
                      <span>HTML Layout Code (paste your custom design)</span>
                      <textarea
                        placeholder="<div style='font-family: Arial;'>Hi {{name}},\n\n...</div>"
                        rows={10}
                        style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#10b981", background: "#111" }}
                        value={templateForm.htmlContent}
                        onChange={(event) => setTemplateForm((form) => ({ ...form, htmlContent: event.target.value, body: event.target.value }))}
                      />
                    </label>
                  ) : (
                    <label className="wide-field">
                      <span>Email Body</span>
                      <textarea
                        placeholder="Hi {{name}},\n\nI noticed your store..."
                        rows={8}
                        value={templateForm.body}
                        onChange={(event) => setTemplateForm((form) => ({ ...form, body: event.target.value }))}
                      />
                    </label>
                  )}
                </div>

                {templateStatusMessage && (
                  <p className="helper-text" style={{ color: templateStatusMessage.includes("success") ? "#22c55e" : "#ef4444" }}>
                    {templateStatusMessage}
                  </p>
                )}

                <div className="button-row">
                  <button className="primary-action" onClick={saveEmailTemplate} disabled={isSavingTemplate}>
                    <Plus size={18} aria-hidden="true" />
                    {isSavingTemplate ? "Saving..." : templateForm.id ? "Update Template" : "Save Template"}
                  </button>
                  {templateForm.id && (
                    <button className="secondary-action" onClick={() => setTemplateForm({ id: "", name: "", subject: "", body: "", isHtml: false, htmlContent: "" })}>
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="connection-list" style={{ marginTop: "1.5rem" }}>
                  <h3>Saved Templates ({templates.length})</h3>
                  {templates.map((tpl) => (
                    <div className="policy-row" key={tpl.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <strong>{tpl.name}</strong>
                          <span style={{ fontSize: "0.65rem", background: tpl.isHtml ? "#10b981" : "#6b7280", padding: "0.1rem 0.35rem", borderRadius: "10px", color: "#fff" }}>
                            {tpl.isHtml ? "HTML" : "Text"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>{tpl.subject}</div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="secondary-action" style={{ padding: "0.25rem 0.5rem" }} onClick={() => setTemplateForm({ id: tpl.id, name: tpl.name, subject: tpl.subject, body: tpl.body, isHtml: tpl.isHtml || false, htmlContent: tpl.htmlContent || "" })}>
                          Edit
                        </button>
                        <button className="secondary-action danger" style={{ padding: "0.25rem 0.5rem" }} onClick={() => removeTemplate(tpl.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="risk-callout" style={{ marginTop: "1.5rem", background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px", padding: "1rem" }}>
                  <h4 style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "0.5rem", margin: "0 0 0.5rem 0", fontSize: "0.95rem" }}>
                    <Sparkles size={16} /> Template Builder Guide
                  </h4>
                  <p style={{ fontSize: "0.85rem", margin: "0 0 0.75rem 0", lineHeight: "1.4", opacity: 0.85 }}>
                    To build highly personalized custom templates that feel premium and organic, you can inject standard merge variables inside your **Subject Line** or **Email Body**.
                  </p>
                  <ul style={{ fontSize: "0.8rem", margin: "0", paddingLeft: "1.2rem", lineHeight: "1.6", opacity: 0.9 }}>
                    <li><code>{"{{name}}"}</code> - Resolves to the lead's displayName (fallback: there)</li>
                    <li><code>{"{{companyName}}"}</code> - Resolves to the lead's companyName (fallback: your boutique)</li>
                    <li><code>{"{{jurisdiction}}"}</code> - Resolves to the lead's country code/region (e.g. UK)</li>
                    <li><code>{"{{offer}}"}</code> - Resolves to the Campaign's unique Offer Brief</li>
                  </ul>
                </div>
              </article>
            </section>
          </div>
        )}

        {activeTab === 'outreach' && (
          <div className="tab-content outreach-tab">
            <section className="split-grid">
              <article className="panel action-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Outbound dispatch</p>
                    <h2>Direct outreach system</h2>
                  </div>
                  <Play size={20} aria-hidden="true" />
                </div>

                <div className="form-grid">
                  <label>
                    <span>Campaign context</span>
                    <select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)}>
                      {campaigns.map((c) => (
                        <option value={c.id} key={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Target Lead (with email)</span>
                    <select
                      value={outreachForm.leadId}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (outreachForm.templateId) {
                          updateOutreachTemplateFields(outreachForm.templateId, val, { leadId: val });
                        } else {
                          setOutreachForm((prev) => ({ ...prev, leadId: val }));
                        }
                      }}
                    >
                      <option value="">Select a lead...</option>
                      <option value="custom" style={{ fontWeight: "bold" }}>✍️ Type custom email...</option>
                      {campaignLeads.filter(l => l.channelIdentities?.email).map((l) => (
                        <option value={l.id} key={l.id}>{l.displayName} ({l.channelIdentities.email})</option>
                      ))}
                    </select>
                  </label>

                  {outreachForm.leadId === "custom" && (
                    <div style={{
                      gridColumn: "1 / -1",
                      background: "rgba(255, 255, 255, 0.03)",
                      padding: "1.25rem",
                      borderRadius: "8px",
                      border: "1px dashed var(--line)",
                      marginTop: "0.25rem",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "1rem"
                    }}>
                      <label style={{ margin: 0 }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Target Email Address *</span>
                        <input
                          type="email"
                          placeholder="e.g. contact@boutique.com"
                          value={outreachForm.customEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutreachForm(prev => ({ ...prev, customEmail: val }));
                          }}
                        />
                      </label>

                      <label style={{ margin: 0 }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Recipient Name</span>
                        <input
                          type="text"
                          placeholder="e.g. Fatima Rana"
                          value={outreachForm.customName}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (outreachForm.templateId) {
                              updateOutreachTemplateFields(outreachForm.templateId, "custom", { customName: val });
                            } else {
                              setOutreachForm(prev => ({ ...prev, customName: val }));
                            }
                          }}
                        />
                      </label>

                      <label style={{ margin: 0 }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Company Name</span>
                        <input
                          type="text"
                          placeholder="e.g. Fatima's Boutique"
                          value={outreachForm.customCompany}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (outreachForm.templateId) {
                              updateOutreachTemplateFields(outreachForm.templateId, "custom", { customCompany: val });
                            } else {
                              setOutreachForm(prev => ({ ...prev, customCompany: val }));
                            }
                          }}
                        />
                      </label>

                      <label style={{ margin: 0 }}>
                        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>Country / Jurisdiction</span>
                        <input
                          type="text"
                          placeholder="e.g. UK"
                          value={outreachForm.customJurisdiction}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (outreachForm.templateId) {
                              updateOutreachTemplateFields(outreachForm.templateId, "custom", { customJurisdiction: val });
                            } else {
                              setOutreachForm(prev => ({ ...prev, customJurisdiction: val }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <label>
                    <span>Select Sending Inbox</span>
                    <select
                      value={outreachForm.connectionId}
                      onChange={(event) => setOutreachForm((prev) => ({ ...prev, connectionId: event.target.value }))}
                    >
                      <option value="">Select connected inbox...</option>
                      {connections.map((c) => (
                        <option value={c.id} key={c.id}>{c.email} ({c.smtpHost})</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Select Template</span>
                    <select
                      value={outreachForm.templateId}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateOutreachTemplateFields(val, outreachForm.leadId);
                      }}
                    >
                      <option value="">Select template...</option>
                      {templates.map((t) => (
                        <option value={t.id} key={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="form-grid" style={{ marginTop: "1rem" }}>
                  <label className="wide-field">
                    <span>Populated Subject Line (editable)</span>
                    <input
                      placeholder="Subject"
                      value={outreachForm.subject}
                      onChange={(event) => setOutreachForm((prev) => ({ ...prev, subject: event.target.value }))}
                    />
                  </label>
                  <label className="wide-field">
                    <span>Populated Message Body (editable)</span>
                    <textarea
                      placeholder="Message content"
                      rows={8}
                      value={outreachForm.body}
                      onChange={(event) => setOutreachForm((prev) => ({ ...prev, body: event.target.value }))}
                    />
                  </label>
                </div>

                {outreachStatusMessage && (
                  <p className="helper-text" style={{ color: outreachStatusMessage.includes("successfully") ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                    {outreachStatusMessage}
                  </p>
                )}

                <div className="button-row">
                  <button
                    className="primary-action"
                    onClick={sendDirectOutreach}
                    disabled={
                      isSendingOutreach ||
                      !outreachForm.leadId ||
                      !outreachForm.connectionId ||
                      (outreachForm.leadId === "custom" && !outreachForm.customEmail)
                    }
                  >
                    <Mail size={18} aria-hidden="true" />
                    {isSendingOutreach ? "Sending Outreach..." : "Send Email Direct"}
                  </button>
                </div>
              </article>

              <article className="panel campaign-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Outbox logs</p>
                    <h2>Sent history</h2>
                  </div>
                  <Database size={20} aria-hidden="true" />
                </div>

                <div className="campaign-list" style={{ gap: "0.75rem" }}>
                  {sentMessages.map((sent) => (
                    <div className="campaign-row" key={sent.id} style={{ display: "block", cursor: "default", border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <strong>{sent.leadName}</strong>
                        <span className={`status-badge ${sent.status === "sent" ? "active" : "review"}`} style={{ padding: "0.15rem 0.4rem", fontSize: "0.7rem" }}>
                          {sent.status === "sent" ? "Delivered" : "Failed"}
                        </span>
                      </div>
                      <small style={{ display: "block", opacity: 0.6, fontSize: "0.75rem" }}>To: {sent.leadEmail}</small>
                      <div style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", color: "#ddd" }}>Subject: {sent.subject}</div>
                      {sent.error && (
                        <div style={{ color: "#ef4444", fontSize: "0.75rem", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "4px", padding: "0.5rem", marginTop: "0.5rem" }}>
                          Error: {sent.error}
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", opacity: 0.4, marginTop: "0.5rem", textAlign: "right" }}>{new Date(sent.sentAt).toLocaleString()}</div>
                    </div>
                  ))}
                  {sentMessages.length === 0 && (
                    <div className="empty-state compact">
                      <p>No messages sent yet. Trigger direct outreach above!</p>
                    </div>
                  )}
                </div>
              </article>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}


function Metric({
  icon: Icon,
  label,
  tone,
  value
}: {
  icon: typeof Users;
  label: string;
  tone: string;
  value: number | string;
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-icon">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatSnake(value?: string) {
  if (!value) {
    return "-";
  }

  return value.replaceAll("_", " ");
}

function formatLane(value?: string) {
  if (!value) {
    return "-";
  }

  if (value === "consented_inbound") {
    return "consented";
  }

  if (value === "public_business_research") {
    return "business research";
  }

  return "high-risk social";
}

function buildDiscoveryPayload(
  campaignId: string,
  sourceKey: ApifySourceKey,
  locationQuery: string,
  searchTerms: string,
  leadLimit: number
) {
  const safeLimit = Math.max(1, Math.min(250, Number.isFinite(leadLimit) ? leadLimit : 5));
  const terms = searchTerms
    .split("\n")
    .map((term) => term.trim())
    .filter(Boolean);

  if (sourceKey === "website_contacts") {
    const startUrls = terms.map((term) => {
      let url = term;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      return { url };
    });
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        startUrls: startUrls.length ? startUrls : [{ url: "https://example.com" }],
        maxCrawlDepth: 1,
        stayWithinDomain: true,
        maxCrawlPages: Math.min(safeLimit * 5, 100),
        enablePhoneExtraction: true,
        enableSocialMediaExtraction: true
      }
    };
  }

  if (sourceKey === "instagram_profile") {
    const queries = terms.map(
      (term) => `site:instagram.com "${term}" "${locationQuery}" "@gmail.com" OR "@yahoo.com" OR "@hotmail.com" OR "email"`
    );
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        queries: queries.length ? queries.join("\n") : `site:instagram.com "Islamic clothing store" "${locationQuery}" "@gmail.com"`,
        maxPagesPerQuery: Math.max(1, Math.ceil(safeLimit / 10)),
        maxConcurrency: 5
      }
    };
  }

  if (sourceKey === "tiktok_profile") {
    const combinedQuery = terms.length 
      ? `${terms[0]} in ${locationQuery}` 
      : `Islamic clothing store in ${locationQuery}`;
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        mode: "search",
        searchQuery: combinedQuery,
        searchType: "keyword",
        maxItems: safeLimit
      }
    };
  }

  if (sourceKey === "facebook_pages") {
    const urls = terms.map((term) => {
      if (term.startsWith("http")) {
        return { url: term };
      }
      const combined = locationQuery ? `${term} in ${locationQuery}` : term;
      return { url: `https://www.facebook.com/search/pages/?q=${encodeURIComponent(combined)}` };
    });
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        startUrls: urls.length ? urls : [{ url: `https://www.facebook.com/search/pages/?q=${encodeURIComponent("Islamic clothing store in " + locationQuery)}` }],
        maxResults: safeLimit
      }
    };
  }

  if (sourceKey === "google_maps") {
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        searchStringsArray: terms.length ? terms : ["Islamic clothing store", "modest fashion boutique", "abaya store"],
        locationQuery,
        maxCrawledPlacesPerSearch: safeLimit,
        skipClosedPlaces: true,
        scrapeReviewsPersonalData: false
      }
    };
  }

  if (sourceKey === "google_search") {
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        queries: terms.length ? terms.join("\n") : "Islamic clothing store UK\nmodest fashion boutique USA",
        maxPagesPerQuery: 1
      }
    };
  }

  if (sourceKey === "instagram") {
    return {
      campaignId,
      sourceKey,
      maxItems: safeLimit,
      actorInput: {
        directUrls: terms.length
          ? terms.map((term) =>
              term.startsWith("http")
                ? term
                : `https://www.instagram.com/explore/tags/${term.replace(/^#/, "").replaceAll(" ", "")}/`
            )
          : ["https://www.instagram.com/explore/tags/modestfashion/"],
        resultsLimit: safeLimit
      }
    };
  }

  return {
    campaignId,
    sourceKey,
    maxItems: safeLimit,
    actorInput: {
      searchQuery: terms[0] ?? "modest fashion long coat",
      maxItems: safeLimit
    }
  };
}
