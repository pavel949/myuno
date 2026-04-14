import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/** Convert array of objects to CSV string */
function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ];
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const userId = authResult.user.id;

    const { company_id, export_type, format = 'json' } = await req.json();

    if (!company_id || !export_type) {
      return new Response(JSON.stringify({ error: 'Missing company_id or export_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createServiceClient();

    // Verify membership with director/admin role
    const { data: membership } = await sb
      .from('management_company_members')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', company_id)
      .eq('is_active', true)
      .single();

    if (!membership || !['director', 'admin', 'manager'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: director, admin or manager role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      company_id,
      export_type,
    };

    const types = export_type === 'all' ? ['properties', 'crm', 'finance', 'reports'] : [export_type];

    for (const t of types) {
      switch (t) {
        case 'properties': {
          const { data } = await sb.from('properties').select('*').eq('management_company_id', company_id);
          result.properties = data || [];
          break;
        }
        case 'crm': {
          const { data: contacts } = await sb.from('crm_contacts').select('*').eq('company_id', company_id);
          const { data: deals } = await sb.from('agent_deals').select('*').eq('company_id', company_id);
          result.crm_contacts = contacts || [];
          result.crm_deals = deals || [];
          break;
        }
        case 'finance': {
          const { data: transactions } = await sb.from('mc_finance_transactions').select('*').eq('company_id', company_id);
          result.finance_transactions = transactions || [];
          break;
        }
        case 'reports': {
          const { data: reports } = await sb.from('owner_reports').select('*').eq('company_id', company_id);
          result.reports = reports || [];
          break;
        }
      }
    }

    // Return CSV if requested
    if (format === 'csv') {
      // For CSV, merge all arrays into separate sections
      const csvParts: string[] = [];
      for (const [key, value] of Object.entries(result)) {
        if (Array.isArray(value) && value.length > 0) {
          csvParts.push(`## ${key}`);
          csvParts.push(toCsv(value as Record<string, unknown>[]));
          csvParts.push('');
        }
      }
      const csvContent = csvParts.length > 0
        ? csvParts.join('\n')
        : 'No data to export';

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${export_type}-backup-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
