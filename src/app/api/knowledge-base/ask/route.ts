import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthUser } from '@/lib/supabase/server'
import { similaritySearch } from '@/lib/embeddings/pipeline'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { question, conversationId } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Domanda richiesta' }, { status: 400 })
    }

    // Semantic search across codice documents
    console.log('[KB Ask] Query:', question)
    const results = await similaritySearch({
      query: question,
      entityTypes: ['codice'],
      limit: 5,
      threshold: 0.4,
    })
    console.log('[KB Ask] Found chunks:', results.length)
    if (results.length > 0) {
      console.log('[KB Ask] Top similarity:', results[0].similarity)
      console.log('[KB Ask] Top preview:', results[0].content?.slice(0, 150))
    }

    // No results found
    if (!results || results.length === 0) {
      return NextResponse.json({
        answer: 'Non ho trovato informazioni pertinenti nei Codici per rispondere alla tua domanda. Prova a riformulare la domanda o contatta il team per assistenza.',
        citations: [],
      })
    }

    // Build context from search results
    const contextParts = results.map((r, i) => {
      return `[FONTE ${i + 1}] (${r.entity_type} - ${r.entity_id}, similarita: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`
    })
    const context = contextParts.join('\n\n---\n\n')

    // Build citations array — expose human-readable labels, never raw entity_id
    const citations = results.map((r, i) => {
      const meta = r.metadata as { document?: string; title?: string; chapter?: number } | undefined
      const sourceLabel = meta?.document && meta?.title
        ? `${meta.document} — ${meta.title}`
        : meta?.document ?? r.entity_id.replace(/-/g, ' ').replace(/ch(\d)/, 'Cap. $1')
      return {
        index: i + 1,
        sourceLabel,
        chapter: meta?.chapter ?? null,
        similarityPct: Math.round(r.similarity * 100),
        excerpt: r.content.slice(0, 200),
      }
    })

    const systemPrompt = `Sei Minerva Intelligence, l'assistente AI di Minerva Partners specializzato nella Knowledge Base normativa e regolamentare.

Rispondi ESCLUSIVAMENTE sulla base delle fonti fornite nel contesto. Non inventare informazioni.
Cita le fonti usando il formato [FONTE N] quando fai riferimento a un passaggio specifico.
Se le fonti non contengono informazioni sufficienti per rispondere, dillo chiaramente.
Usa un tono professionale e formale in italiano.
Struttura la risposta in modo chiaro, usando elenchi puntati o numerati quando appropriato.`

    const userPrompt = `Contesto dalle fonti:

${context}

---

Domanda dell'utente: ${question}`

    // Create streaming response
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const encoder = new TextEncoder()
    let fullAnswer = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text
              fullAnswer += text
              const line = JSON.stringify({ type: 'text', text }) + '\n'
              controller.enqueue(encoder.encode(line))
            }
          }

          // Send citations at the end
          const citationsLine =
            JSON.stringify({ type: 'citations', citations }) + '\n'
          controller.enqueue(encoder.encode(citationsLine))

          // Save conversation to database
          try {
            if (conversationId) {
              // Append to existing conversation
              const { data: existing } = await supabase
                .from('kb_conversations')
                .select('messages')
                .eq('id', conversationId)
                .eq('user_id', user.id)
                .single()

              const messages = existing?.messages || []
              messages.push(
                { role: 'user', content: question },
                { role: 'assistant', content: fullAnswer, citations }
              )

              await supabase
                .from('kb_conversations')
                .update({
                  messages,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', conversationId)
            } else {
              // Create new conversation
              await supabase.from('kb_conversations').insert({
                user_id: user.id,
                title: question.slice(0, 100),
                messages: [
                  { role: 'user', content: question },
                  { role: 'assistant', content: fullAnswer, citations },
                ],
              })
            }
          } catch (dbError) {
            console.error('Error saving conversation:', dbError)
          }

          controller.close()
        } catch (err) {
          console.error('Streaming error:', err)
          const errorLine =
            JSON.stringify({
              type: 'error',
              error: 'Errore durante la generazione della risposta',
            }) + '\n'
          controller.enqueue(encoder.encode(errorLine))
          controller.close()
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Knowledge base ask error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
