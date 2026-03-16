-- ============================================================
-- MINERVA PARTNERS — Knowledge Base
-- Investment memo, analisi settore, template, documenti strategici
-- ============================================================

-- Categoria documento
CREATE TYPE kb_category AS ENUM (
  'investment_memo',    -- Investment memo / teaser
  'sector_analysis',    -- Analisi di settore
  'market_report',      -- Report di mercato
  'legal_template',     -- Template legale (NDA, mandato, etc.)
  'financial_model',    -- Modello finanziario
  'presentation',       -- Presentazione / pitch
  'internal_strategy',  -- Strategia interna
  'due_diligence',      -- Checklist / template DD
  'valuation',          -- Valutazione / comparables
  'regulatory',         -- Normativa / regolamentazione
  'other'
);

-- Visibilità
CREATE TYPE kb_visibility AS ENUM (
  'private',            -- Solo chi l'ha creato
  'admin',              -- Solo admin
  'members',            -- Tutti i membri
  'public'              -- Visibile anche senza login (raro)
);

-- ── KNOWLEDGE BASE ITEMS ────────────────────────────────────
CREATE TABLE kb_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      UUID NOT NULL REFERENCES profiles(id),
  
  -- Contenuto
  title           TEXT NOT NULL,
  description     TEXT,                            -- Riassunto / abstract
  content         TEXT,                            -- Contenuto markdown (per note/memo)
  
  -- Classificazione
  category        kb_category NOT NULL,
  visibility      kb_visibility DEFAULT 'admin',
  tags            TEXT[] DEFAULT '{}',
  
  -- File allegato (su Supabase Storage)
  file_url        TEXT,                            -- URL file principale
  file_name       TEXT,                            -- Nome file originale
  file_type       TEXT,                            -- MIME type
  file_size       INTEGER,                         -- Dimensione in bytes
  
  -- Collegamenti
  deal_id         UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Settore / geografia (per filtri)
  sector          TEXT,                            -- Real Estate, M&A, Energy, etc.
  geography       TEXT,                            -- Italia, Europa, Global
  
  -- Versioning
  version         INTEGER DEFAULT 1,
  parent_id       UUID REFERENCES kb_items(id),    -- Versione precedente
  
  -- Metriche
  view_count      INTEGER DEFAULT 0,
  download_count  INTEGER DEFAULT 0,
  is_pinned       BOOLEAN DEFAULT false,           -- Fissato in alto
  is_archived     BOOLEAN DEFAULT false,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX idx_kb_category ON kb_items(category);
CREATE INDEX idx_kb_visibility ON kb_items(visibility);
CREATE INDEX idx_kb_tags ON kb_items USING GIN(tags);
CREATE INDEX idx_kb_sector ON kb_items(sector);
CREATE INDEX idx_kb_deal ON kb_items(deal_id);
CREATE INDEX idx_kb_created_by ON kb_items(created_by);
CREATE INDEX idx_kb_pinned ON kb_items(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_kb_search ON kb_items USING GIN(to_tsvector('italian', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(content, '')));

-- RLS
ALTER TABLE kb_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_kb" ON kb_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "member_view_kb" ON kb_items
  FOR SELECT USING (
    visibility = 'members'
    OR visibility = 'public'
    OR created_by = auth.uid()
  );

CREATE POLICY "own_kb_manage" ON kb_items
  FOR ALL USING (created_by = auth.uid());

-- Trigger
CREATE TRIGGER set_kb_items_updated_at
  BEFORE UPDATE ON kb_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
