import { supabase } from '@/integrations/supabase/client';

export type ModerationType = 'listing' | 'property' | 'service' | 'product';
export type ModerationItem = {
  id: string;
  type: ModerationType;
  name_en: string | null;
  name_ru: string | null;
  created_at: string | null;
  approval_status: string | null;
  updated_at?: string | null;
  provider_name: string | null;
  provider_id: string | null;
  category: string | null;
  vertical: string | null;
};

// Dashboard and queue must count the same explicit moderation state. Inactive
// services/products are a separate catalog view, never inferred to be pending.
// Infer the result from a narrow callback, not by structurally matching Supabase's
// recursive query builder. The selected fields and response stay fully inferred.
export function pendingModeration<T>(apply: (column: 'approval_status', value: 'pending') => T): T {
  return apply('approval_status', 'pending');
}

export type ModerationQueue = {
  items: ModerationItem[];
  totals: Record<ModerationType, number | null>;
  errors: ModerationType[];
};

export const MODERATION_PAGE_SIZE = 50;
export interface ModerationPageOptions { source: ModerationType; page: number; queue: 'pending' | 'inactive' | 'draft'; search?: string; category?: string }

/** Each table owns its page and count. Filters run before range, never after a newest-N cap. */
export async function fetchModerationSourcePage({ source, page, queue, search = '', category = '' }: ModerationPageOptions): Promise<ModerationQueue> {
  if ((queue === 'inactive') !== (source === 'service' || source === 'product')) throw new Error('Invalid moderation source/state');
  const table = source === 'listing' ? 'listings' : source === 'property' ? 'properties' : source === 'service' ? 'services' : 'marketplace_products';
  const columns = source === 'listing' ? 'id,name_en,name_ru,created_at,approval_status,vertical,category,provider_id,providers:provider_id(name)'
    : source === 'property' ? 'id,title_en,title_ru,created_at,updated_at,approval_status,property_type'
    : source === 'service' ? 'id,name_en,name_ru,created_at,approval_status,provider_id,providers:provider_id(name)'
    : 'id,name_en,name_ru,created_at,approval_status,category_slug';
  let query = supabase.from(table).select(columns, { count: 'exact' });
  query = queue === 'inactive' ? query.eq('is_active', false) : query.eq('approval_status', queue);
  if (source === 'property') query = query.is('deleted_at', null);
  if (category && category !== 'all') {
    if (source === 'listing') query = query.eq('vertical', category);
    else if (source === 'property') query = query.eq('property_type', category);
    else if (source === 'product') query = query.eq('category_slug', category);
  }
  // PostgREST boolean grammar is not a text search language. Strip its delimiters
  // and wildcard operators so a query remains a literal name fragment.
  const term = search.trim().replace(/[,%()_*\\"]/g, ' ').trim().slice(0, 120);
  if (term) {
    const names = source === 'property' ? ['title_en', 'title_ru'] : ['name_en', 'name_ru'];
    const clauses = names.map(column => `${column}.ilike.%${term}%`);
    if (/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(term)) clauses.push(`id.eq.${term}`);
    query = query.or(clauses.join(','));
  }
  const offset = Math.max(0, Math.floor(Number.isFinite(page) ? page : 0)) * MODERATION_PAGE_SIZE;
  const result = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + MODERATION_PAGE_SIZE - 1);
  const totals: ModerationQueue['totals'] = { listing: null, property: null, service: null, product: null };
  if (result.error || result.count === null) return { items: [], totals, errors: [source] };
  totals[source] = result.count;
  type Row = { id: string; name_en?: string | null; name_ru?: string | null; title_en?: string | null; title_ru?: string | null; created_at: string | null; updated_at?: string | null; approval_status: string | null; vertical?: string | null; category?: string | null; property_type?: string | null; category_slug?: string | null; provider_id?: string | null; providers?: { name: string | null } | null };
  const items = ((result.data ?? []) as unknown as Row[]).map(row => ({
    id: row.id, type: source, name_en: row.title_en ?? row.name_en ?? null, name_ru: row.title_ru ?? row.name_ru ?? null,
    created_at: row.created_at, updated_at: row.updated_at, approval_status: row.approval_status,
    vertical: row.vertical ?? null, category: row.property_type ?? row.category_slug ?? row.category ?? null,
    provider_id: row.provider_id ?? null, provider_name: row.providers?.name ?? null,
  }));
  return { items, totals, errors: [] };
}

export async function fetchModerationQueue(options?: ModerationPageOptions): Promise<ModerationQueue> {
  if (options) return fetchModerationSourcePage(options);
  const [listings, properties, services, products] = await Promise.all([
    pendingModeration((column, value) => supabase.from('listings')
      .select('id,name_en,name_ru,created_at,approval_status,vertical,category,provider_id,providers:provider_id(name)', { count: 'exact' })
      .eq(column, value))
      .order('created_at', { ascending: false }).limit(500),
    pendingModeration((column, value) => supabase.from('properties')
      .select('id,title_en,title_ru,created_at,updated_at,approval_status,property_type', { count: 'exact' })
      .eq(column, value))
      .is('deleted_at', null).order('created_at', { ascending: false }).limit(500),
    supabase.from('services')
      .select('id,name_en,name_ru,created_at,approval_status,provider_id,providers:provider_id(name)', { count: 'exact' })
      .eq('is_active', false).order('created_at', { ascending: false }).limit(100),
    supabase.from('marketplace_products')
      .select('id,name_en,name_ru,created_at,approval_status,category_slug', { count: 'exact' })
      .eq('is_active', false).order('created_at', { ascending: false }).limit(100),
  ]);
  const items: ModerationItem[] = [];
  const errors: ModerationType[] = [];
  const totals: ModerationQueue['totals'] = { listing: null, property: null, service: null, product: null };
  for (const [type, result] of [['listing', listings], ['property', properties], ['service', services], ['product', products]] as const) {
    if (result.error || result.count === null) errors.push(type);
    else totals[type] = result.count;
  }
  if (!listings.error) for (const row of listings.data ?? []) items.push({
    ...row, type: 'listing', provider_name: row.providers?.name ?? null,
  });
  if (!properties.error) for (const row of properties.data ?? []) items.push({
    id: row.id, type: 'property', name_en: row.title_en, name_ru: row.title_ru,
    created_at: row.created_at, updated_at: row.updated_at, approval_status: row.approval_status,
    category: row.property_type, vertical: null, provider_id: null, provider_name: null,
  });
  if (!services.error) for (const row of services.data ?? []) items.push({
    ...row, type: 'service', category: null, vertical: null, provider_name: row.providers?.name ?? null,
  });
  if (!products.error) for (const row of products.data ?? []) items.push({
    ...row, type: 'product', category: row.category_slug, vertical: null, provider_id: null, provider_name: null,
  });
  items.sort((a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0));
  return { items, totals, errors };
}

// The existing RLS-protected writer remains authoritative. Require its returned
// row so a stale queue entry or zero-row authorization result cannot look saved.
export async function updateModerationItem({ id, type, approve, expectedUpdatedAt }: {
  id: string; type: ModerationType; approve: boolean; expectedUpdatedAt?: string | null;
}) {
  if (type === 'property' && !expectedUpdatedAt) throw new Error('Property revision is unavailable; reload before review');
  const pending = type === 'listing' || type === 'property';
  const table = type === 'listing' ? 'listings' : type === 'property' ? 'properties'
    : type === 'service' ? 'services' : 'marketplace_products';
  const approval = approve ? 'approved' : 'rejected';
  let query = supabase.from(table)
    .update(pending ? { approval_status: approval, is_active: approve } : { is_active: approve })
    .eq('id', id);
  query = pending ? query.eq('approval_status', 'pending') : query.eq('is_active', false);
  if (type === 'property') query = query.eq('updated_at', expectedUpdatedAt!).is('deleted_at', null);
  const { data, error } = await query.select('id,approval_status,is_active').single();
  if (error) throw error;
  if (!data || data.id !== id || data.is_active !== approve || (pending && data.approval_status !== approval)) {
    throw new Error('Moderation change was not confirmed');
  }
  return data;
}
