/**
 * Seed embeddings from REAL PDFs in Supabase Storage.
 *
 * Downloads 5 PDF documents, extracts text via Claude native PDF,
 * chunks into ~800 char segments, and embeds via Voyage AI.
 *
 * Usage: npx tsx src/scripts/seed-embeddings.ts
 */

import { readFileSync } from 'fs'
import { resolve, join } from 'path'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
} catch { /* no .env.local */ }

import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'child_process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ─── Document config ───

interface SeedDoc {
  id: string
  storage_path: string
  document_label: string
}

const SEED_DOCS: SeedDoc[] = [
  {
    id: 'etico_v3_0',
    storage_path: 'codici/v3.0/Codice_Etico_VERITAS_v3.0.pdf',
    document_label: 'Codice Etico',
  },
  {
    id: 'operativo_v3_0',
    storage_path: 'codici/v3.0/Codice_Operativo_v3.0.pdf',
    document_label: 'Codice Operativo',
  },
  {
    id: 'retributivo_v3_0',
    storage_path: 'codici/v3.0/Codice_Retributivo_v3.0.pdf',
    document_label: 'Codice Retributivo',
  },
  {
    id: 'patto_v1_1',
    storage_path: 'patti/v1.1/Patto_di_Ingresso_v1.1.pdf',
    document_label: 'Patto di Ingresso',
  },
  {
    id: 'company_profile_2026',
    storage_path: 'company-profile/Minerva_Company_Profile_2026.pdf',
    document_label: 'Company Profile',
  },
]

const CHUNK_SIZE = 1500
const CHUNK_OVERLAP = 150

// ─── Text extraction via Claude ───

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Try Claude API via fetch (no SDK import to save memory)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    try {
      const base64 = buffer.toString('base64')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [{
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              { type: 'text', text: 'Estrai TUTTO il testo da questo PDF mantenendo la struttura originale. Output: solo il testo estratto.' },
            ],
          }],
        }),
      })
      if (res.ok) {
        const json = await res.json() as any
        const text = json.content?.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n') ?? ''
        if (text.length > 100) {
          console.log('    (via Claude)')
          return text
        }
      } else {
        const err = await res.text()
        console.log(`    Claude failed: ${err.slice(0, 80)}`)
      }
    } catch (err: any) {
      console.log(`    Claude failed: ${err.message?.slice(0, 80)}`)
    }
  }

  // Fallback: pdf-parse in a child process to avoid OOM in main process
  console.log('    (via pdf-parse subprocess)')
  const tempPath = join(tmpdir(), `${randomUUID()}.pdf`)
  await writeFile(tempPath, buffer)
  try {
    const text = execFileSync('node', [
      '--max-old-space-size=2048',
      '-e',
      `const pdfParse = require('pdf-parse');
       const fs = require('fs');
       const buf = fs.readFileSync(process.argv[1]);
       pdfParse(buf).then(r => { process.stdout.write(r.text); }).catch(e => { process.stderr.write(e.message); process.exit(1); });`,
      tempPath,
    ], { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }).toString('utf-8')
    return text
  } finally {
    await unlink(tempPath).catch(() => {})
  }
}

// ─── Chunking ───

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = Math.min(start + size, text.length)

    // Find natural break point (sentence end) in last 20%
    if (end < text.length) {
      const searchStart = end - Math.floor(size * 0.2)
      const naturalBreak = Math.max(
        text.lastIndexOf('. ', end),
        text.lastIndexOf('.\n', end),
        text.lastIndexOf('!\n', end),
        text.lastIndexOf('?\n', end),
        text.lastIndexOf('\n\n', end),
      )
      if (naturalBreak > searchStart) end = naturalBreak + 1
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length > 50) chunks.push(chunk)
    start = end - overlap
  }

  return chunks
}

// ─── Embedding ───

