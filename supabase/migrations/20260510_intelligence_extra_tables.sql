-- P4 — Extra intelligence schema tables (sister of 20260510_intelligence_outputs.sql)
-- Tables: contact_relationships (P36 NetworkGraph), a2_patterns (P25 PatternDetection), documents (P3 Onboarding, P38 AutoBlind)

-- ─────────────────────────────────────────────────────────────────────
-- contact_relationships
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_a UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  contact_b UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'introduced_by', 'colleague', 'family', 'board_member',
    'business_partner', 'advisor_client', 'co_investor'
  )),
  strength INT CHECK (strength BETWEEN 1 AND 5),
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contact_a, contact_b, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_contact_rel_a ON public.contact_relationships(contact_a);
CREATE INDEX IF NOT EXISTS idx_contact_rel_b ON public.contact_relationships(contact_b);

ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_contact_rel" ON public.contact_relationships
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "admin_all_contact_rel" ON public.contact_relationships
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─────────────────────────────────────────────────────────────────────
-- a2_patterns (42 pattern: 27 SS + 15 FAM)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.a2_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  detection_rules JSONB,
  signals JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2_patterns_active ON public.a2_patterns(category, is_active) WHERE is_active;

ALTER TABLE public.a2_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_a2_patterns" ON public.a2_patterns
  FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "admin_all_a2_patterns" ON public.a2_patterns
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

INSERT INTO public.a2_patterns (code, name, category, description) VALUES
  ('SS01', 'Successione Imminente', 'Successione Strutturale', 'Imprenditore over 65 senza piano successorio chiaro'),
  ('SS02', 'Generazione Cuscinetto', 'Successione Strutturale', 'Seconda generazione gestisce ma terza non interessata'),
  ('SS03', 'Vedova/Erede Non-operativa', 'Successione Strutturale', 'Famiglia eredita ma non gestisce'),
  ('SS04', 'Patriarca Anziano', 'Successione Strutturale', 'Fondatore over 75 ancora operativo'),
  ('SS05', 'Mancato Patto Famiglia', 'Successione Strutturale', 'Nessun accordo familiare formalizzato'),
  ('SS06', 'Conflitto Eredi', 'Successione Strutturale', 'Tensioni esplicite tra eredi'),
  ('SS07', 'Sconnessione Generazionale', 'Successione Strutturale', 'Gap valori tra generazioni'),
  ('SS08', 'Manager Esterno Necessario', 'Successione Strutturale', 'Famiglia non ha piu competenze gestionali'),
  ('SS09', 'Holding Familiare Inefficiente', 'Successione Strutturale', 'Struttura societaria sub-ottimale'),
  ('SS10', 'Trust Mancante', 'Successione Strutturale', 'Nessun veicolo protezione patrimoniale'),
  ('SS11', 'Cash-out Differito', 'Successione Strutturale', 'Imprenditore vuole liquidare gradualmente'),
  ('SS12', 'Earnout Necessario', 'Successione Strutturale', 'Valutazione rischiosa, serve performance gate'),
  ('SS13', 'Multi-Family Office Adatto', 'Successione Strutturale', 'Patrimonio richiede gestione professionale'),
  ('SS14', 'Asset Misti', 'Successione Strutturale', 'Mix immobiliare + operativo + finanziario'),
  ('SS15', 'PIR/PMI Compliance', 'Successione Strutturale', 'Possibili agevolazioni fiscali'),
  ('SS16', 'Crisi di Liquidita', 'Successione Strutturale', 'PFN tesa, serve rifinanziamento'),
  ('SS17', 'Concentrazione Cliente', 'Successione Strutturale', 'Top 3 clienti > 50% fatturato'),
  ('SS18', 'Concentrazione Fornitore', 'Successione Strutturale', 'Top 3 fornitori > 50% costi'),
  ('SS19', 'Tecnologia Obsoleta', 'Successione Strutturale', 'CapEx digitalizzazione necessario'),
  ('SS20', 'Espansione Estero Bloccata', 'Successione Strutturale', 'Mercato saturo Italia, no internazionalizzazione'),
  ('SS21', 'M&A Bolt-on Necessario', 'Successione Strutturale', 'Crescita organica esaurita'),
  ('SS22', 'Consolidamento Settore', 'Successione Strutturale', 'Settore in fase consolidamento'),
  ('SS23', 'Disruption Imminente', 'Successione Strutturale', 'Tecnologie/regulation cambiano modello'),
  ('SS24', 'Margini Compressi', 'Successione Strutturale', 'EBITDA margin in calo strutturale'),
  ('SS25', 'Capitale Circolante Stressato', 'Successione Strutturale', 'WC > 20% fatturato'),
  ('SS26', 'Indebitamento Eccessivo', 'Successione Strutturale', 'Debt/EBITDA > 4x'),
  ('SS27', 'Riclassificazione Necessaria', 'Successione Strutturale', 'Bilanci non rappresentativi'),
  ('FAM01', 'Patto di Famiglia Mancante', 'Family/Governance', 'Nessun accordo formale patrimonio'),
  ('FAM02', 'Governance Squilibrata', 'Family/Governance', 'CdA non rappresentativo equity'),
  ('FAM03', 'CDA Familiare', 'Family/Governance', 'CdA composto solo da parenti'),
  ('FAM04', 'Mancanza Indipendenti', 'Family/Governance', 'Zero amministratori indipendenti'),
  ('FAM05', 'Compensi Non-arm-length', 'Family/Governance', 'Compensi familiari fuori mercato'),
  ('FAM06', 'Asset Mescolati', 'Family/Governance', 'Beni personali in societa'),
  ('FAM07', 'Conflitto Interesse', 'Family/Governance', 'Operazioni con parti correlate'),
  ('FAM08', 'Politica Dividendi Assente', 'Family/Governance', 'No regole formali distribuzione'),
  ('FAM09', 'Tax Planning Sub-ottimale', 'Family/Governance', 'Ottimizzazione fiscale non sfruttata'),
  ('FAM10', 'Trust Opaco', 'Family/Governance', 'Trust con vulnerabilita AE'),
  ('FAM11', 'Holding Estera Critica', 'Family/Governance', 'Holding in giurisdizione a rischio'),
  ('FAM12', 'Successione Pianificata Solo Parzialmente', 'Family/Governance', 'Piano esistente ma incompleto'),
  ('FAM13', 'Eredi Non-formati', 'Family/Governance', 'Prossima generazione senza preparazione'),
  ('FAM14', 'Filantropia Non-strutturata', 'Family/Governance', 'Donazioni senza veicolo dedicato'),
  ('FAM15', 'Brand Familiare a Rischio', 'Family/Governance', 'Reputazione famiglia legata azienda')
ON CONFLICT (code) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- documents (per Codici dinamici P3 + Auto-Blind P38)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  nome TEXT NOT NULL,
  versione TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_current ON public.documents(tipo, is_current) WHERE is_current;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_documents" ON public.documents
  FOR SELECT TO authenticated USING (is_current);
CREATE POLICY "admin_all_documents" ON public.documents
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
