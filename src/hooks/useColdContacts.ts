/**
 * @module useColdContacts
 * @description Contacts that have not been touched in N days, ordered by
 * relationship tier (A first — those are the hot misses we care about most),
 * then by `last_activity_at ASC` so the coldest entries surface first.
 *
 * Powers the BusinessPulse "cold contacts" counter and the
 * `ColdContactsWidget` list on the CRM dashboard.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ColdContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  relationship_tier: 'A' | 'B' | 'C' | null;
  hnw_tier: string | null;
  last_activity_at: string | null;
  /** Convenience: days since `last_activity_at`. NULL last_activity_at → Infinity. */
  days_cold: number;
}

export function useColdContacts(
  companyId: string | undefined,
  /** Cutoff in days. Default 30. */
  daysCold = 30,
  /** Max rows to fetch. Default 100. */
  limit = 100,
) {
  return useQuery({
    queryKey: ['crm-cold-contacts', companyId, daysCold, limit],
    queryFn: async (): Promise<ColdContact[]> => {
      if (!companyId) return [];
      const cutoff = new Date(Date.now() - daysCold * 24 * 60 * 60 * 1000).toISOString();

      // Note: server-side ORDER BY relationship_tier is intentionally avoided
      // so the query works before the `relationship_tier` column migration is
      // applied. Final sort is done client-side below.
      // SELECT '*' so missing `relationship_tier` column (pre-migration) doesn't
      // 400 the query — optional-chain to read it client-side either way.
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`)
        .order('last_activity_at', { ascending: true, nullsFirst: true })
        .limit(limit);

      if (error) throw error;

      const now = Date.now();
      const rows = ((data || []) as unknown as Omit<ColdContact, 'days_cold'>[]).map((c) => ({
        ...c,
        // pre-migration: column missing → undefined; normalise to null.
        relationship_tier: (c.relationship_tier ?? null) as 'A' | 'B' | 'C' | null,
        days_cold: c.last_activity_at
          ? Math.floor((now - new Date(c.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity,
      }));

      // Client-side: tier A → B → C → null, then oldest activity first.
      const tierWeight = (t: 'A' | 'B' | 'C' | null): number =>
        t === 'A' ? 0 : t === 'B' ? 1 : t === 'C' ? 2 : 3;
      return rows.sort((a, b) => {
        const wDiff = tierWeight(a.relationship_tier) - tierWeight(b.relationship_tier);
        if (wDiff !== 0) return wDiff;
        return b.days_cold - a.days_cold; // already infinity-aware
      });
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}

/** Cheap count for the BusinessPulse strip — head-1 limit. */
export function useColdContactsCount(
  companyId: string | undefined,
  daysCold = 30,
) {
  return useQuery({
    queryKey: ['crm-cold-contacts-count', companyId, daysCold],
    queryFn: async (): Promise<number> => {
      if (!companyId) return 0;
      const cutoff = new Date(Date.now() - daysCold * 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('crm_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!companyId,
    staleTime: 60_000,
  });
}
