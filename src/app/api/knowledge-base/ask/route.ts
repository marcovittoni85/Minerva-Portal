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
    const results = await similaritySearch({
      query: question,
      entityTypes: ['codice'],
      limit: 5,
      threshold: 0.6,
    })

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

    // Build citations array
    const citations = results.map((r, i) => ({
      index: i + 1,
      entityId: r.entity_id,
      entityType: r.entity_type,
      similarity: r.similarity,
      excerpt: r.content.slice(0, 200),
    }))

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
