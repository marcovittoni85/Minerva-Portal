-- MINERVA PORTAL — Aggiungi colonne mancanti a public.profiles
-- Eseguire UNA VOLTA in Supabase SQL Editor PRIMA dell'import script.
-- 
-- Queste colonne servono per:
--   - ruolo_enumerato: codice operativo (admin_01, partner1...partner9, advisor_01..., friend_01...)
--   - partner_line:    verticale Partner (Legal, Banking, ...)

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS ruolo_enumerato TEXT,
  ADD COLUMN IF NOT EXISTS partner_line TEXT;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_profiles_ruolo_enumerato ON public.profiles(ruolo_enumerato);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_line ON public.profiles(partner_line) WHERE partner_line IS NOT NULL;

-- Verifica colonne presenti
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
