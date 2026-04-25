import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow internal/cron calls
    const denied = requireInternalSecret(req, corsHeaders);
    if (denied) return denied;

    const sb = createServiceClient();

    // Find all companies with auto backup enabled
    const { data: companies, error: compErr } = await sb
      .from('management_companies')
      .select('id, name_en, backup_settings')
      .not('backup_settings', 'is', null);

    if (compErr) throw compErr;

    const now = new Date();
    const results: { company_id: string; status: string; tables: number }[] = [];

    for (const company of (companies || [])) {
      const settings = company.backup_settings as Record<string, unknown> | null;
      if (!settings?.auto_enabled) continue;

      const frequency = (settings.frequency as string) || 'monthly';

      // Check if backup is due — weekly = every Sunday, monthly = 1st of month
      const isDue =
        (frequency === 'weekly' && now.getUTCDay() === 0) ||
        (frequency === 'monthly' && now.getUTCDate() === 1);

      if (!isDue) continue;

      // Collect all data
      const allData: Record<string, unknown> = {
        backup_at: now.toISOString(),
        company_id: company.id,
        company_name: company.name_en,
      };

      const [props, contacts, deals, transactions, reports] = await Promise.all([
        sb.from('properties').select('*').eq('management_company_id', company.id),
        sb.from('crm_contacts').select('*').eq('company_id', company.id),
        sb.from('agent_deals').select('*').eq('company_id', company.id),
        /* TODO: missing table — see audit */ sb.from('mc_finance_transactions' as any).select('*').eq('company_id', company.id),
        sb.from('owner_reports').select('*').eq('company_id', company.id),
      ]);

      allData.properties = props.data || [];
      allData.crm_contacts = contacts.data || [];
      allData.crm_deals = deals.data || [];
      allData.finance_transactions = transactions.data || [];
      allData.reports = reports.data || [];

      // Upload to storage
      const fileName = `backups/${company.id}/${now.toISOString().slice(0, 10)}-full-backup.json`;
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });

      const { error: uploadErr } = await sb.storage
        .from('mc-backups')
        .upload(fileName, blob, { upsert: true, contentType: 'application/json' });

      if (uploadErr) {
        console.error(`Backup upload failed for ${company.id}:`, uploadErr);
        results.push({ company_id: company.id, status: 'error', tables: 0 });
        continue;
      }

      // Update last backup timestamp
      await sb
        .from('management_companies')
        .update({
          backup_settings: {
            ...settings,
            last_backup_at: now.toISOString(),
          },
        })
        .eq('id', company.id);

      const tableCount = Object.values(allData).filter(v => Array.isArray(v)).length;
      results.push({ company_id: company.id, status: 'ok', tables: tableCount });
    }

    return new Response(JSON.stringify({
      processed: results.length,
      results,
      ran_at: now.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Scheduled backup error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
