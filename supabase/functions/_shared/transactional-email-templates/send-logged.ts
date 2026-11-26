import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendTemplateEmail, type SendTemplateEmailResult } from './send-email.ts'

// Sends a registered template and records the outcome in email_send_log,
// preserving the app's send history. The log row never decides the result.
export async function sendLoggedTemplateEmail(
  templateName: string,
  recipient: string,
  opts: { templateData?: Record<string, unknown>; idempotencyKey?: string } = {},
): Promise<SendTemplateEmailResult> {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const log = async (status: 'sent' | 'suppressed' | 'failed', error_message?: string) => {
    const { error } = await sb.from('email_send_log').insert({
      message_id: null,
      template_name: templateName,
      recipient_email: recipient,
      status,
      error_message: error_message ?? null,
    })
    if (error) console.error('[email] log write failed', { code: error.code, message: error.message })
  }
  try {
    const result = await sendTemplateEmail(templateName, recipient, opts)
    await log(result.sent ? 'sent' : 'suppressed')
    return result
  } catch (e) {
    await log('failed', e instanceof Error ? e.message : String(e))
    throw e
  }
}
