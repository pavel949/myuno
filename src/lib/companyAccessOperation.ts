import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export class StaleCompanyAccessOperation extends Error {
  constructor() { super('Account or company changed. The previous operation was cancelled.'); }
}

/** A UI lifetime, not an identity source. All authorization remains server-bound. */
export class CompanyAccessLifetime {
  private generation = 0;
  private active = true;
  private operations = new Set<AbortController>();
  constructor(readonly actorId: string | undefined, readonly companyId: string | undefined) {}
  get isActive() { return this.active; }
  activate() { this.active = true; }
  invalidate() {
    this.active = false;
    this.generation++;
    for (const controller of this.operations) controller.abort();
    this.operations.clear();
  }
  capture() {
    const generation = this.generation;
    return () => this.active && this.generation === generation;
  }
  begin() {
    const current = this.capture();
    const controller = new AbortController();
    this.operations.add(controller);
    return {
      actorId: this.actorId,
      companyId: this.companyId,
      signal: controller.signal,
      assertCurrent: () => {
        if (!current() || controller.signal.aborted || !this.actorId || !this.companyId) throw new StaleCompanyAccessOperation();
      },
      finish: () => { controller.abort(); this.operations.delete(controller); },
    };
  }
}
export type CompanyAccessLease = ReturnType<CompanyAccessLifetime['begin']>;
export interface BoundCompanyAccessOperation extends CompanyAccessLease { client: SupabaseClient }

/** Freeze the existing Auth token in memory for this operation only. Never use
 * the mutable shared client's credential lookup for a later request dispatch.
 * accessToken mode does not instantiate another persistent Auth session. */
export async function bindCompanyAccessOperation(lease: CompanyAccessLease): Promise<BoundCompanyAccessOperation> {
  lease.assertCurrent();
  const { data, error } = await supabase.auth.getSession();
  lease.assertCurrent();
  const session = data.session;
  if (error || !session?.access_token || session.user.id !== lease.actorId) throw new StaleCompanyAccessOperation();
  const token = session.access_token;
  const verified = await supabase.auth.getUser(token);
  lease.assertCurrent();
  if (verified.error || verified.data.user?.id !== lease.actorId) throw new StaleCompanyAccessOperation();
  const client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    accessToken: async () => { lease.assertCurrent(); return token; },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => {
        lease.assertCurrent();
        return globalThis.fetch(input, { ...init, signal: lease.signal });
      },
    },
  });
  return { ...lease, client };
}
