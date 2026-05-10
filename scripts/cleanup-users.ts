/**
 * Temporary cleanup script.
 * Deletes all non-admin users (profiles + auth.users).
 *
 * Usage:
 *   npx tsx cleanup-users.ts          # dry-run, lists users
 *   npx tsx cleanup-users.ts --confirm  # actually deletes
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually (no extra deps required)
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

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const confirm = process.argv.includes("--confirm");

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role");

  if (error) {
    console.error("Errore lettura profili:", error.message);
    process.exit(1);
  }

  const toDelete = (profiles ?? []).filter((p) => p.role !== "admin");
  const admins = (profiles ?? []).filter((p) => p.role === "admin");

  console.log(`\nTotale profili: ${profiles?.length ?? 0}`);
  console.log(`Admin (preservati): ${admins.length}`);
  admins.forEach((a) => console.log(`  [KEEP] ${a.email} — ${a.full_name ?? ""}`));

  console.log(`\nUtenti che verrebbero ELIMINATI: ${toDelete.length}`);
  toDelete.forEach((u) =>
    console.log(`  [DELETE] ${u.email} — ${u.full_name ?? ""} (role: ${u.role ?? "null"})`)
  );

  if (!confirm) {
    console.log("\nDry-run. Per eseguire l'eliminazione, rilancia con:  npx tsx cleanup-users.ts --confirm");
    return;
  }

  console.log("\n--- ELIMINAZIONE IN CORSO ---");
  let deleted = 0;
  for (const u of toDelete) {
    const { error: profErr } = await supabase.from("profiles").delete().eq("id", u.id);
    if (profErr) {
      console.error(`  ERR profile ${u.email}: ${profErr.message}`);
      continue;
    }
    const { error: authErr } = await supabase.auth.admin.deleteUser(u.id);
    if (authErr) {
      console.error(`  ERR auth ${u.email}: ${authErr.message}`);
      continue;
    }
    console.log(`  OK ${u.email}`);
    deleted++;
  }

  console.log(`\nEliminati: ${deleted} / ${toDelete.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
