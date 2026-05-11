/**
 * MarkItDown wrapper — STUB.
 * MarkItDown (Microsoft) richiede subprocess Python (pip install markitdown[all]).
 * Vercel serverless NON supporta Python runtime.
 *
 * Setup raccomandato: worker dedicato (n8n / Hetzner / FastAPI) chiamato via HTTPS.
 * Settare MARKITDOWN_WORKER_URL in .env.local quando il worker e online.
 *
 * Per ora la pipeline TS usa fallback:
 *  - DOCX -> mammoth (pure JS)
 *  - PDF -> Claude native PDF support (Anthropic SDK)
 */

export interface MarkItDownResult {
  text: string
  tables: Record<string, string>[]
  metadata: { format: string; pages?: number }
}

const WORKER_URL = process.env.MARKITDOWN_WORKER_URL

export function isMarkItDownAvailable(): boolean {
  return Boolean(WORKER_URL)
}

export async function markItDownExtract(buffer: Buffer, format: string): Promise<MarkItDownResult> {
  if (!WORKER_URL) {
    throw new Error('MarkItDown worker not configured (set MARKITDOWN_WORKER_URL).')
  }

  const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-Format': format },
    body: new Uint8Array(buffer),
  })
  if (!res.ok) throw new Error(`MarkItDown worker ${res.status}: ${await res.text().catch(() => '')}`)
  return (await res.json()) as MarkItDownResult
}
