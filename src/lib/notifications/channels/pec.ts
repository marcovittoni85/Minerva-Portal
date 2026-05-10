/**
 * PEC (Posta Elettronica Certificata) channel — placeholder for W2.
 * Will integrate with Aruba PEC SMTP relay when credentials are provisioned.
 */
export interface SendPecOpts {
  to: string
  subject: string
  body: string
  attachments?: { filename: string; content: Buffer }[]
}

export async function sendPec(_opts: SendPecOpts): Promise<{ id: string }> {
  throw new Error(
    'PEC not implemented yet — placeholder for W2 (Aruba PEC integration)'
  )
}
