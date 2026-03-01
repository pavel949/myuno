import { createServiceClient } from '../_shared/supabase.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // 1. Get all pending messages that are due
    const { data: pendingMessages, error: fetchError } = await supabase
      .from('booking_scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;
    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    let failed = 0;

    for (const msg of pendingMessages) {
      try {
        // Process based on channel
        if (msg.channel === 'in_app') {
          // Create a notification in the booking_notifications_log
          await supabase.from('booking_notifications_log').insert({
            booking_id: msg.booking_id,
            notification_type: 'auto_message',
            channel: 'in_app',
            subject: msg.subject,
            body: msg.body,
            sent_at: new Date().toISOString(),
            metadata: msg.metadata,
          });
        }
        // email and whatsapp channels can be added later with integrations

        // Mark as sent
        await supabase
          .from('booking_scheduled_messages')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', msg.id);

        processed++;
      } catch (err) {
        // Mark as failed
        await supabase
          .from('booking_scheduled_messages')
          .update({ 
            status: 'failed', 
            error_message: err instanceof Error ? err.message : 'Unknown error' 
          })
          .eq('id', msg.id);
        failed++;
      }
    }

    return new Response(JSON.stringify({ processed, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing messages:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
