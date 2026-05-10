import { supabaseAdmin } from '@/lib/supabase/admin'

export interface SendInAppOpts {
  recipientId: string
  subject: string
  body: string
  deepLink?: string
}

/**
 * In-app notification: the persistence happens in `notifications_dispatch`
 * (managed by the dispatcher). Here we additionally fan out a Supabase
 * Realtime broadcast on channel `notif:{recipientId}` so connected clients
 * can react instantly.
 *
 * Clients subscribe with:
 *   supabase.channel(`notif:${userId}`)
 *     .on('broadcast', { event: 'notification' }, ({ payload }) => { ... })
 *     .subscribe()
 */
export async function sendInApp(
  opts: SendInAppOpts
): Promise<{ id: string }> {
  const supabase = supabaseAdmin()
  const channelName = `notif:${opts.recipientId}`
  const broadcastId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `bc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const channel = supabase.channel(channelName, {
    config: { broadcast: { ack: false, self: false } },
  })

  try {
    // Subscribe must complete before send for the broadcast to flush.
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Realtime subscribe timeout')),
        5000
      )
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout)
          resolve()
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout)
          reject(new Error(`Realtime subscribe failed: ${status}`))
        }
      })
    })

    const sendResult = await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        id: broadcastId,
        subject: opts.subject,
        body: opts.body,
        deepLink: opts.deepLink ?? null,
        createdAt: new Date().toISOString(),
      },
    })

    if (sendResult !== 'ok') {
      throw new Error(`Realtime broadcast send returned ${String(sendResult)}`)
    }

    return { id: broadcastId }
  } finally {
    await supabase.removeChannel(channel).catch(() => {
      /* noop */
    })
  }
}
