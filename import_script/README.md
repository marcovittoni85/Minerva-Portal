# MINERVA — Onboarding Import Script

## STEP 1 · Aggiungi colonne mancanti al DB (una volta sola)

Vai su Supabase SQL Editor e incolla:

```sql
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS ruolo_enumerato TEXT,
  ADD COLUMN IF NOT EXISTS partner_line TEXT;
```

## STEP 2 · Setup script

```bash
cp .env.example .env
# Modifica .env con SUPABASE_SERVICE_ROLE_KEY (NON anon key!)
# Recupera da: Supabase Dashboard → Settings → API → service_role secret

npm install
```

## STEP 3 · Esegui import

Metti `onboard_final.csv` nella stessa cartella, poi:

```bash
npm run import
```

Lo script:
- Crea auth.users con password (idempotente: se email esiste già, non duplica)
- Aggiorna public.profiles con: full_name, phone, role, ruolo_enumerato, partner_line
- Mostra conteggio successi/errori

## TROUBLESHOOTING

**"violates foreign key constraint profiles_id_fkey"**
→ Il trigger automatico on_auth_user_created esiste già? Se sì il profile è auto-creato dopo auth.admin.createUser, l'upsert con onConflict='id' aggiorna i campi.

**"duplicate key value violates unique constraint profiles_email_key"**
→ Email esiste già nei profiles ma con id diverso. Esegui prima:
```sql
TRUNCATE auth.users CASCADE; -- ⚠️ ATTENZIONE: cancella tutti gli utenti
```

## I 3 TEST USER

- marvittoni@gmail.com / test1 → admin
- marcovittoni.85@gmail.com / test1 → partner
- vittonimarc@gmail.com / test1 → friend
