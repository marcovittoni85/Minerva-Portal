/**
 * WhatsApp channel via Twilio (placeholder until env is configured).
 *
 * Required env vars:
 *  - TWILIO_ACCOUNT_SID
 *  - TWILIO_AUTH_TOKEN
 *  - TWILIO_WHATSAPP_FROM (E.164 phone number, without `whatsapp:` prefix)
 *
 * If any of these are missing, the function fails fast so the dispatcher
 * can mark this channel as failed without affecting other channels.
 */
export interface SendWhatsAppOpts {
  to: string // E.164 format, e.g. +393331234567
  body: string
}

export async function sendWhatsApp(
  opts: SendWhatsAppOpts
): Promise<{ sid: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!sid || !token || !from) {
    throw new Error(
      'WhatsApp not configured: missing TWILIO_* env vars'
    )
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
    sid
  )}/Messages.json`

  const auth = Buffer.from(`${sid}:${token}`).toString('base64')

  const form = new URLSearchParams()
  form.set('From', `whatsapp:${from}`)
  form.set('To', `whatsapp:${opts.to}`)
  form.set('Body', opts.body)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(
      `Twilio WhatsApp send failed: ${res.status} ${res.statusText} ${errText}`
    )
  }

  const json = (await res.json().catch(() => ({}))) as { sid?: string }
  return { sid: json.sid ?? 'unknown' }
}
