-- Starter database schema for the AI Lead Agent MVP.
-- The running scaffold uses in-memory data; this schema is the target Postgres shape
-- for the next implementation phase.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_region TEXT NOT NULL DEFAULT 'US',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website_url TEXT,
  risk_profile TEXT NOT NULL DEFAULT 'medium',
  default_jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, email)
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('b2b', 'b2c', 'mixed')),
  lane TEXT NOT NULL CHECK (lane IN ('consented_inbound', 'high_risk_cold_social')),
  status TEXT NOT NULL DEFAULT 'draft',
  autonomy_level TEXT NOT NULL DEFAULT 'review_required',
  goal TEXT NOT NULL,
  offer TEXT NOT NULL,
  jurisdictions TEXT[] NOT NULL DEFAULT '{}',
  daily_action_limit INTEGER NOT NULL DEFAULT 50,
  enabled_channels TEXT[] NOT NULL DEFAULT '{}',
  risk_acceptance_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  channel TEXT NOT NULL,
  mode TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 25,
  requires_review BOOLEAN NOT NULL DEFAULT true,
  requires_risk_acceptance BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  display_name TEXT NOT NULL,
  lead_type TEXT NOT NULL CHECK (lead_type IN ('b2b_contact', 'b2c_profile')),
  company_name TEXT,
  segment TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_url TEXT NOT NULL,
  lane TEXT NOT NULL,
  consent_status TEXT NOT NULL,
  opt_out_status TEXT NOT NULL DEFAULT 'clear',
  fit_score INTEGER NOT NULL DEFAULT 0,
  intent_score INTEGER NOT NULL DEFAULT 0,
  risk_score INTEGER NOT NULL DEFAULT 0,
  sensitive_category_flags TEXT[] NOT NULL DEFAULT '{}',
  channel_identities JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'candidate',
  retention_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  lead_id UUID REFERENCES leads(id),
  channel TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  jurisdiction TEXT NOT NULL,
  privacy_notice_version TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE suppression_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID REFERENCES clients(id),
  scope TEXT NOT NULL DEFAULT 'client',
  channel TEXT NOT NULL,
  identifier_type TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, client_id, channel, identifier_type, identifier_hash)
);

CREATE TABLE risk_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID REFERENCES campaigns(id),
  risk_type TEXT NOT NULL,
  accepted_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  terms_snapshot TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE generated_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  channel TEXT NOT NULL,
  subject_line TEXT,
  body TEXT NOT NULL,
  claims JSONB NOT NULL DEFAULT '[]',
  compliance_status TEXT NOT NULL DEFAULT 'needs_review',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE social_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  platform TEXT NOT NULL,
  action_type TEXT NOT NULL,
  mode TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  risk_acceptance_id UUID REFERENCES risk_acceptances(id),
  scheduled_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'queued',
  failure_reason TEXT,
  account_health_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agent_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_id UUID REFERENCES campaigns(id),
  agent_type TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  model TEXT,
  cost_usd NUMERIC(12, 4) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tool_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  agent_run_id UUID REFERENCES agent_runs(id),
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued',
  cost_usd NUMERIC(12, 4) NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id),
  client_id UUID REFERENCES clients(id),
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_tenant ON campaigns (agency_id, client_id);
CREATE INDEX idx_leads_campaign ON leads (agency_id, client_id, campaign_id);
CREATE INDEX idx_consent_lead ON consent_events (agency_id, client_id, lead_id);
CREATE INDEX idx_social_actions_campaign ON social_actions (agency_id, client_id, campaign_id);
CREATE INDEX idx_agent_runs_campaign ON agent_runs (agency_id, client_id, campaign_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs (agency_id, client_id, created_at DESC);
