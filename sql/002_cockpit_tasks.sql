-- ============================================================
-- MINERVA PARTNERS — Cockpit Tasks Schema
-- Task management per admin: to-do, scadenze, follow-up
-- ============================================================

-- Priorità task
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low');

-- Categoria task
CREATE TYPE task_category AS ENUM (
  'follow_up',      -- Follow-up contatto/deal
  'deadline',        -- Scadenza
  'meeting_prep',    -- Preparazione meeting
  'document',        -- Documento da preparare/inviare
  'call',            -- Chiamata da fare
  'internal',        -- Task interno
  'other'
);

-- ── TASKS ─────────────────────────────────────────────────────
CREATE TABLE tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  created_by          UUID NOT NULL REFERENCES profiles(id),
  assigned_to         UUID REFERENCES profiles(id),

  -- Content
  title               TEXT NOT NULL,
  description         TEXT,
  priority            task_priority DEFAULT 'normal',
  category            task_category DEFAULT 'other',

  -- Status
  is_completed        BOOLEAN DEFAULT false,
  completed_at        TIMESTAMPTZ,

  -- Due date
  due_date            DATE,

  -- Links
  deal_id             UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Tags
  tags                TEXT[] DEFAULT '{}',

  -- Metadata
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDICI ─────────────────────────────────────────────────────
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE is_completed = false;
CREATE INDEX idx_tasks_priority ON tasks(priority) WHERE is_completed = false;
CREATE INDEX idx_tasks_deal ON tasks(deal_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
CREATE INDEX idx_tasks_completed ON tasks(is_completed);

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_tasks" ON tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "user_own_tasks" ON tasks
  FOR ALL USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- ── TRIGGER ────────────────────────────────────────────────────
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── VIEW: Task di oggi ─────────────────────────────────────────
CREATE OR REPLACE VIEW tasks_today AS
SELECT t.*,
  d.title AS deal_title,
  c.full_name AS contact_name
FROM tasks t
LEFT JOIN deals d ON t.deal_id = d.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.is_completed = false
  AND t.due_date <= CURRENT_DATE
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  t.due_date ASC;

-- ── VIEW: Task prossimi 7 giorni ──────────────────────────────
CREATE OR REPLACE VIEW tasks_upcoming AS
SELECT t.*,
  d.title AS deal_title,
  c.full_name AS contact_name
FROM tasks t
LEFT JOIN deals d ON t.deal_id = d.id
LEFT JOIN contacts c ON t.contact_id = c.id
WHERE t.is_completed = false
  AND t.due_date > CURRENT_DATE
  AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY t.due_date ASC,
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END;
