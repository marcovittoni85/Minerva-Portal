-- P37 — Comms templates table + 8 seeded templates
CREATE TABLE IF NOT EXISTS public.comms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','whatsapp','pec','in_app')),
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, version)
);

CREATE INDEX IF NOT EXISTS idx_comms_templates_active_slug
  ON public.comms_templates(slug, version DESC) WHERE is_active;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comms_templates_updated_at ON public.comms_templates;
CREATE TRIGGER trg_comms_templates_updated_at
  BEFORE UPDATE ON public.comms_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.comms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_read_comms_templates" ON public.comms_templates
  FOR SELECT TO authenticated USING (is_active);
CREATE POLICY "admin_all_comms_templates" ON public.comms_templates
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Seed 8 template iniziali ───
INSERT INTO public.comms_templates (slug, subject, body, channel) VALUES
('first_contact_friend', 'Benvenuto in Minerva, {{nome}}',
 'Caro {{nome}},\n\nbenvenuto nell''ecosistema Minerva. Ti invitiamo come Friend perche crediamo nella forza delle relazioni di fiducia.\n\nPer iniziare, ti chiediamo di prendere visione dei 3 Codici (Etico, Operativo, Retributivo) e di firmare il Patto di Ingresso entro 30 giorni dalla data odierna ({{data}}).\n\nAccedi al portale: https://portal.minervapartners.it/onboarding\n\nA presto,\nIl Team Minerva',
 'email'),
('first_contact_partner', 'Invito Partner Minerva — {{azienda}}',
 'Gentile {{nome}} {{cognome}},\n\nle scriviamo per invitarla a entrare in Minerva Partners come Partner istituzionale.\n\nIn allegato troverà il Patto di Ingresso e i Codici di riferimento. La invitiamo a completare l''onboarding entro 30 giorni ({{data}}).\n\nPer qualsiasi chiarimento, restiamo a disposizione.\n\nCordialmente,\nIl Team Minerva',
 'email'),
('followup_no_signing_7d', 'Promemoria — Patto Minerva',
 'Caro {{nome}},\n\nti ricordiamo che hai 7 giorni per completare la firma del Patto di Ingresso. Dopo {{data}} l''invito scadrà e dovremo riavviare la procedura.\n\nCompleta qui: https://portal.minervapartners.it/onboarding\n\nA disposizione,\nIl Team Minerva',
 'email'),
('welcome_post_signing', 'Benvenuto ufficiale in Minerva',
 'Caro {{nome}},\n\nla tua firma del Patto è stata registrata. Da oggi sei a tutti gli effetti parte dell''ecosistema Minerva.\n\nProssimi passi:\n- Esplora la bacheca deal\n- Completa il tuo profilo\n- Importa i tuoi primi contatti nel CRM\n\nBenvenuto.\nIl Team Minerva',
 'email'),
('deal_assignment', 'Nuovo deal: {{codice_deal}}',
 'Caro {{nome}},\n\nti è stato assegnato il deal {{codice_deal}}.\n\n{{razionale}}\n\nAccedi alla scheda: https://portal.minervapartners.it/deals/{{codice_deal}}\n\nIl Team Minerva',
 'email'),
('fee_liquidation', 'Liquidazione fee — {{codice_deal}}',
 'Caro {{nome}},\n\nsiamo lieti di comunicarti la liquidazione della fee per il deal {{codice_deal}}.\n\nImporto: {{importo}}\nData prevista accredito: {{data}}\n\nVerifica IBAN nel tuo profilo entro 48h. In caso di modifiche, aggiornalo qui: https://portal.minervapartners.it/profile\n\nIl Team Minerva',
 'email'),
('l2_request_received', 'Richiesta L2 ricevuta',
 'La tua richiesta L2 per il deal {{codice_deal}} è stata ricevuta. Riceverai notifica entro 5 giorni lavorativi.',
 'in_app'),
('l2_admin_verified', 'L2 verificata: {{codice_deal}}',
 'Caro {{nome}},\n\nla tua richiesta L2 per il deal {{codice_deal}} è stata verificata e approvata.\n\nProssimo step: firma dell''NDA preliminare. Trovi il documento qui: https://portal.minervapartners.it/deals/{{codice_deal}}/nda\n\nScadenza firma: {{data}}\n\nIl Team Minerva',
 'email')
ON CONFLICT (slug, version) DO NOTHING;
