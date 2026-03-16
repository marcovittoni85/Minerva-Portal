-- ============================================================
-- MINERVA PARTNERS — Dashboard Builder
-- Configurazione dashboard personalizzabile per ruolo
-- ============================================================

CREATE TABLE dashboard_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- A chi si applica
  role            TEXT NOT NULL,                   -- 'admin', 'partner', 'friend', 'advisor', 'default'
  name            TEXT NOT NULL DEFAULT 'Dashboard',
  
  -- Layout (JSON con posizioni e configurazione widget)
  layout          JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Chi l'ha modificata
  updated_by      UUID REFERENCES profiles(id),
  
  -- Attiva
  is_active       BOOLEAN DEFAULT true,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(role)
);

-- RLS
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_configs" ON dashboard_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "everyone_read_own_role" ON dashboard_configs
  FOR SELECT USING (
    role = (SELECT role FROM profiles WHERE id = auth.uid())
    OR role = 'default'
  );

-- Trigger
CREATE TRIGGER set_dashboard_configs_updated_at
  BEFORE UPDATE ON dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserisci configurazioni default per ogni ruolo
INSERT INTO dashboard_configs (role, name, layout) VALUES
('admin', 'Dashboard Admin', '[
  {"id":"w1","widget":"kpi_strip","x":0,"y":0,"w":12,"h":1,"config":{"title":"KPI","items":["deals_active","requests_pending","members_total","workgroup_count","fees_collected","events_upcoming"]}},
  {"id":"w2","widget":"hot_deals","x":0,"y":1,"w":7,"h":3,"config":{"title":"Deal in Corso","limit":5}},
  {"id":"w3","widget":"pending_tasks","x":7,"y":1,"w":5,"h":3,"config":{"title":"Task Urgenti","limit":5}},
  {"id":"w4","widget":"recent_interactions","x":0,"y":4,"w":6,"h":3,"config":{"title":"Ultime Interazioni","limit":5}},
  {"id":"w5","widget":"deadlines","x":6,"y":4,"w":6,"h":3,"config":{"title":"Scadenze Imminenti","limit":5}},
  {"id":"w6","widget":"fee_overview","x":0,"y":7,"w":12,"h":2,"config":{"title":"Revenue Overview"}}
]'::jsonb),
('partner', 'Dashboard Partner', '[
  {"id":"w1","widget":"kpi_strip","x":0,"y":0,"w":12,"h":1,"config":{"title":"Overview","items":["deals_available","deals_involved","fees_earned","events_upcoming"]}},
  {"id":"w2","widget":"deal_board_preview","x":0,"y":1,"w":12,"h":4,"config":{"title":"Opportunità Recenti","limit":6}},
  {"id":"w3","widget":"my_tasks","x":0,"y":5,"w":6,"h":3,"config":{"title":"I Miei Task","limit":5}},
  {"id":"w4","widget":"upcoming_events","x":6,"y":5,"w":6,"h":3,"config":{"title":"Prossimi Eventi","limit":5}}
]'::jsonb),
('advisor', 'Dashboard Advisor', '[
  {"id":"w1","widget":"kpi_strip","x":0,"y":0,"w":12,"h":1,"config":{"title":"Overview","items":["deals_involved","pending_followups","fees_earned","contacts_key"]}},
  {"id":"w2","widget":"my_deals","x":0,"y":1,"w":7,"h":3,"config":{"title":"I Miei Deal","limit":5}},
  {"id":"w3","widget":"pending_followups","x":7,"y":1,"w":5,"h":3,"config":{"title":"Follow-up Pendenti","limit":5}},
  {"id":"w4","widget":"upcoming_events","x":0,"y":4,"w":12,"h":3,"config":{"title":"Prossimi Appuntamenti","limit":5}}
]'::jsonb),
('friend', 'Dashboard Friend', '[
  {"id":"w1","widget":"kpi_strip","x":0,"y":0,"w":12,"h":1,"config":{"title":"Overview","items":["deals_available","events_upcoming"]}},
  {"id":"w2","widget":"deal_board_preview","x":0,"y":1,"w":12,"h":4,"config":{"title":"Bacheca Operazioni","limit":6}},
  {"id":"w3","widget":"upcoming_events","x":0,"y":5,"w":12,"h":3,"config":{"title":"Prossimi Eventi","limit":5}}
]'::jsonb),
('default', 'Dashboard Default', '[
  {"id":"w1","widget":"kpi_strip","x":0,"y":0,"w":12,"h":1,"config":{"title":"Overview","items":["deals_available","events_upcoming"]}},
  {"id":"w2","widget":"deal_board_preview","x":0,"y":1,"w":12,"h":4,"config":{"title":"Opportunità","limit":6}}
]'::jsonb);
