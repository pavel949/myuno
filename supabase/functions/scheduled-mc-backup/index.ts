import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Exact totals prevent an API row cap from masquerading as end-of-data.
// A stable ID order makes range boundaries deterministic for unchanged data.
type BackupPage<T> = { data: T[] | null; error: unknown; count: number | null };
type BackupQuery<T> = { range(from: number, to: number): PromiseLike<BackupPage<T>> };
async function readAll<T>(buildQuery: () => BackupQuery<T>) {
  const data: T[] = [];
  let expected: number | null = null;
  while (true) {
    const page = await buildQuery().range(data.length, data.length + 499);
    if (page.error) return { data: null, error: page.error };
    if (!Array.isArray(page.data) || !Number.isInteger(page.count) || page.count === null || page.count < 0
      || (expected !== null && page.count !== expected)) {
      return { data: null, error: new Error('Backup source count unavailable or changed') };
    }
    expected = page.count;
    if (page.data.length === 0 && data.length < expected) {
      return { data: null, error: new Error('Backup source ended before its exact total') };
    }
    data.push(...page.data);
    if (data.length === expected) return { data, error: null };
    if (data.length > expected) return { data: null, error: new Error('Backup source exceeded its exact total') };
  }
}

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
    const { data: companies, error: compErr } = await readAll(() => sb
      .from('management_companies')
      .select('id, name_en, backup_settings', { count: 'exact' })
      .not('backup_settings', 'is', null).order('id'));

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

      const [props, contacts, deals, reports] = await Promise.all([
        readAll(() => sb.from('properties').select('*', { count: 'exact' }).eq('management_company_id', company.id).order('id')),
        readAll(() => sb.from('crm_contacts').select('*', { count: 'exact' }).eq('company_id', company.id).order('id')),
        readAll(() => sb.from('agent_deals').select('*', { count: 'exact' }).eq('company_id', company.id).order('id')),
        readAll(() => sb.from('owner_reports').select('*', { count: 'exact' }).eq('company_id', company.id).order('id')),
      ]);

      // A missing relation or denied query is not an empty dataset. Never publish
      // a partial backup or advance its success timestamp.
      if ([props, contacts, deals, reports].some(result => result.error)) {
        console.error(`Backup collection failed for ${company.id}`);
        results.push({ company_id: company.id, status: 'error', tables: 0 });
        continue;
      }

      // Finance: pulled from property_financials via this company's properties
      // (mc_finance_transactions does not exist — financial data lives per-property).
      const propertyIds = (props.data || []).map((p: { id: string }) => p.id);
      let financeRows: unknown[] = [];
      if (propertyIds.length > 0) {
        const { data: txs, error: financeError } = await readAll(() => sb
          .from('property_financials')
          .select('*', { count: 'exact' })
          .in('property_id', propertyIds)
          .order('transaction_date', { ascending: false }).order('id'));
        if (financeError) {
          console.error(`Backup finance collection failed for ${company.id}`);
          results.push({ company_id: company.id, status: 'error', tables: 0 });
          continue;
        }
        financeRows = txs || [];
      }

      allData.properties = props.data || [];
      allData.crm_contacts = contacts.data || [];
      allData.crm_deals = deals.data || [];
      allData.finance_transactions = financeRows;
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
      const { error: timestampError } = await sb
        .from('management_companies')
        .update({
          backup_settings: {
            ...settings,
            last_backup_at: now.toISOString(),
          },
        })
        .eq('id', company.id);

      if (timestampError) {
        console.error(`Backup timestamp update failed for ${company.id}`);
        results.push({ company_id: company.id, status: 'error', tables: 0 });
        continue;
      }

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

