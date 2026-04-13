-- ============================================================
-- Migration: User Onboarding + Deal Document Management
-- ============================================================

-- 1. Onboarding columns on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_deadline DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_signed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_ip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_user_agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_password_hash TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company TEXT;

-- 2. Deal documents table
CREATE TABLE IF NOT EXISTS deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY dd_select ON deal_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR uploaded_by = auth.uid()
  );

CREATE POLICY dd_insert ON deal_documents FOR INSERT
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY dd_update ON deal_documents FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Add checklist_manually_edited to track which fields admin edited
ALTER TABLE deals ADD COLUMN IF NOT EXISTS checklist_manually_edited JSONB DEFAULT '[]'::jsonb;
-- 4. Add blind_title field
ALTER TABLE deals ADD COLUMN IF NOT EXISTS blind_title TEXT;
