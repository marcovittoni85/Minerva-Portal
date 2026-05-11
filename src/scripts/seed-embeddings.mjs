/**
 * Seed embeddings from REAL PDFs in Supabase Storage.
 * Plain ESM — no tsx needed.
 *
 * Usage: node --max-old-space-size=2048 src/scripts/seed-embeddings.mjs
 */

import { readFileSync } from 'fs'
import { writeFile, unlink } from 'fs/promises'
import { resolve, join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { execFileSync } from 'child_process'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[k]) process.env[k] = v
  }
} catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const SEED_DOCS = [
  { id: 'etico_v3_0', storage_path: 'codici/v3.0/Codice_Etico_VERITAS_v3.0.pdf', document_label: 'Codice Etico' },
  { id: 'operativo_v3_0', storage_path: 'codici/v3.0/Codice_Operativo_v3.0.pdf', document_label: 'Codice Operativo' },
  { id: 'retributivo_v3_0', storage_path: 'codici/v3.0/Codice_Retributivo_v3.0.pdf', document_label: 'Codice Retributivo' },
  { id: 'patto_v1_1', storage_path: 'patti/v1.1/Patto_di_Ingresso_v1.1.pdf', document_label: 'Patto di Ingresso' },
  { id: 'company_profile_2026', storage_path: 'company-profile/Minerva_Company_Profile_2026.pdf', document_label: 'Company Profile' },
]

const CHUNK_SIZE = 1500
const CHUNK_OVERLAP = 150

function chunkText(text, size, overlap) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + size, text.length)
    if (end < text.length) {
      const searchStart = Math.max(start + 1, end - Math.floor(size * 0.2))
      let nb = -1
      for (const sep of ['. ', '.\n', '\n\n']) {
        const idx = text.lastIndexOf(sep, end)
        if (idx > searchStart && idx > nb) nb = idx
      }
      if (nb > start) end = nb + 1
    }
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 50) chunks.push(chunk)
    const nextStart = end - overlap
    if (nextStart <= start) break  // prevent infinite loop
    start = nextStart
  }
  return chunks
}

async function extractPdfText(buffer) {
  // pdf-parse in child process
  const tempPath = join(tmpdir(), `${randomUUID()}.pdf`)
  await writeFile(tempPath, buffer)
  try {
    const text = execFileSync('node', [
      '--max-old-space-size=1024',
      '-e',
      `const p=require('pdf-parse'),f=require('fs');p(f.readFileSync(process.argv[1])).then(r=>{process.stdout.write(r.text)}).catch(e=>{process.stderr.write(e.message);process.exit(1)})`,
      tempPath,
    ], { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }).toString('utf-8')
    return text
  } finally {
    await unlink(tempPath).catch(() => {})
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function embedBatch(texts) {
  // Use OpenAI for batch embedding (higher rate limits than free Voyage)
  const openaiKey = process.env.OPENAI_API_KEY
  const voyageKey = process.env.VOYAGE_API_KEY

  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
    })
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
    const json = await res.json()
    return json.data.map(d => d.embedding)
  }
  if (voyageKey) {
    // Voyage free tier: 3 RPM, so embed one at a time with delay
    const results = []
    for (const text of texts) {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${voyageKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'voyage-large-2', input: [text], input_type: 'document' }),
      })
      if (!res.ok) throw new Error(`Voyage ${res.status}: ${await res.text()}`)
      const json = await res.json()
      results.push(json.data[0].embedding)
      await sleep(21000) // 3 RPM = 20s between calls
    }
    return results
  }
  throw new Error('No OPENAI_API_KEY or VOYAGE_API_KEY')
}

async function main() {
  console.log('=== Seed Embeddings (REAL PDF) ===\n')

  console.log('Clearing existing...')
  await supabase.from('embeddings').delete().eq('entity_type', 'codice')

  let totalChunks = 0

  for (const doc of SEED_DOCS) {
    console.log(`\n--- ${doc.document_label} ---`)
    console.log(`  Download: ${doc.storage_path}`)

    const { data: blob, error: dlErr } = await supabase.storage.from('documents').download(doc.storage_path)
    if (dlErr || !blob) {
      console.log(`  SKIP (download failed: ${dlErr?.message ?? 'no blob'})`)
      continue
    }

    const buffer = Buffer.from(await blob.arrayBuffer())
    console.log(`  ${(buffer.length / 1024).toFixed(0)} KB`)

    let text
    try {
      text = await extractPdfText(buffer)
    } catch (e) {
      console.log(`  SKIP (extraction failed: ${e.message?.slice(0, 80)})`)
      continue
    }

    if (!text || text.length < 100) {
      console.log(`  SKIP (only ${text?.length ?? 0} chars)`)
      continue
    }
    console.log(`  ${text.length} chars extracted`)

    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP)
    console.log(`  ${chunks.length} chunks`)

    // Embed in batches of 20 (OpenAI supports batch)
    const BATCH = 20
    let inserted = 0
    for (let b = 0; b < chunks.length; b += BATCH) {
      const batch = chunks.slice(b, b + BATCH)
      const embeddings = await embedBatch(batch)

      for (let i = 0; i < batch.length; i++) {
        const { error } = await supabase.from('embeddings').insert({
          entity_type: 'codice',
          entity_id: `${doc.id}_chunk_${b + i + 1}`,
          content: batch[i],
          embedding: embeddings[i],
          metadata: {
            document: doc.document_label,
            document_id: doc.id,
            chunk_index: b + i + 1,
            total_chunks: chunks.length,
            source_path: doc.storage_path,
            char_length: batch[i].length,
          },
        })
        if (error) console.log(`    chunk ${b + i + 1} FAILED: ${error.message}`)
        else inserted++
      }
      process.stdout.write(`  [${Math.min(b + BATCH, chunks.length)}/${chunks.length}]\r`)
    }

    console.log(`  ${inserted} chunks done.          `)
    totalChunks += chunks.length
  }

  console.log(`\n=== DONE: ${totalChunks} total chunks ===\n`)

  const { data } = await supabase.from('embeddings').select('metadata').eq('entity_type', 'codice')
  if (data) {
    const c = {}
    for (const r of data) c[r.metadata?.document ?? '?'] = (c[r.metadata?.document ?? '?'] ?? 0) + 1
    for (const [k, v] of Object.entries(c).sort()) console.log(`  ${k}: ${v}`)
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1) })
