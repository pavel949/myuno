/**
 * @module getOrCreateContactByEmail
 * Idempotent contact creation guarded by the partial UNIQUE index
 * `crm_contacts_email_unique_lower` on `lower(email)`.
 *
 * Flow:
 *  1. If email is empty/null — plain insert.
 *  2. Else: SELECT by ilike(email). If found → return existing row (no insert).
 *  3. Else: INSERT. If 23505 (race condition with another tab) → SELECT again.
 *
 * The DB trigger `crm_contacts_normalize_email_trg` lowercases/trims email
 * on every write, so we never need to do it client-side.
 */
import { supabase } from '@/integrations/supabase/client';

export interface GetOrCreateContactResult<T = Record<string, unknown>> {
  contact: T;
  existed: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContactPayload = Record<string, any>;

export async function getOrCreateContactByEmail<T = ContactPayload>(
  payload: ContactPayload,
): Promise<GetOrCreateContactResult<T>> {
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : null;

  // Try lookup first when we have an email
  if (email) {
    const { data: existing, error: lookupErr } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (lookupErr && lookupErr.code !== 'PGRST116') throw lookupErr;
    if (existing) return { contact: existing as T, existed: true };
  }

  // Insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('crm_contacts') as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Race-condition: another tab inserted the same email between our SELECT and INSERT
    if (error.code === '23505' && email) {
      const { data: raced, error: rErr } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (rErr) throw rErr;
      if (raced) return { contact: raced as T, existed: true };
    }
    throw error;
  }

  return { contact: data as T, existed: false };
}
