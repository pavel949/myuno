import { supabase } from '@/integrations/supabase/client';

/**
 * Public property reads go through the allowlisted `public_property_catalog`
 * projection. The base `properties` table is only read for object-authorized
 * PMS access (owner, provider, assigned manager, company staff, admin); RLS
 * returns no row for anyone else, so the fallback can never widen access.
 */
export const PUBLIC_PROPERTY_CATALOG = 'public_property_catalog' as const;

export async function selectPropertyCatalogFirst(id: string, columns: string): Promise<Record<string, unknown> | null> {
  const pub = await supabase.from(PUBLIC_PROPERTY_CATALOG).select(columns).eq('id', id).maybeSingle();
  if (pub.error) throw pub.error;
  if (pub.data) return pub.data as unknown as Record<string, unknown>;

  // Not in the public catalog (draft, pending, inactive): authorized PMS preview only.
  const own = await supabase.from('properties').select(columns).eq('id', id).maybeSingle();
  if (own.error) {
    if (own.error.code === 'PGRST116' || own.error.code === '42501') return null;
    throw own.error;
  }
  return (own.data as unknown as Record<string, unknown>) ?? null;
}
