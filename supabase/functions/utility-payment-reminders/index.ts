import { createServiceClient } from "../_shared/supabase.ts";

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
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const threeDaysLater = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];

    // 1. Find upcoming pending payments with due_date within 3 days
    const { data: upcoming, error: upErr } = await supabase
      .from('property_financials')
      .select('id, property_id, category, amount, currency, due_date, description, owner_id')
      .eq('status', 'pending')
      .eq('recurring', true)
      .not('due_date', 'is', null)
      .lte('due_date', threeDaysLater)
      .order('due_date', { ascending: true });

    if (upErr) throw upErr;

    const results = { reminders_sent: 0, overdue_alerts: 0, errors: [] as string[] };

    for (const payment of (upcoming || [])) {
      const isOverdue = payment.due_date && payment.due_date < todayStr;
      const ownerId = payment.owner_id;
      if (!ownerId) continue;

      // Create in-app notification
      try {
        const daysUntil = Math.ceil(
          (new Date(payment.due_date).getTime() - now.getTime()) / 86400000
        );

        const titleEn = isOverdue 
          ? `⚠️ Overdue: ${payment.category || payment.description}`
          : `💡 Payment due ${daysUntil === 0 ? 'today' : `in ${daysUntil}d`}: ${payment.category || payment.description}`;
        
        const titleRu = isOverdue
          ? `⚠️ Просрочено: ${payment.category || payment.description}`
          : `💡 Оплата ${daysUntil === 0 ? 'сегодня' : `через ${daysUntil} дн.`}: ${payment.category || payment.description}`;

        await supabase.from('notifications').insert({
          user_id: ownerId,
          title: titleEn,
          title_ru: titleRu,
          body: `${Number(payment.amount).toLocaleString()} ${payment.currency || 'THB'}`,
          type: isOverdue ? 'alert' : 'reminder',
          action_url: '/owner/financials',
          metadata: { payment_id: payment.id, property_id: payment.property_id },
        });

        if (isOverdue) {
          results.overdue_alerts++;
        } else {
          results.reminders_sent++;
        }
      } catch (e: any) {
        results.errors.push(`Payment ${payment.id}: ${e.message}`);
      }
    }

    // 2. Auto-mark overdue invoices
    const { error: invoiceErr } = await supabase
      .from('owner_invoices')
      .update({ status: 'overdue' })
      .eq('status', 'sent')
      .lt('due_date', todayStr);
    
    if (invoiceErr) {
      results.errors.push(`Invoice overdue update: ${invoiceErr.message}`);
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
