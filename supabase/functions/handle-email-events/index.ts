import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.8.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Records terminal delivery outcomes in the app's email history tables.
// Notification-only: these rows never gate sends (Lovable enforces suppression).
const sb = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type Reason = 'bounce' | 'complaint' | 'unsubscribe'
const STATUS: Record<Reason, 'bounced' | 'complained' | 'suppressed'> = {
  bounce: 'bounced',
  complaint: 'complained',
  unsubscribe: 'suppressed',
}
const MESSAGE: Record<Reason, string> = {
  bounce: 'Permanent bounce — email address is invalid or rejected',
  complaint: 'Spam complaint — recipient marked email as spam',
  unsubscribe: 'Recipient unsubscribed',
}

async function record(
  reason: Reason,
  event: { event_id: string; data: { recipient: string; message_id?: string | null } },
) {
  const client = sb()
  const email = event.data.recipient.toLowerCase()

  const { error: suppressError } = await client
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('suppressed_emails write failed', {
      event_id: event.event_id,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('suppressed_emails write failed')
  }

  const { error: logError } = await client.from('email_send_log').insert({
    message_id: event.data.message_id ?? null,
    template_name: 'system',
    recipient_email: email,
    status: STATUS[reason],
    error_message: MESSAGE[reason],
    metadata: null,
  })
  if (logError) {
    console.error('email_send_log write failed', {
      event_id: event.event_id,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('email_send_log write failed')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': (event) => record('bounce', event),
    'email.complaint': (event) => record('complaint', event),
    'email.unsubscribed': (event) => record('unsubscribe', event),
  },
})

Deno.serve((req) => handler(req))
