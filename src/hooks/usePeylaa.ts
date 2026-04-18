/**
 * PEYLAA Data Hooks — backed by the primary Supabase DB (project_units / property_projects / nb_leads).
 *
 * Migrated from a separate Supabase project (legacy `peylaaDb`) to the canonical
 * `property_projects` row (slug=`peylaa-phuket-marriott`). Keeps the same
 * PeylaaUnit / PeylaaLead public shape so existing /peylaa pages don't change.
 *
 * Lead writes go through the standard newbuilds attribution + nb_leads pipeline.
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { recordAttribution } from '@/lib/newbuilds/attribution';
import type {
  PeylaaUnit,
  PeylaaLead,
  PeylaaAmenity,
  PeylaaProjectInfo,
  UnitStats,
  UnitFilters,
} from '@/lib/peylaa/types';

/** Canonical project row id for PEYLAA (Marriott Autograph Collection). */
export const PEYLAA_PROJECT_ID = '07652f9c-5bf5-4a7d-89e7-1c0ccf86fcd4';
export const PEYLAA_PROJECT_SLUG = 'peylaa-phuket-marriott';

// ── Helpers ───────────────────────────────────────────────────────────────

interface ProjectUnitRow {
  id: string;
  unit_code: string | null;
  bedrooms: number | null;
  area_sqm: number | string | null;
  price_thb: number | string | null;
  price: number | string | null;
  price_per_sqm: number | string | null;
  status: string | null;
  unit_status: string | null;
  view_type: string | null;
  floor: number | null;
  floor_number: number | null;
  floor_plan_url: string | null;
  unit_type: string | null;
}

function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === 'string' ? Number(v) : v;
}

function deriveBuilding(code: string): 'A' | 'B' | 'C' {
  const ch = code.charAt(0).toUpperCase();
  if (ch === 'A' || ch === 'B' || ch === 'C') return ch;
  return 'A';
}

function deriveRoomType(bedrooms: number, area: number): PeylaaUnit['room_type'] {
  if (bedrooms >= 3) return '3BR';
  if (bedrooms === 2) return area >= 100 ? '2BR-Corner' : '2BR-Middle';
  return '1BR';
}

function mapUnit(row: ProjectUnitRow): PeylaaUnit {
  const code = row.unit_code ?? '—';
  const area = num(row.area_sqm);
  const price = num(row.price_thb) || num(row.price);
  const bedrooms = row.bedrooms ?? 1;
  const status = (row.status ?? row.unit_status ?? 'available') as PeylaaUnit['status'];
  const floor = row.floor ?? row.floor_number ?? 1;
  return {
    id: row.id,
    unit_no: code,
    building: deriveBuilding(code),
    floor,
    type_code: row.unit_type ?? `${bedrooms}BR`,
    bedrooms,
    room_type: deriveRoomType(bedrooms, area),
    view: row.view_type ?? '—',
    area_sqm: area,
    price_per_sqm: row.price_per_sqm
      ? num(row.price_per_sqm)
      : (price && area ? Math.round(price / area) : null),
    asking_price_thb: price || null,
    asking_price_usd: price ? Math.round(price / 35) : null,
    status,
    reservation_fee_thb: null,
    floor_plan_url: row.floor_plan_url,
    gallery_urls: null,
    is_featured: false,
    is_best_value: false,
    sort_order: 0,
  };
}

// ── Project Info ──────────────────────────────────────────────────────────

