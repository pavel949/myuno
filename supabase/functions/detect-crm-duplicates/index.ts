import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from '../_shared/auth-guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DuplicateGroup {
  contacts: any[];
  match_reasons: string[];
  confidence: number;
}

function normalizeStr(s: string | null | undefined): string {
  return (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizePhone(p: string | null | undefined): string {
  return (p || '').replace(/[\s\-\(\)\+]/g, '').slice(-9);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth guard: require authenticated user
    const authResult = await requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    
    const { company_id } = await req.json();
    if (!company_id) {
      return new Response(JSON.stringify({ error: 'company_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createServiceClient();
    const { data: contacts, error } = await supabase
      .from('crm_contacts')
      .select('id, first_name, last_name, email, phone, company_name')
      .eq('company_id', company_id)
      .limit(2000);

    if (error) throw error;
    if (!contacts || contacts.length < 2) {
      return new Response(JSON.stringify({ duplicates: [], total: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const duplicates: DuplicateGroup[] = [];
    const matched = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      if (matched.has(contacts[i].id)) continue;

      const group: any[] = [contacts[i]];
      const reasons: string[] = [];
      let maxConf = 0;

      for (let j = i + 1; j < contacts.length; j++) {
        if (matched.has(contacts[j].id)) continue;

        const a = contacts[i];
        const b = contacts[j];
        const matchReasons: string[] = [];
        let conf = 0;

        // Exact email match
        if (a.email && b.email && normalizeStr(a.email) === normalizeStr(b.email)) {
          matchReasons.push('email');
          conf = Math.max(conf, 0.95);
        }

        // Phone match (last 9 digits)
        if (a.phone && b.phone && normalizePhone(a.phone) === normalizePhone(b.phone) && normalizePhone(a.phone).length >= 7) {
          matchReasons.push('phone');
          conf = Math.max(conf, 0.9);
        }

        // Name similarity
        const nameA = normalizeStr(`${a.first_name} ${a.last_name}`);
        const nameB = normalizeStr(`${b.first_name} ${b.last_name}`);
        const nameSim = similarity(nameA, nameB);
        if (nameSim > 0.85 && nameA.length > 3) {
          matchReasons.push('name');
          conf = Math.max(conf, nameSim * 0.8);
        }

        if (matchReasons.length > 0) {
          group.push(b);
          reasons.push(...matchReasons);
          maxConf = Math.max(maxConf, conf);
          matched.add(b.id);
        }
      }

      if (group.length > 1) {
        matched.add(contacts[i].id);
        duplicates.push({
          contacts: group,
          match_reasons: [...new Set(reasons)],
          confidence: Math.round(maxConf * 100),
        });
      }
    }

    return new Response(JSON.stringify({ duplicates, total: duplicates.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
