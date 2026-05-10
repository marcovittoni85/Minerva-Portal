import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface Params {
  dealId: string
  settore: string
  tipoOperazione: string
}

const SETTORE_VISUAL_HINTS: Record<string, string> = {
  meccanica: 'industrial gears, machined metal, precision components',
  alimentare: 'abstract food architecture, golden grain fields',
  moda: 'fabric textures, fashion atelier, geometric patterns',
  energia: 'wind turbines abstract, solar panels geometric',
  tech: 'circuit board abstract, data flow geometric',
  immobiliare: 'modern architecture, building silhouettes',
  servizi: 'abstract network nodes, professional handshake silhouette',
  retail: 'abstract storefronts, shopping bags geometric',
  pharma: 'abstract laboratory, molecular structures',
  'real estate': 'modern architecture, building silhouettes',
  default: 'abstract geometric pattern, business confidence',
}

function buildPrompt(params: Params): string {
  const settoreLower = (params.settore || '').toLowerCase()
  let visualHint = SETTORE_VISUAL_HINTS.default

  for (const [key, hint] of Object.entries(SETTORE_VISUAL_HINTS)) {
    if (settoreLower.includes(key)) {
      visualHint = hint
      break
    }
  }

  return `Editorial business illustration, abstract minimal style.
Subject: ${visualHint}
Color palette: deep navy blue (#001220) and gold (#D4AF37), monochromatic luxury.
Style: modern editorial, geometric, sophisticated, NO TEXT, NO PEOPLE, NO LOGOS.
Composition: centered abstract focal point, soft depth, subtle lighting.
Aspect ratio: 3:2 wide.
Reminiscent of: Italian luxury financial publications, premium boutique advisory firms.
Theme: ${params.tipoOperazione || 'M&A'} transaction, professional confidence, exclusivity.
NO text, NO words, NO letters in the image.`
}

export async function generateDealCover(params: Params): Promise<{ url: string }> {
  const prompt = buildPrompt(params)

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1792x1024',
    quality: 'standard',
    n: 1,
  })

  const imageUrl = response.data?.[0]?.url
  if (!imageUrl) throw new Error('No image URL returned from DALL-E')

  // Download and upload to Supabase Storage
  const imgResponse = await fetch(imageUrl)
  const imgBuffer = Buffer.from(await imgResponse.arrayBuffer())

  const supabase = supabaseAdmin()
  const storagePath = `deal-covers/${params.dealId}.jpg`

  await supabase.storage
    .from('deal-docs')
    .upload(storagePath, imgBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  const { data: { publicUrl } } = supabase.storage
    .from('deal-docs')
    .getPublicUrl(storagePath)

  await supabase
    .from('deals')
    .update({
      cover_url: publicUrl,
      cover_generated_at: new Date().toISOString(),
    })
    .eq('id', params.dealId)

  return { url: publicUrl }
}
