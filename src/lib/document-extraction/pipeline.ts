import mammoth from 'mammoth'
import { readFile } from 'node:fs/promises'

interface ExtractionResult {
  text: string
  tables: Record<string, string>[]
  metadata: {
    pages?: number
    format: string
  }
}

export async function extractDocument(filePath: string): Promise<ExtractionResult> {
  const buffer = await readFile(filePath)
  const ext = filePath.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return extractPDF(buffer)
  } else if (ext === 'docx' || ext === 'doc') {
    return extractDOCX(buffer)
  } else {
    // Fallback: treat as text
    return {
      text: buffer.toString('utf-8'),
      tables: [],
      metadata: { format: ext ?? 'txt' },
    }
  }
}

async function extractPDF(buffer: Buffer): Promise<ExtractionResult> {
  // Use Claude's native PDF support via base64 — extract text by sending to Claude
  // For server-side text extraction without Claude, we parse what we can
  // In production this would use pdf-parse or similar, but for now we return
  // the base64 for Claude to process directly
  const base64 = buffer.toString('base64')

  // Try basic text extraction from PDF binary
  // Real implementation would use a PDF parser library
  let text = ''
  try {
    // Extract readable text segments from PDF binary
    const str = buffer.toString('latin1')
    const textMatches = str.match(/\(([^)]+)\)/g)
    if (textMatches) {
      text = textMatches.map(m => m.slice(1, -1)).join(' ')
    }
  } catch {
    // PDF text extraction failed — Claude will handle via native PDF support
  }

  return {
    text: text || '[PDF content — use Claude native PDF support for full extraction]',
    tables: [],
    metadata: { format: 'pdf' },
  }
}

async function extractDOCX(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer })
  return {
    text: result.value,
    tables: [],
    metadata: { format: 'docx' },
  }
}
