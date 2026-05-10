import { supabaseAdmin } from '@/lib/supabase/admin'
import { renderBySlug } from '@/lib/comms/template-engine'
import { sendEmail } from './channels/email'
import { sendWhatsApp } from './channels/whatsapp'
import { sendInApp } from './channels/in-app'
import { sendPec } from './channels/pec'

export type Channel = 'email' | 'whatsapp' | 'in_app' | 'pec'

export interface DispatchInput {
  recipientId: string
  templateSlug: string
  channels: Channel[]
  variables?: Record<string, string | number | undefined>
  deepLink?: string
  urgent?: boolean
}

export interface DispatchResult {
  dispatchId: string
  status: 'sent' | 'partial' | 'failed'
  channelResults: Record<Channel, 'sent' | string>
}

interface RecipientProfile {
  id: string
  email: string | null
  phone: string | null
  pec: string | null
  full_name: string | null
}

interface RenderedTemplate {
  subject: string
  body: string
  html?: string
  channel?: string
}

const MAX_ATTEMPTS = 3
const BACKOFF_MS = [1000, 2000, 4000]

function isTransientError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err).toLowerCase()
  if (
    msg.includes('not configured') ||
    msg.includes('not implemented') ||
    msg.includes('invalid template') ||
    msg.includes('template not found') ||
    msg.includes('missing twilio')
  ) {
    return false
  }
  return (
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('econnreset') ||
    msg.includes('socket') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('429')
  )
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransientError(err) || attempt === MAX_ATTEMPTS - 1) {
        throw err
      }
      const delay = BACKOFF_MS[attempt] ?? 4000
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw lastErr
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

async function loadRecipient(
  recipientId: string
): Promise<RecipientProfile | null> {
  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, phone, pec, full_name')
    .eq('id', recipientId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load recipient profile: ${error.message}`)
  }
  return (data as RecipientProfile | null) ?? null
}

async function dispatchChannel(
  channel: Channel,
  rendered: RenderedTemplate,
  recipient: RecipientProfile,
  deepLink: string | undefined
): Promise<void> {
  switch (channel) {
    case 'email': {
      if (!recipient.email) {
        throw new Error('Recipient has no email address')
      }
      const html = rendered.html ?? rendered.body
      await withRetry(() =>
        sendEmail({
          to: recipient.email!,
          subject: rendered.subject,
          html,
        })
      )
      return
    }
    case 'whatsapp': {
      if (!recipient.phone) {
        throw new Error('Recipient has no phone number')
      }
      const body = deepLink
        ? `${rendered.body}\n\n${deepLink}`
        : rendered.body
      await withRetry(() =>
        sendWhatsApp({
          to: recipient.phone!,
          body,
        })
      )
      return
    }
    case 'in_app': {
      await withRetry(() =>
        sendInApp({
          recipientId: recipient.id,
          subject: rendered.subject,
          body: rendered.body,
          deepLink,
        })
      )
      return
    }
    case 'pec': {
      if (!recipient.pec) {
        throw new Error('Recipient has no PEC address')
      }
      await withRetry(() =>
        sendPec({
          to: recipient.pec!,
          subject: rendered.subject,
          body: rendered.body,
        })
      )
      return
    }
    default: {
      const exhaustive: never = channel
      throw new Error(`Unknown channel: ${String(exhaustive)}`)
    }
  }
}

/**
 * Multi-channel notification dispatcher.
 *
 * 1. Persists a `notifications_dispatch` row in `pending` state.
 * 2. Loads recipient profile and renders the template.
 * 3. Fans out to each requested channel in isolation (one channel's failure
 *    does not affect the others).
 * 4. Records aggregated results and final status.
 *
 * Retries (max 3, exponential backoff 1s/2s/4s) are applied PER CHANNEL,
 * but only for transient errors (network/5xx/timeout). Permanent errors
 * (template invalid, env missing, recipient missing contact info) fail fast.
 */
export async function sendNotification(
  input: DispatchInput
): Promise<DispatchResult> {
  const supabase = supabaseAdmin()

  // 1. Create dispatch record (status=pending)
  const { data: inserted, error: insertErr } = await supabase
    .from('notifications_dispatch')
    .insert({
      recipient_id: input.recipientId,
      template_slug: input.templateSlug,
      channels: input.channels,
      variables: input.variables ?? null,
      status: 'pending',
      deep_link: input.deepLink ?? null,
      attempts: 0,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    throw new Error(
      `Failed to create notifications_dispatch row: ${insertErr?.message ?? 'unknown'}`
    )
  }

  const dispatchId = inserted.id as string

  const channelResults: Record<Channel, 'sent' | string> = {} as Record<
    Channel,
    'sent' | string
  >

  let status: 'sent' | 'partial' | 'failed' = 'failed'
  let renderedContent: RenderedTemplate | null = null

  try {
    // 2. Load recipient
    const recipient = await loadRecipient(input.recipientId)
    if (!recipient) {
      throw new Error(`Recipient ${input.recipientId} not found`)
    }

    // 3. Render template
    const rendered = (await renderBySlug(
      input.templateSlug,
      input.variables ?? {}
    )) as RenderedTemplate
    renderedContent = rendered

    // 4. Per-channel dispatch in isolation
    let sentCount = 0
    let failedCount = 0

    for (const channel of input.channels) {
      try {
        await dispatchChannel(channel, rendered, recipient, input.deepLink)
        channelResults[channel] = 'sent'
        sentCount++
      } catch (err) {
        const msg = errorMessage(err)
        channelResults[channel] = `failed: ${msg}`
        failedCount++
        // Log to console for ops visibility; do not throw — continue with other channels.
        console.error(
          `[notifications/dispatcher] channel=${channel} dispatchId=${dispatchId} error=${msg}`
        )
      }
    }

    // 5. Determine aggregate status
    if (failedCount === 0 && sentCount > 0) {
      status = 'sent'
    } else if (sentCount === 0) {
      status = 'failed'
    } else {
      status = 'partial'
    }
  } catch (err) {
    // Catastrophic failure (recipient/template) — mark all requested channels failed.
    const msg = errorMessage(err)
    for (const channel of input.channels) {
      if (!channelResults[channel]) {
        channelResults[channel] = `failed: ${msg}`
      }
    }
    status = 'failed'
    console.error(
      `[notifications/dispatcher] dispatchId=${dispatchId} fatal=${msg}`
    )
  }

  // 6. Update record with results
  const sentAt =
    status === 'sent' || status === 'partial' ? new Date().toISOString() : null

  const { error: updateErr } = await supabase
    .from('notifications_dispatch')
    .update({
      status,
      channel_results: channelResults,
      content: renderedContent
        ? {
            subject: renderedContent.subject,
            body: renderedContent.body,
            ...(renderedContent.html ? { html: renderedContent.html } : {}),
          }
        : null,
      attempts: 1,
      sent_at: sentAt,
    })
    .eq('id', dispatchId)

  if (updateErr) {
    console.error(
      `[notifications/dispatcher] failed to update dispatch row id=${dispatchId} err=${updateErr.message}`
    )
  }

  return {
    dispatchId,
    status,
    channelResults,
  }
}

/**
 * Mark an in-app notification as read by its recipient.
 * Scoped by recipient_id to prevent cross-user read manipulation.
 */
export async function markAsRead(
  dispatchId: string,
  userId: string
): Promise<void> {
  const supabase = supabaseAdmin()
  const { error } = await supabase
    .from('notifications_dispatch')
    .update({ read_at: new Date().toISOString() })
    .eq('id', dispatchId)
    .eq('recipient_id', userId)

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`)
  }
}
