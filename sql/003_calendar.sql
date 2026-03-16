-- ============================================================
-- MINERVA PARTNERS — Calendar Events
-- Meeting e eventi collegati a deal, contatti, task
-- Con supporto per sync Google Calendar
-- ============================================================

CREATE TABLE calendar_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner
  created_by        UUID NOT NULL REFERENCES profiles(id),

  -- Contenuto
  title             TEXT NOT NULL,
  description       TEXT,
  location          TEXT,                          -- luogo fisico o link videocall
  event_type        TEXT DEFAULT 'meeting',        -- meeting, call, video_call, event, deadline, reminder

  -- Timing
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ,
  all_day           BOOLEAN DEFAULT false,

  -- Colore (per visualizzazione)
  color             TEXT,                          -- hex o nome: "navy", "gold", "blue", "green"

  -- Collegamenti
  deal_id           UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  task_id           UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Partecipanti (array di contact_id)
  participant_ids   UUID[] DEFAULT '{}',

  -- Sync esterna
  google_event_id   TEXT,                          -- ID evento Google Calendar
  outlook_event_id  TEXT,                          -- ID evento Outlook
  external_link     TEXT,                          -- link Meet/Zoom/Teams

  -- Reminder
  reminder_minutes  INTEGER DEFAULT 30,            -- minuti prima

  -- Ricorrenza (semplificata)
  is_recurring      BOOLEAN DEFAULT false,
  recurrence_rule   TEXT,                          -- "weekly", "monthly", "daily"
  recurrence_end    DATE,
  parent_event_id   UUID REFERENCES calendar_events(id) ON DELETE CASCADE,

  -- Status
  is_cancelled      BOOLEAN DEFAULT false,

  -- Note post-evento
  outcome           TEXT,                          -- note dopo il meeting

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_cal_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_cal_events_start ON calendar_events(start_at);
CREATE INDEX idx_cal_events_deal ON calendar_events(deal_id);
CREATE INDEX idx_cal_events_contact ON calendar_events(contact_id);
CREATE INDEX idx_cal_events_google ON calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX idx_cal_events_range ON calendar_events(start_at, end_at);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_calendar" ON calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "own_events" ON calendar_events
  FOR ALL USING (created_by = auth.uid());

-- Trigger
CREATE TRIGGER set_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: crea interazione automatica quando un evento viene completato (outcome compilato)
CREATE OR REPLACE FUNCTION create_interaction_from_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.outcome IS NOT NULL AND OLD.outcome IS NULL AND NEW.contact_id IS NOT NULL THEN
    INSERT INTO interactions (
      contact_id, created_by, interaction_type, title, description, outcome,
      interaction_date, duration_minutes, deal_id
    ) VALUES (
      NEW.contact_id,
      NEW.created_by,
      CASE NEW.event_type
        WHEN 'call' THEN 'call'::interaction_type
        WHEN 'video_call' THEN 'video_call'::interaction_type
        WHEN 'event' THEN 'event'::interaction_type
        ELSE 'meeting'::interaction_type
      END,
      NEW.title,
      NEW.description,
      NEW.outcome,
      NEW.start_at,
      EXTRACT(EPOCH FROM (COALESCE(NEW.end_at, NEW.start_at + INTERVAL '1 hour') - NEW.start_at)) / 60,
      NEW.deal_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_interaction_on_outcome
  AFTER UPDATE OF outcome ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION create_interaction_from_event();

-- View: eventi della settimana corrente
CREATE OR REPLACE VIEW calendar_this_week AS
SELECT
  e.*,
  d.title AS deal_title,
  c.full_name AS contact_name,
  c.company AS contact_company
FROM calendar_events e
LEFT JOIN deals d ON d.id = e.deal_id
LEFT JOIN contacts c ON c.id = e.contact_id
WHERE e.is_cancelled = false
  AND e.start_at >= date_trunc('week', CURRENT_DATE)
  AND e.start_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
ORDER BY e.start_at ASC;
