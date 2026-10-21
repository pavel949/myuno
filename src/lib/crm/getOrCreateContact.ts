/**
 * @module getOrCreateContactByEmail
 * Idempotent, multi-tenant contact creation guarded by the partial UNIQUE index
 * `crm_contacts_company_email_unique_lower` on `(company_id, lower(email))`.
 *
 * Email uniqueness is scoped PER company_id: two different management companies
 * can each have a client with the same email. The dedupe lookup below mirrors the
 * index by always scoping on the payload's company_id (or `company_id IS NULL` for
 * company-less / public-form contacts), so we never return another tenant's row.
 *
 * Flow:
 *  1. If email is empty/null — plain insert.
 *  2. Else: SELECT by email within the same company scope. If found → return it.
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
  const companyId = (payload.company_id as string | null | undefined) ?? null;

  // Scope the dedupe lookup to the same company as the index (company_id, lower(email)):
  // match the payload's company_id, or `company_id IS NULL` for company-less contacts.
  const lookupByEmail = (emailValue: string) => {
    const base = supabase.from('crm_contacts').select('*').eq('email', emailValue);
    return (companyId ? base.eq('company_id', companyId) : base.is('company_id', null)).maybeSingle();
  };

  // Try lookup first when we have an email
  if (email) {
    const { data: existing, error: lookupErr } = await lookupByEmail(email);

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
      const { data: raced, error: rErr } = await lookupByEmail(email);
      if (rErr) throw rErr;
      if (raced) return { contact: raced as T, existed: true };
    }
    throw error;
  }

  return { contact: data as T, existed: false };
}