async function embedTexts(texts: string[]): Promise<number[][]> {
  const voyageKey = process.env.VOYAGE_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  // Batch in groups of 20 to avoid API limits
  const batchSize = 20
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)

    if (voyageKey) {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${voyageKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'voyage-large-2', input: batch, input_type: 'document' }),
      })
      if (!res.ok) throw new Error(`Voyage error ${res.status}: ${await res.text()}`)
      const json = await res.json() as { data: { embedding: number[] }[] }
      allEmbeddings.push(...json.data.map((d: { embedding: number[] }) => d.embedding))
    } else if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: batch }),
      })
      if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`)
      const json = await res.json() as { data: { embedding: number[] }[] }
      allEmbeddings.push(...json.data.map((d: { embedding: number[] }) => d.embedding))
    } else {
      throw new Error('No VOYAGE_API_KEY or OPENAI_API_KEY found')
    }

    if (i + batchSize < texts.length) {
      // Small delay between batches
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return allEmbeddings
}

// ─── Main ───

async function main() {
  console.log('=== Seed Embeddings (REAL PDF extraction) ===\n')

  // 1. Clear existing
  console.log('Clearing existing codice embeddings...')
  const { error: delErr } = await supabase.from('embeddings').delete().eq('entity_type', 'codice')
  if (delErr) {
    console.error('Delete error:', delErr.message)
    process.exit(1)
  }
  console.log('  Cleared.\n')

  let totalChunks = 0

  for (const doc of SEED_DOCS) {
    console.log(`--- ${doc.document_label} (${doc.id}) ---`)

    // Download from Storage
    console.log(`  Downloading: ${doc.storage_path}`)
    const { data: blob, error: dlErr } = await supabase.storage
      .from('documents')
      .download(doc.storage_path)

    if (dlErr || !blob) {
      console.error(`  DOWNLOAD FAILED: ${dlErr?.message ?? 'No blob'}`)
      console.error(`  Path: documents/${doc.storage_path}`)
      console.log('  SKIPPING.\n')
      continue
    }

    const buffer = Buffer.from(await blob.arrayBuffer())
    console.log(`  Downloaded: ${(buffer.length / 1024).toFixed(1)} KB`)

    // Extract text via Claude
    console.log('  Extracting text via Claude...')
    let text: string
    try {
      text = await extractPdfText(buffer)
    } catch (err: any) {
      console.error(`  EXTRACTION FAILED: ${err.message}`)
      console.log('  SKIPPING.\n')
      continue
    }

    if (!text || text.length < 100) {
      console.error(`  WARNING: Only ${text?.length ?? 0} chars extracted. Skipping.`)
      continue
    }
    console.log(`  Extracted: ${text.length} chars`)

    // Chunk
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP)
    console.log(`  Chunks: ${chunks.length}`)

    // Embed and insert one chunk at a time to minimize memory
    console.log('  Embedding & inserting one by one...')
    let inserted = 0
    for (let i = 0; i < chunks.length; i++) {
      const [embedding] = await embedTexts([chunks[i]])

      const { error: insertErr } = await supabase.from('embeddings').insert({
        entity_type: 'codice',
        entity_id: `${doc.id}_chunk_${i + 1}`,
        content: chunks[i],
        embedding,
        metadata: {
          document: doc.document_label,
          document_id: doc.id,
          chunk_index: i + 1,
          total_chunks: chunks.length,
          source_path: doc.storage_path,
          char_length: chunks[i].length,
        },
      })

      if (insertErr) {
        console.error(`  INSERT FAILED chunk ${i + 1}: ${insertErr.message}`)
      } else {
        inserted++
      }
      process.stdout.write(`  [${i + 1}/${chunks.length}]\r`)
    }

    console.log(`  ${inserted} chunks embedded.                \n`)
    totalChunks += chunks.length
  }

  // Summary
  console.log('=== SEED COMPLETED ===')
  console.log(`Total chunks: ${totalChunks}\n`)

  // Verify
  const { data: verify } = await supabase
    .from('embeddings')
    .select('metadata')
    .eq('entity_type', 'codice')

  if (verify) {
    const counts: Record<string, number> = {}
    for (const v of verify) {
      const name = (v.metadata as any)?.document ?? 'unknown'
      counts[name] = (counts[name] ?? 0) + 1
    }
    console.log('Distribution:')
    for (const [name, count] of Object.entries(counts).sort()) {
      console.log(`  ${name}: ${count} chunks`)
    }
  }
}

main().catch(err => {
  console.error('FATAL:', err)
  process.exit(1)
})
