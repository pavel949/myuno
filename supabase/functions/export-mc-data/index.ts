import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { AccessDenied, authorizeRpc, authorizedService, createActorClient } from '../_shared/operating-space-auth.ts';

const ExportInput = z.object({ company_id: z.string().uuid(), export_type: z.enum(['all','properties','crm','finance','reports']), format: z.enum(['json','csv']).default('json') }).strict();

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
    const parsed = ExportInput.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing company_id or export_type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { company_id, export_type, format } = parsed.data;
    const actorClient = createActorClient(req);
    const sb = await authorizedService(
      () => authorizeRpc(actorClient, 'actor_can_export_company', { p_company_id: company_id }), createServiceClient);

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
          // Source: property_financials filtered via properties.management_company_id
          // (mc_finance_transactions does not exist — financial data lives per-property).
          const { data: companyProps } = await sb
            .from('properties')
            .select('id')
            .eq('management_company_id', company_id);
          const propertyIds = (companyProps || []).map((p: { id: string }) => p.id);
          if (propertyIds.length > 0) {
            const { data: transactions } = await sb
              .from('property_financials')
              .select('*')
              .in('property_id', propertyIds)
              .order('transaction_date', { ascending: false });
            result.finance_transactions = transactions || [];
          } else {
            result.finance_transactions = [];
          }
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
    return new Response(JSON.stringify({ error: err instanceof AccessDenied ? 'Forbidden' : 'Export unavailable' }), {
      status: err instanceof AccessDenied ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
