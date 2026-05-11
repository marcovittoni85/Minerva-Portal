import mammoth from 'mammoth'
import { readFile } from 'node:fs/promises'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'
import { isMarkItDownAvailable, markItDownExtract } from './markitdown-wrapper'
import { isDoclingAvailable, doclingOCR, doclingExtractTables } from './docling-wrapper'

interface ExtractionResult {
  text: string
  tables: Record<string, string>[]
  metadata: {
    pages?: number
    format: string
    extractor: 'mammoth' | 'claude-native' | 'markitdown' | 'docling' | 'fallback-text' | 'fallback-binary'
    contentHash?: string
  }
}

export async function extractDocument(filePath: string): Promise<ExtractionResult> {
  const buffer = await readFile(filePath)
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const contentHash = createHash('md5').update(buffer).digest('hex')

  if (ext === 'pdf') return extractPDF(buffer, contentHash)
  if (ext === 'docx' || ext === 'doc') return extractDOCX(buffer, contentHash)

  if (ext === 'pptx' || ext === 'ppt') {
    if (isMarkItDownAvailable()) {
      const r = await markItDownExtract(buffer, ext)
      return { ...r, metadata: { ...r.metadata, contentHash, extractor: 'markitdown' } }
    }
    throw new Error('PPT/PPTX extraction richiede MarkItDown worker.')
  }

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
    if (isDoclingAvailable()) {
      const fmt: 'xlsx' | 'csv' = ext === 'csv' ? 'csv' : 'xlsx'
      const r = await doclingExtractTables(buffer, fmt)
      return { ...r, metadata: { ...r.metadata, contentHash, extractor: 'docling' } }
    }
    if (ext === 'csv') {
      return {
        text: buffer.toString('utf-8'),
        tables: [],
        metadata: { format: 'csv', extractor: 'fallback-text', contentHash },
      }
    }
    throw new Error('XLSX extraction richiede Docling worker.')
  }

  return {
    text: buffer.toString('utf-8'),
    tables: [],
    metadata: { format: ext || 'unknown', extractor: 'fallback-text', contentHash },
  }
}

async function extractPDF(buffer: Buffer, contentHash: string): Promise<ExtractionResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await extractPDFViaClaude(buffer, contentHash)
    } catch (err) {
      console.warn('[doc-extraction] Claude PDF failed:', err instanceof Error ? err.message : err)
    }
  }

  if (isMarkItDownAvailable()) {
    try {
      const r = await markItDownExtract(buffer, 'pdf')
      return { ...r, metadata: { ...r.metadata, contentHash, extractor: 'markitdown' } }
    } catch (err) {
      console.warn('[doc-extraction] MarkItDown failed:', err instanceof Error ? err.message : err)
    }
  }

  if (isDoclingAvailable()) {
    try {
      const r = await doclingOCR(buffer)
      return { ...r, metadata: { ...r.metadata, contentHash, extractor: 'docling' } }
    } catch (err) {
      console.warn('[doc-extraction] Docling OCR failed:', err instanceof Error ? err.message : err)
    }
  }

  const str = buffer.toString('latin1')
  const matches = str.match(/\(([^)]+)\)/g)
  const text = matches ? matches.map(m => m.slice(1, -1)).join(' ') : ''
  return {
    text: text || '[PDF estrazione fallita - configurare worker o ANTHROPIC_API_KEY]',
    tables: [],
    metadata: { format: 'pdf', extractor: 'fallback-binary', contentHash },
  }
}

async function extractPDFViaClaude(buffer: Buffer, contentHash: string): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const base64 = buffer.toString('base64')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: 'Estrai TUTTO il testo da questo PDF mantenendo struttura. Tabelle in markdown. Output: solo testo estratto.' },
        ],
      },
    ],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')

  return { text, tables: [], metadata: { format: 'pdf', extractor: 'claude-native', contentHash } }
}

async function extractDOCX(buffer: Buffer, contentHash: string): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer })
  return { text: result.value, tables: [], metadata: { format: 'docx', extractor: 'mammoth', contentHash } }
}