export function usePeylaaProject() {
  return useQuery({
    queryKey: ['peylaa', 'project'],
    queryFn: async (): Promise<PeylaaProjectInfo> => {
      const { data, error } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru, developer_name, address, lat, lng, total_units, completion_date')
        .eq('id', PEYLAA_PROJECT_ID)
        .maybeSingle();
      if (error) throw error;

      return {
        id: data?.id ?? PEYLAA_PROJECT_ID,
        name: data?.name_en ?? 'PEYLAA Phuket',
        name_ru: data?.name_ru ?? 'PEYLAA Пхукет',
        developer: data?.developer_name ?? 'Capstone Asset',
        brand: 'Marriott Autograph Collection',
        location: data?.address ?? 'Bang Tao, Phuket',
        location_ru: 'Банг Тао, Пхукет',
        latitude: Number(data?.lat ?? 7.9523),
        longitude: Number(data?.lng ?? 98.2821),
        total_units: data?.total_units ?? 50,
        buildings: 2,
        floors: 7,
        construction_start: '2024-01-01',
        completion_date: data?.completion_date ?? '2027-08-01',
        sinking_fund_per_sqm: 600,
        cam_fee_year1_per_sqm: 120,
        transfer_fee_pct: 1,
        financing_available: true,
        financing_provider: 'MBK / Bangkok Bank',
        financing_max_ltv: 50,
        financing_max_years: 15,
        financing_rate: '6.5–7.5%',
      };
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Units with filters ────────────────────────────────────────────────────

export function usePeylaaUnits(filters?: UnitFilters) {
  return useQuery({
    queryKey: ['peylaa', 'units', filters],
    queryFn: async (): Promise<PeylaaUnit[]> => {
      let query = supabase
        .from('project_units')
        .select('id, unit_code, bedrooms, area_sqm, price_thb, price, price_per_sqm, status, unit_status, view_type, floor, floor_number, floor_plan_url, unit_type')
        .eq('project_id', PEYLAA_PROJECT_ID);

      if (filters?.bedrooms?.length) query = query.in('bedrooms', filters.bedrooms);
      if (filters?.priceMin) query = query.gte('price_thb', filters.priceMin);
      if (filters?.priceMax) query = query.lte('price_thb', filters.priceMax);
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', 'available');
      }

      const { data, error } = await query;
      if (error) throw error;

      let units = ((data ?? []) as ProjectUnitRow[]).map(mapUnit);

      if (filters?.buildings?.length) units = units.filter(u => filters.buildings!.includes(u.building));
      if (filters?.floors?.length) units = units.filter(u => filters.floors!.includes(u.floor));
      if (filters?.views?.length) units = units.filter(u => filters.views!.includes(u.view));

      return units.sort((a, b) => (a.asking_price_thb ?? 0) - (b.asking_price_thb ?? 0));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Single unit ───────────────────────────────────────────────────────────

export function usePeylaaUnit(unitNo: string) {
  return useQuery({
    queryKey: ['peylaa', 'unit', unitNo],
    queryFn: async (): Promise<PeylaaUnit | null> => {
      const { data, error } = await supabase
        .from('project_units')
        .select('id, unit_code, bedrooms, area_sqm, price_thb, price, price_per_sqm, status, unit_status, view_type, floor, floor_number, floor_plan_url, unit_type')
        .eq('project_id', PEYLAA_PROJECT_ID)
        .eq('unit_code', unitNo)
        .maybeSingle();
      if (error) throw error;
      return data ? mapUnit(data as ProjectUnitRow) : null;
    },
    enabled: !!unitNo,
  });
}

// ── Unit stats (computed client-side) ─────────────────────────────────────

export function usePeylaaStats() {
  return useQuery({
    queryKey: ['peylaa', 'stats'],
    queryFn: async (): Promise<UnitStats[]> => {
      const { data, error } = await supabase
        .from('project_units')
        .select('id, unit_code, bedrooms, area_sqm, price_thb, status')
        .eq('project_id', PEYLAA_PROJECT_ID);
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        unit_code: string | null; bedrooms: number | null;
        area_sqm: number | string | null; price_thb: number | string | null;
        status: string | null;
      }>;

      const groups = new Map<string, UnitStats>();
      for (const r of rows) {
        const code = r.unit_code ?? '';
        const ch = code.charAt(0).toUpperCase();
        const buildingKey = (['A', 'B', 'C'].includes(ch) ? ch : 'A');
        const bedrooms = r.bedrooms ?? 1;
        const key = `${buildingKey}|${bedrooms}`;
        const price = num(r.price_thb);
        const area = num(r.area_sqm);
        const status = r.status ?? 'available';

        let g = groups.get(key);
        if (!g) {
          g = {
            building: buildingKey, bedrooms, total: 0, available: 0, reserved: 0, sold: 0,
            min_price: null, max_price: null, avg_price: null, min_area: area, max_area: area,
          };
          groups.set(key, g);
        }
        g.total++;
        if (status === 'available') g.available++;
        else if (status === 'reserved') g.reserved++;
        else if (status === 'sold') g.sold++;
        if (price) {
          g.min_price = g.min_price === null ? price : Math.min(g.min_price, price);
          g.max_price = g.max_price === null ? price : Math.max(g.max_price, price);
          g.avg_price = g.avg_price === null ? price : Math.round((g.avg_price + price) / 2);
        }
        g.min_area = Math.min(g.min_area, area);
        g.max_area = Math.max(g.max_area, area);
      }
      return Array.from(groups.values());
    },
    staleTime: 1000 * 60 * 10,
  });
}

// ── Amenities (static fallback until imported) ────────────────────────────

const FALLBACK_AMENITIES: PeylaaAmenity[] = [
  { id: '1', category: 'active_lifestyle', name: 'Infinity pool', name_ru: 'Бассейн с панорамой', description: null, description_ru: null, icon: 'waves', sort_order: 1, is_phase2: false },
  { id: '2', category: 'active_lifestyle', name: 'Fitness center', name_ru: 'Фитнес-центр', description: null, description_ru: null, icon: 'dumbbell', sort_order: 2, is_phase2: false },
  { id: '3', category: 'community', name: 'Co-working lounge', name_ru: 'Коворкинг', description: null, description_ru: null, icon: 'briefcase', sort_order: 3, is_phase2: false },
  { id: '4', category: 'resident_services', name: '24/7 concierge', name_ru: 'Консьерж 24/7', description: null, description_ru: null, icon: 'bell', sort_order: 4, is_phase2: false },
  { id: '5', category: 'resident_services', name: 'Property management', name_ru: 'Управление недвижимостью', description: null, description_ru: null, icon: 'shield', sort_order: 5, is_phase2: false },
  { id: '6', category: 'premium', name: 'Marriott Autograph branding', name_ru: 'Бренд Marriott Autograph', description: null, description_ru: null, icon: 'star', sort_order: 6, is_phase2: false },
];

export function usePeylaaAmenities() {
  return useQuery({
    queryKey: ['peylaa', 'amenities'],
    queryFn: async (): Promise<PeylaaAmenity[]> => FALLBACK_AMENITIES,
    staleTime: 1000 * 60 * 60,
  });
}

// ── Gallery ───────────────────────────────────────────────────────────────

export function usePeylaaGallery(category?: string) {
  return useQuery({
    queryKey: ['peylaa', 'gallery', category],
    queryFn: async () => {
      const { data: project } = await supabase
        .from('property_projects')
        .select('images, cover_image_url, og_image_url')
        .eq('id', PEYLAA_PROJECT_ID)
        .maybeSingle();
      const urls = [
        ...((project?.images as string[] | null) ?? []),
        project?.cover_image_url,
        project?.og_image_url,
      ].filter(Boolean) as string[];
      return urls.map((url, i) => ({
        id: `g-${i}`,
        url,
        category: category ?? 'general',
        sort_order: i,
        is_hero: i === 0,
        title: 'PEYLAA Phuket',
        title_ru: 'PEYLAA Пхукет',
      }));
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Available views (derived) ─────────────────────────────────────────────

export function usePeylaaViews() {
  return useQuery({
    queryKey: ['peylaa', 'views'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('project_units')
        .select('view_type')
        .eq('project_id', PEYLAA_PROJECT_ID)
        .eq('status', 'available');
      if (error) throw error;
      const views = [
        ...new Set(
          ((data ?? []) as Array<{ view_type: string | null }>)
            .map(d => d.view_type)
            .filter(Boolean) as string[],
        ),
      ].sort();
      return views;
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Submit Lead — standard newbuilds pipeline ─────────────────────────────

export function useSubmitPeylaaLead() {
  return useMutation({
    mutationFn: async (lead: PeylaaLead) => {
      const bedroomPref = lead.preferred_bedrooms?.length
        ? `${lead.preferred_bedrooms.join(',')} BR`
        : null;

      // 1. Attribution + RLN (best-effort, must not block lead capture)
      let attributionId: string | null = null;
      try {
        const result = await recordAttribution({
          email: lead.email,
          phone: lead.phone,
          projectId: PEYLAA_PROJECT_ID,
          touchpoint: { type: 'form_submit', source: lead.source_channel, projectId: PEYLAA_PROJECT_ID },
          utmSource: lead.utm_source,
          utmMedium: lead.utm_medium,
          utmCampaign: lead.utm_campaign,
        });
        attributionId = result.attributionId;
      } catch { /* non-blocking */ }

      // 2. Standard nb_leads insert (canonical CRM destination)
      const message = [
        lead.purchase_purpose && `Цель: ${lead.purchase_purpose}`,
        lead.purchase_timeline && `Сроки: ${lead.purchase_timeline}`,
        lead.notes,
      ].filter(Boolean).join('. ') || null;

      const { data, error } = await (supabase.from('nb_leads' as any) as any).insert({
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email || null,
        whatsapp: lead.whatsapp || lead.phone || null,
        project_id: PEYLAA_PROJECT_ID,
        source: `peylaa_${lead.source_channel || 'landing'}`,
        unit_preference: bedroomPref,
        message,
        attribution_id: attributionId,
        status: 'new',
        score: 0,
      }).select().maybeSingle();

      if (error) throw error;

      // 3. Notify (fire-and-forget)
      supabase.functions.invoke('peylaa-lead-notify', { body: data }).catch(() => {});

      return data;
    },
  });
}

// ── Track Page View ───────────────────────────────────────────────────────

export function useTrackPageView() {
  return useMutation({
    mutationFn: async (view: {
      page: string; unit_id?: string; session_id?: string;
      utm_source?: string; utm_medium?: string; utm_campaign?: string;
    }) => {
      try {
        await supabase.from('analytics_events').insert({
          event_name: 'peylaa_page_view',
          page_path: view.page,
          session_id: view.session_id ?? null,
          event_data: {
            project_id: PEYLAA_PROJECT_ID,
            project_slug: PEYLAA_PROJECT_SLUG,
            unit_id: view.unit_id,
            utm_source: view.utm_source,
            utm_medium: view.utm_medium,
            utm_campaign: view.utm_campaign,
            device: typeof window !== 'undefined'
              ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
              : 'unknown',
          },
        } as any);
      } catch { /* non-blocking */ }
    },
  });
}

// ── Format helpers ────────────────────────────────────────────────────────

export function formatThb(amount: number | null): string {
  if (!amount) return '—';
  if (amount >= 1_000_000) return `฿${(amount / 1_000_000).toFixed(1)}M`;
  return `฿${amount.toLocaleString()}`;
}

export function formatUsd(thb: number | null): string {
  if (!thb) return '—';
  const usd = Math.round(thb / 35);
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  return `$${usd.toLocaleString()}`;
}
