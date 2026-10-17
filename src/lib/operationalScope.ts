import { z } from 'zod';
import type { QueryClient } from '@tanstack/react-query';

const ids = z.array(z.string().uuid());
export const operationalScopeSchema = z.object({
  activeCompanyId: z.string().uuid().nullable(),
  status: z.enum(['ready', 'legacy', 'not_applicable', 'no_access', 'error']),
  reason: z.string(),
  enforcement: z.enum(['enforced', 'not_enforced']),
  mode: z.enum(['space', 'all_authorized']),
  requestedSpaceId: z.string().uuid().nullable(),
  activeSpaceId: z.string().uuid().nullable(),
  authorizedSpaceIds: ids,
  authorizedPropertyIds: ids,
  unassignedPropertyIds: ids,
  isCompanyOverseer: z.boolean(),
  revision: z.string(),
});
export type ResolvedOperationalScope = z.infer<typeof operationalScopeSchema>;
export type ScopeContext = { userId: string | null; activeCompanyId: string | null };
export const SCOPE_CACHE_PREFIX = 'operational-scope-v1';

/** Use this prefix for future dependent queries. Empty/legacy/error never permits a query. */
export function operationalScopeQueryKey(userId: string | null, scope: ResolvedOperationalScope) {
  return [SCOPE_CACHE_PREFIX, userId, scope.activeCompanyId, scope.status, scope.mode,
    scope.activeSpaceId, scope.revision] as const;
}
export function scopeAllowsProperty(scope: ResolvedOperationalScope, propertyId: string) {
  return scope.status === 'ready' && scope.authorizedPropertyIds.includes(propertyId);
}

function closed(context: ScopeContext, status: ResolvedOperationalScope['status'], reason: string): ResolvedOperationalScope {
  return { activeCompanyId: context.activeCompanyId, status, reason, enforcement: 'not_enforced',
    mode: 'all_authorized', requestedSpaceId: null, activeSpaceId: null,
    authorizedSpaceIds: [], authorizedPropertyIds: [], unassignedPropertyIds: [],
    isCompanyOverseer: false, revision: `${status}:${reason}` };
}

export interface OperationalScopeDependencies {
  read: (companyId: string, requestedSpaceId: string | null, signal: AbortSignal) => Promise<unknown>;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  cache: Pick<QueryClient, 'cancelQueries' | 'removeQueries'>;
}

/** Shadow controller; not mounted in the application. Storage is a preference, not authority. */
export class OperationalScopeResolver {
  private context: ScopeContext = { userId: null, activeCompanyId: null };
  private initialized = false;
  private generation = 0;
  private abort?: AbortController;
  private requested: string | null = null;
  private value = closed(this.context, 'not_applicable', 'no_active_company');

  constructor(private readonly deps: OperationalScopeDependencies) {}
  get snapshot(): ResolvedOperationalScope { return this.value; }
  private preferenceKey(context = this.context) {
    return context.userId && context.activeCompanyId
      ? `${SCOPE_CACHE_PREFIX}:preference:${context.userId}:${context.activeCompanyId}` : null;
  }
  private save(id: string | null, context = this.context) {
    const key = this.preferenceKey(context);
    if (!key) return;
    try {
      if (id) this.deps.storage?.setItem(key, id);
      else this.deps.storage?.removeItem(key);
    } catch { /* Storage is optional; it cannot affect authorization. */ }
  }
  private async evict() {
    const filters = { queryKey: [SCOPE_CACHE_PREFIX] };
    await this.deps.cache.cancelQueries(filters);
    this.deps.cache.removeQueries(filters);
  }
  async setContext(context: ScopeContext): Promise<ResolvedOperationalScope> {
    const changed = context.userId !== this.context.userId || context.activeCompanyId !== this.context.activeCompanyId;
    if (this.initialized && !changed) return this.refresh();
    const initial = !this.initialized;
    this.initialized = true;
    this.generation++; this.abort?.abort();
    this.save(null);
    this.context = { ...context };
    this.requested = null;
    this.value = closed(context, 'not_applicable', 'resolving');
    if (initial) {
      const key = this.preferenceKey();
      try { this.requested = key ? this.deps.storage?.getItem(key) ?? null : null; } catch { /* optional */ }
    } else this.save(null);
    return this.refresh();
  }
  async selectSpace(id: string | null): Promise<ResolvedOperationalScope> {
    this.requested = id;
    this.value = closed(this.context, 'not_applicable', 'resolving');
    return this.refresh();
  }
  async refresh(): Promise<ResolvedOperationalScope> {
    const generation = ++this.generation;
    this.abort?.abort(); this.abort = new AbortController();
    const signal = this.abort.signal;
    const context = { ...this.context };
    const requested = this.requested;
    const previousRevision = this.value.revision;
    // Evict before each revalidation: stale membership/property assignments are not usable.
    this.value = closed(context, 'not_applicable', 'resolving');
    await this.evict();
    if (generation !== this.generation) return this.value;
    if (!context.activeCompanyId) {
      this.value = closed(context, 'not_applicable', 'no_active_company'); return this.value;
    }
    if (!context.userId) {
      this.value = closed(context, 'no_access', 'not_authenticated'); return this.value;
    }
    try {
      if (requested !== null && !z.string().uuid().safeParse(requested).success) throw new Error('Invalid preference');
      const result = operationalScopeSchema.parse(await this.deps.read(context.activeCompanyId, requested, signal));
      if (generation !== this.generation || signal.aborted) return this.value;
      if (result.activeCompanyId !== context.activeCompanyId || result.requestedSpaceId !== requested)
        throw new Error('Scope response context mismatch');
      if (result.status !== 'ready' && (result.authorizedPropertyIds.length || result.authorizedSpaceIds.length))
        throw new Error('Non-ready scope contains access');
      if (result.status === 'ready' && (result.enforcement !== 'enforced'
        || (result.mode === 'space' && (!result.activeSpaceId || !result.authorizedSpaceIds.includes(result.activeSpaceId)))
        || (requested !== null && (result.mode !== 'space' || result.activeSpaceId !== requested))
        || (result.mode === 'all_authorized' && result.activeSpaceId !== null)
        || (result.mode === 'space' && result.unassignedPropertyIds.length > 0)
        || (!result.isCompanyOverseer && result.unassignedPropertyIds.length)))
        throw new Error('Invalid scope contract');
      if (previousRevision !== result.revision) await this.evict();
      if (generation !== this.generation || signal.aborted) return this.value;
      this.value = result;
      if (result.status === 'ready') this.save(result.activeSpaceId);
      else { this.requested = null; this.save(null); }
    } catch {
      if (generation === this.generation && !signal.aborted) {
        this.value = closed(context, 'error', 'scope_resolution_failed');
        this.requested = null; this.save(null);
      }
    }
    return this.value;
  }
  async dispose() {
    this.generation++; this.abort?.abort(); this.save(null);
    this.context = { userId: null, activeCompanyId: null };
    this.value = closed(this.context, 'not_applicable', 'disposed');
    await this.evict();
  }
}