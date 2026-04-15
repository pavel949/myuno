/**
 * PEYLAA Data Hooks
 * Fetches from separate PEYLAA Supabase project
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { peylaaDb } from '@/lib/peylaa/supabaseClient';
import { supabase } from '@/integrations/supabase/client';
import type { PeylaaUnit, PeylaaLead, PeylaaAmenity, PeylaaProjectInfo, UnitStats, UnitFilters } from '@/lib/peylaa/types';

// ── Project Info ──
export function usePeylaaProject() {
  return useQuery({
    queryKey: ['peylaa', 'project'],
    queryFn: async () => {
      const { data, error } = await peylaaDb
        .from('project_info')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as PeylaaProjectInfo;
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
}

// ── Units with filters ──
export function usePeylaaUnits(filters?: UnitFilters) {
  return useQuery({
    queryKey: ['peylaa', 'units', filters],
    queryFn: async () => {
      let query = peylaaDb
        .from('units')
        .select('*')
        .order('sort_order', { ascending: true });

      if (filters?.bedrooms?.length) {
        query = query.in('bedrooms', filters.bedrooms);
      }
      if (filters?.buildings?.length) {
        query = query.in('building', filters.buildings);
      }
      if (filters?.floors?.length) {
        query = query.in('floor', filters.floors);
      }
      if (filters?.views?.length) {
        query = query.in('view', filters.views);
      }
      if (filters?.priceMin) {
        query = query.gte('asking_price_thb', filters.priceMin);
      }
      if (filters?.priceMax) {
        query = query.lte('asking_price_thb', filters.priceMax);
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      } else {
        // Default: show available only
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PeylaaUnit[];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

// ── Single unit ──
export function usePeylaaUnit(unitNo: string) {
  return useQuery({
    queryKey: ['peylaa', 'unit', unitNo],
    queryFn: async () => {
      const { data, error } = await peylaaDb
        .from('units')
        .select('*')
        .eq('unit_no', unitNo)
        .single();
      if (error) throw error;
      return data as PeylaaUnit;
    },
    enabled: !!unitNo,
  });
}

// ── Unit stats ──
export function usePeylaaStats() {
  return useQuery({
    queryKey: ['peylaa', 'stats'],
    queryFn: async () => {
      const { data, error } = await peylaaDb
        .from('unit_stats')
        .select('*');
      if (error) throw error;
      return data as UnitStats[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ── Amenities ──
export function usePeylaaAmenities() {
  return useQuery({
    queryKey: ['peylaa', 'amenities'],
    queryFn: async () => {
      const { data, error } = await peylaaDb
        .from('amenities')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as PeylaaAmenity[];
    },
    staleTime: 1000 * 60 * 60, // 1hr cache
  });
}

// ── Gallery ──
export function usePeylaaGallery(category?: string) {
  return useQuery({
    queryKey: ['peylaa', 'gallery', category],
    queryFn: async () => {
      let query = peylaaDb
        .from('gallery')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Available views (for filter dropdown) ──
export function usePeylaaViews() {
  return useQuery({
    queryKey: ['peylaa', 'views'],
    queryFn: async () => {
      const { data, error } = await peylaaDb
        .from('units')
        .select('view')
        .eq('status', 'available');
      if (error) throw error;
      const views = [...new Set((data || []).map(d => d.view))].sort();
      return views;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Submit Lead ──
// Dual-write: PEYLAA Supabase (analytics) + myUNO nb_leads (admin CRM)
export function useSubmitPeylaaLead() {
  return useMutation({
    mutationFn: async (lead: PeylaaLead) => {
      // 1. Write to PEYLAA Supabase (primary)
      const { data, error } = await peylaaDb
        .from('leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;

      // 2. Mirror to myUNO nb_leads for admin CRM visibility (fire-and-forget)
      const bedroomPref = lead.preferred_bedrooms?.length
        ? `${lead.preferred_bedrooms.join(',')} BR`
        : null;
      supabase
        .from('nb_leads' as any)
        .insert({
          full_name: lead.full_name,
          phone: lead.phone,
          email: lead.email || null,
          whatsapp: lead.phone,
          source: `peylaa_${lead.source_channel || 'landing'}`,
          score: 0,
          status: 'new',
          unit_preference: bedroomPref,
          message: [
            lead.purchase_purpose && `Цель: ${lead.purchase_purpose}`,
            lead.purchase_timeline && `Сроки: ${lead.purchase_timeline}`,
            lead.notes,
          ].filter(Boolean).join('. ') || null,
          budget_min: 7100000, // PEYLAA min price
        } as any);
      } catch { /* non-blocking */ }

      // 3. Also create consultation_request for universal CRM pipeline
      try {
        await supabase
          .from('consultation_requests')
          .insert({
            name: lead.full_name,
            phone: lead.phone,
            email: lead.email || '',
            request_type: 'property_purchase',
            vertical_id: 'real_estate',
            entry_point: 'peylaa_landing',
            lead_source: lead.source_channel || 'peylaa_landing',
            preferred_language: 'ru',
            preferred_contact_method: 'whatsapp',
            purpose: lead.purchase_purpose || 'investment',
            status: 'pending',
            priority: lead.purchase_timeline === 'immediate' ? 'high' : 'medium',
            notes: `PEYLAA Phuket | ${bedroomPref || 'не указано'} | ${lead.purchase_timeline || 'не указано'}`,
            vertical_metadata: {
              project: 'PEYLAA Phuket — Autograph Collection',
              bedrooms: lead.preferred_bedrooms,
              timeline: lead.purchase_timeline,
              purpose: lead.purchase_purpose,
              utm_source: lead.utm_source,
              utm_medium: lead.utm_medium,
              utm_campaign: lead.utm_campaign,
            },
          } as any);
      } catch { /* non-blocking */ }

      // 4. Fire-and-forget: WhatsApp notification
      fetch('https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/peylaa-lead-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});

      return data;
    },
  });
}

// ── Track Page View ──
export function useTrackPageView() {
  return useMutation({
    mutationFn: async (view: {
      page: string;
      unit_id?: string;
      session_id?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }) => {
      const { error } = await peylaaDb
        .from('page_views')
        .insert({
          ...view,
          device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        });
      if (error) console.error('Page view tracking error:', error);
    },
  });
}

// ── Format helpers ──
export function formatThb(amount: number | null): string {
  if (!amount) return '—';
  if (amount >= 1_000_000) {
    return `฿${(amount / 1_000_000).toFixed(1)}M`;
  }
  return `฿${amount.toLocaleString()}`;
}

export function formatUsd(thb: number | null): string {
  if (!thb) return '—';
  const usd = Math.round(thb / 35);
  if (usd >= 1_000_000) {
    return `$${(usd / 1_000_000).toFixed(1)}M`;
  }
  return `$${usd.toLocaleString()}`;
}
