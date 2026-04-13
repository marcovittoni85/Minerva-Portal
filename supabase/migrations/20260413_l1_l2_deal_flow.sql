-- ============================================================
-- L1/L2 Deal Flow Authorization System
-- Migration: 20260413_l1_l2_deal_flow.sql
-- ============================================================

-- ─── 1. New columns on deals ────────────────────────────────

-- Asset class & checklist (Mod 2)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS asset_class TEXT; -- m_and_a, real_estate, club_deal, strategy, wealth_management
ALTER TABLE deals ADD COLUMN IF NOT EXISTS checklist_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS checklist_completeness INTEGER DEFAULT 0;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS blind_description TEXT;

-- Rejection levels (Mod 3)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_type TEXT; -- rejected_not_conforming, parked, pending_integration
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_note_internal TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS rejection_note_external TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS parked_until DATE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS integration_deadline DATE;

-- Board status & negotiation (Mod 6)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS board_status TEXT DEFAULT 'active'; -- active, in_negotiation, assigned, archived
ALTER TABLE deals ADD COLUMN IF NOT EXISTS negotiation_started_at TIMESTAMPTZ;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS negotiation_expires_at TIMESTAMPTZ;

-- ─── 2. New columns on deal_access_requests (Mod 1) ────────

ALTER TABLE deal_access_requests ADD COLUMN IF NOT EXISTS decline_reason TEXT;
ALTER TABLE deal_access_requests ADD COLUMN IF NOT EXISTS decline_reason_forwarded BOOLEAN DEFAULT false;
ALTER TABLE deal_access_requests ADD COLUMN IF NOT EXISTS decline_reason_forwarded_text TEXT;

-- ─── 3. deal_interest_requests table (Mod 4 — core L1/L2) ──

CREATE TABLE IF NOT EXISTS deal_interest_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  anonymous_code TEXT NOT NULL,

  -- Pre-L1: interest request
  interest_message TEXT NOT NULL,

  -- L1: originator decision
  l1_status TEXT DEFAULT 'pending' CHECK (l1_status IN ('pending', 'approved', 'declined')),
  l1_decided_at TIMESTAMPTZ,
  l1_decided_by UUID REFERENCES profiles(id),
  l1_decline_reason TEXT,
  l1_decline_forwarded BOOLEAN DEFAULT false,
  l1_decline_forwarded_text TEXT,

  -- L2: requester submission + originator decision
  l2_status TEXT DEFAULT 'not_requested' CHECK (l2_status IN ('not_requested', 'pending_docs', 'pending_admin', 'pending_originator', 'approved', 'declined')),
  l2_requested_at TIMESTAMPTZ,
  l2_client_name TEXT,
  l2_client_surname TEXT,
  l2_client_company TEXT,
  l2_client_email TEXT,
  l2_fee_from_client TEXT,
  l2_fee_from_minerva TEXT,
  l2_mandate_type TEXT CHECK (l2_mandate_type IN ('exclusive', 'generic', 'none')),
  l2_mandate_file_url TEXT,
  l2_nda_file_url TEXT,
  l2_decided_at TIMESTAMPTZ,
  l2_decided_by UUID REFERENCES profiles(id),
  l2_decline_reason TEXT,
  l2_decline_forwarded BOOLEAN DEFAULT false,
  l2_decline_forwarded_text TEXT,
  l2_admin_verified BOOLEAN DEFAULT false,
  l2_admin_verified_at TIMESTAMPTZ,
  l2_admin_notes TEXT,

  -- Timeout L1→L2
  l1_expires_at TIMESTAMPTZ,
  l1_reminder_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dir_deal ON deal_interest_requests(deal_id);
CREATE INDEX IF NOT EXISTS idx_dir_requester ON deal_interest_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_dir_l1_status ON deal_interest_requests(l1_status);
CREATE INDEX IF NOT EXISTS idx_dir_l2_status ON deal_interest_requests(l2_status);

-- ─── 4. deal_fee_agreements table (Mod 8) ───────────────────

CREATE TABLE IF NOT EXISTS deal_fee_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  parties JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{role, name, percentage, amount, type, trigger}]
  service_type TEXT,
  minerva_fee_pct NUMERIC,
  minerva_fee_amount NUMERIC,
  fondo_strategico_pct NUMERIC,
  fondo_strategico_amount NUMERIC,
  net_pool NUMERIC,
  fee_lorda NUMERIC,
  notes TEXT,
  ic_required BOOLEAN DEFAULT false,
  ic_approved BOOLEAN,
  ic_approved_at TIMESTAMPTZ,
  signed_file_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. deal_clients table (Mod 9) ──────────────────────────

CREATE TABLE IF NOT EXISTS deal_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  originator_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. Anonymous code sequence + helper function ───────────

CREATE SEQUENCE IF NOT EXISTS interest_request_seq START WITH 1;

-- RPC to get next sequence value from client
CREATE OR REPLACE FUNCTION nextval(seq_name TEXT)
RETURNS BIGINT AS $$
BEGIN
  RETURN nextval(seq_name::regclass);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 7. Updated_at trigger for deal_interest_requests ───────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dir_updated_at ON deal_interest_requests;
CREATE TRIGGER trg_dir_updated_at
  BEFORE UPDATE ON deal_interest_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 8. RLS Policies ────────────────────────────────────────

ALTER TABLE deal_interest_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_fee_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_clients ENABLE ROW LEVEL SECURITY;

-- deal_interest_requests: users can see their own requests; originators can see requests on their deals; admins see all
CREATE POLICY dir_select_own ON deal_interest_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY dir_select_originator ON deal_interest_requests FOR SELECT
  USING (deal_id IN (SELECT id FROM deals WHERE originator_id = auth.uid()));

CREATE POLICY dir_select_admin ON deal_interest_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY dir_insert_own ON deal_interest_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY dir_update_originator ON deal_interest_requests FOR UPDATE
  USING (deal_id IN (SELECT id FROM deals WHERE originator_id = auth.uid()));

CREATE POLICY dir_update_admin ON deal_interest_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- deal_fee_agreements: admin only
CREATE POLICY dfa_select_admin ON deal_fee_agreements FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY dfa_insert_admin ON deal_fee_agreements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY dfa_update_admin ON deal_fee_agreements FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- deal_clients: visible to admin, inviter, and the client themselves
CREATE POLICY dc_select ON deal_clients FOR SELECT
  USING (
    client_profile_id = auth.uid()
    OR invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY dc_insert ON deal_clients FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
