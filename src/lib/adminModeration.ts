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
export function pendingModeration<T>(query: { eq(column: 'approval_status', value: 'pending'): T }): T {
  return query.eq('approval_status', 'pending');
}

export type ModerationQueue = {
  items: ModerationItem[];
  totals: Record<ModerationType, number | null>;
  errors: ModerationType[];
};

export async function fetchModerationQueue(): Promise<ModerationQueue> {
  const [listings, properties, services, products] = await Promise.all([
    pendingModeration(supabase.from('listings')
      .select('id,name_en,name_ru,created_at,approval_status,vertical,category,provider_id,providers:provider_id(name)', { count: 'exact' }))
      .order('created_at', { ascending: false }).limit(500),
    pendingModeration(supabase.from('properties')
      .select('id,title_en,title_ru,created_at,updated_at,approval_status,property_type', { count: 'exact' }))
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
