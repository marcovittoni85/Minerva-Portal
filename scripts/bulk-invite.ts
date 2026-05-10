/**
 * Bulk-create users + profiles in Supabase.
 * Does NOT send emails.
 *
 * Usage:  npx tsx bulk-invite.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

type Row = { name: string; email: string; role: "partner" | "friend" };

const USERS: Row[] = [
  { name: "Francesco Zarbo", email: "avv.francesco@studiozarbo.it", role: "partner" },
  { name: "Stefano Aldrovandi", email: "stefano66aldrovandi@gmail.com", role: "partner" },
  { name: "Oriana Cerri", email: "o.cerri@coimisrl.it", role: "friend" },
  { name: "Alessandro Panerai", email: "alessandro.panerai91@gmail.com", role: "partner" },
  { name: "Alberto Crivellenti", email: "businessolutions.adv@gmail.com", role: "friend" },
  { name: "Alessandro Carrucciu", email: "alessandrocarrucciu2016@gmail.com", role: "friend" },
  { name: "Alberto Bezzi", email: "alberto@bezzi.biz", role: "friend" },
  { name: "Giacomo Manaresi", email: "giacomo.manaresi@fndx.vc", role: "friend" },
  { name: "Alessandro Vella", email: "avella@cdt.legal", role: "friend" },
  { name: "Carlo Ziller", email: "carloziller@kriosinvestments.com", role: "friend" },
  { name: "Andrea Coltri", email: "andreacoltri@libero.it", role: "friend" },
  { name: "Carlo Piccinini", email: "cpiccinini.finance@gmail.com", role: "friend" },
  { name: "Paolo Cavagnini", email: "cavagninip@gmail.com", role: "friend" },
  { name: "Andrea Caraceni", email: "andrea.caraceni@cfosim.com", role: "friend" },
  { name: "Andrea Minelli", email: "a.minelli@msadvisory.it", role: "friend" },
  { name: "Fabio Carretta", email: "carretta@delexcapital.com", role: "friend" },
  { name: "Carlo Montenovesi", email: "cmontenovesi@crossborder.it", role: "friend" },
  { name: "Nicolas Schmidtz", email: "ns@lattice-cp.com", role: "friend" },
  { name: "Francesco Di Martino", email: "francesco.dimartino@redfish.capital", role: "friend" },
  { name: "Andrea Mulazzani", email: "andreamula.98@gmail.com", role: "partner" },
  { name: "Gianluca Giovanardi", email: "gianlu.giova@gmail.com", role: "friend" },
  { name: "Giorgio Fontana", email: "giorgio.fontana@skillsforhealth.it", role: "friend" },
];

async function main() {
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const created: { email: string; id: string }[] = [];
  const failed: { email: string; reason: string }[] = [];

  for (const u of USERS) {
    const email = u.email.toLowerCase().trim();
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error || !data.user) throw new Error(error?.message || "no user returned");

      const id = data.user.id;

      const { error: profErr } = await supabaseAdmin.from("profiles").insert({
        id,
        full_name: u.name,
        email,
        role: u.role,
        trial_ends_at: trialEndsAt,
        documents_signed: false,
      });
      if (profErr) throw new Error(`profile: ${profErr.message}`);

      created.push({ email, id });
      console.log(`  OK   ${email}  (${u.role})`);
    } catch (e: any) {
      failed.push({ email, reason: e.message });
      console.log(`  FAIL ${email}  -> ${e.message}`);
    }
  }

  console.log(`\n=== RIEPILOGO ===`);
  console.log(`Creati: ${created.length} / ${USERS.length}`);
  console.log(`Falliti: ${failed.length}`);
  if (failed.length) {
    console.log(`\nDettaglio errori:`);
    failed.forEach((f) => console.log(`  - ${f.email}: ${f.reason}`));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
