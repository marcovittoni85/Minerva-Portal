/**
 * MINERVA PORTAL — Bulk Import Onboarding 07/05/2026
 * 
 * SCOPO: importa 64 utenti (61 reali + 3 test) in un solo step:
 *   - crea auth.users con password
 *   - crea/aggiorna profiles con full_name, phone, role, ruolo_enumerato, partner_line
 *   - tutto idempotente: rieseguibile senza duplicati
 * 
 * SETUP:
 *   1. npm install @supabase/supabase-js dotenv csv-parse
 *   2. Crea .env con SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (service role, NON anon!)
 *   3. node --experimental-strip-types import-users.ts
 *      (oppure compila con tsc)
 * 
 * PREREQUISITO SQL (eseguire UNA VOLTA in Supabase SQL Editor):
 *   ALTER TABLE public.profiles 
 *     ADD COLUMN IF NOT EXISTS ruolo_enumerato TEXT,
 *     ADD COLUMN IF NOT EXISTS partner_line TEXT;
 */

import { createClient } from '@supabase/supabase-js'
import { parse } from 'csv-parse/sync'
import { readFileSync } from 'fs'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY richiesti in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface UserRow {
  email: string
  full_name: string
  phone: string
  role: string
  ruolo_enumerato: string
  password: string
  partner_line: string
}

async function importUsers(csvPath: string) {
  const csv = readFileSync(csvPath, 'utf-8')
  const rows: UserRow[] = parse(csv, { columns: true, skip_empty_lines: true, bom: true })
  
  console.log(`📂 Caricati ${rows.length} record dal CSV\n`)
  
  const results = { ok: 0, skip: 0, err: 0, errors: [] as Array<{email:string,error:string}> }
  
  for (const [i, row] of rows.entries()) {
    const idx = `[${i+1}/${rows.length}]`
    
    try {
      // 1. Crea auth.user (idempotente: se esiste, non duplica)
      const { data: existingUser } = await supabase.auth.admin.listUsers({ 
        page: 1, perPage: 1 
      })
      // listUsers non filtra per email, devo cercare in altro modo
      // Provo a creare; se 422 = già esiste
      
      let userId: string | null = null
      
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: row.email,
        password: row.password,
        email_confirm: true,
        user_metadata: { full_name: row.full_name }
      })
      
      if (createErr) {
        if (createErr.message.includes('already') || createErr.message.includes('registered')) {
          // User esiste già → fetch il suo id
          const { data: { users } } = await supabase.auth.admin.listUsers()
          const found = users.find(u => u.email === row.email)
          if (!found) throw new Error(`User exists but not findable: ${row.email}`)
          userId = found.id
          console.log(`${idx} ⊙ ${row.email} (già esistente)`)
          results.skip++
        } else {
          throw createErr
        }
      } else {
        userId = created.user.id
        console.log(`${idx} ✓ ${row.email} (auth creato)`)
      }
      
      if (!userId) throw new Error('userId null')
      
      // 2. Upsert profile (anche se trigger lo ha già creato, aggiorniamo i campi custom)
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: row.email,
          full_name: row.full_name,
          phone: row.phone || null,
          role: row.role,
          ruolo_enumerato: row.ruolo_enumerato,
          partner_line: row.partner_line || null,
        }, { onConflict: 'id' })
      
      if (profileErr) throw profileErr
      
      results.ok++
    } catch (err: any) {
      console.error(`${idx} ✗ ${row.email}: ${err.message}`)
      results.errors.push({ email: row.email, error: err.message })
      results.err++
    }
  }
  
  console.log('\n========================================')
  console.log(`✓ Successi:   ${results.ok}`)
  console.log(`⊙ Già esist.: ${results.skip}`)
  console.log(`✗ Errori:     ${results.err}`)
  console.log('========================================')
  
  if (results.errors.length > 0) {
    console.log('\n🔍 Dettaglio errori:')
    results.errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`))
  }
  
  // Verifica conteggi finali
  const { count: totalProfiles } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true })
  console.log(`\n📊 Totale profiles in DB: ${totalProfiles}`)
}

const csvPath = process.argv[2] || './onboard_final.csv'
importUsers(csvPath).catch(e => { console.error(e); process.exit(1) })
