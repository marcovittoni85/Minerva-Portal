import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface SendEmailOpts {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

/**
 * Send a transactional email via Resend.
 * Throws on configuration errors or upstream failures so the dispatcher
 * can record per-channel status.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<{ id: string }> {
  if (!resend) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const result = await resend.emails.send({
    from: opts.from ?? 'Minerva Partners <noreply@minervapartners.it>',
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.text ? { text: opts.text } : {}),
  })

  if (result.error) {
    throw new Error(`Resend: ${result.error.message}`)
  }

  return { id: result.data?.id ?? 'unknown' }
}
