/**
 * Docling wrapper — STUB.
 * Docling (IBM) gestisce OCR PDF scansionati + estrazione tabelle XLSX.
 * Richiede subprocess Python — non eseguibile su Vercel.
 *
 * Setup: stesso worker Python di MarkItDown.
 * Settare DOCLING_WORKER_URL in .env.local quando il worker e online.
 */

export interface DoclingResult {
  text: string
  tables: Record<string, string>[]
  metadata: { format: string; ocrApplied?: boolean; pages?: number }
}

const WORKER_URL = process.env.DOCLING_WORKER_URL

export function isDoclingAvailable(): boolean {
  return Boolean(WORKER_URL)
}

export async function doclingOCR(buffer: Buffer): Promise<DoclingResult> {
  if (!WORKER_URL) {
    throw new Error('Docling worker not configured (set DOCLING_WORKER_URL).')
  }

  const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: new Uint8Array(buffer),
  })
  if (!res.ok) throw new Error(`Docling OCR ${res.status}: ${await res.text().catch(() => '')}`)
  return (await res.json()) as DoclingResult
}

export async function doclingExtractTables(buffer: Buffer, format: 'xlsx' | 'csv'): Promise<DoclingResult> {
  if (!WORKER_URL) {
    throw new Error('Docling worker not configured (set DOCLING_WORKER_URL).')
  }

  const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/tables`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-Format': format },
    body: new Uint8Array(buffer),
  })
  if (!res.ok) throw new Error(`Docling tables ${res.status}: ${await res.text().catch(() => '')}`)
  return (await res.json()) as DoclingResult
}
