type CreateKind = 'property' | 'complex';
interface CreateScope { kind: CreateKind; actorId: string; companyId: string; spaceId: string }
const prefix = 'myuno:mc-authoring-create:v1:';
const keyFor = (scope: CreateScope) => prefix + JSON.stringify([scope.kind, scope.actorId, scope.companyId, scope.spaceId]);
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonical(item)]));
  return value;
}

/** Session-only retry metadata, not property content or authorization. A lost
 * response must keep the same key across remount/reload and must not silently
 * turn changed form content into a second initial creation. */
export class AuthoringCreationResumeRequired extends Error {
  constructor(readonly draft: { id: string; updated_at?: string }) {
    super('A previous creation request was saved. Reopen its draft before changing the initial content.');
  }
}

export async function authoringCreateRequestId(scope: CreateScope, input: unknown, resolveExisting?: (requestId: string) => Promise<{ id: string; updated_at?: string } | null>): Promise<string> {
  if (!scope.actorId || !scope.companyId || !scope.spaceId) throw new Error('Verified actor, company and Operating Space required');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(canonical(input))));
  const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const key = keyFor(scope);
  // Read after hashing, so simultaneous requests in this browser cannot both
  // allocate keys before either has persisted its intent.
  const existing = sessionStorage.getItem(key);
  if (existing) {
    const stored = JSON.parse(existing) as { requestId?: string; fingerprint?: string };
    if (!stored.requestId || stored.fingerprint !== fingerprint) {
      if (stored.requestId && resolveExisting) {
        const draft = await resolveExisting(stored.requestId);
        if (draft) { confirmAuthoringCreateIntent(scope, draft.id); throw new AuthoringCreationResumeRequired(draft); }
        // A changed request may reuse the SAME identity: whichever HTTP wins
        // the server lock owns that identity; any other payload conflicts.
        // Keep the original fingerprint so later retries resolve the winner.
        return stored.requestId;
      }
      // Without a checked resolver there is no verified recovery path.
      throw new Error('A previous creation request may have succeeded. Retry its original content. Reopen its draft before changing the initial content.');
    }
    return stored.requestId;
  }
  const requestId = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ requestId, fingerprint }));
  return requestId;
}

/** Call only for an explicit new intent after the prior result is known. */
export function clearAuthoringCreateIntent(scope: CreateScope): void {
  const key = keyFor(scope);
  if (JSON.parse(sessionStorage.getItem(key) || '{}').resolvedId) sessionStorage.removeItem(key);
}

export function confirmAuthoringCreateIntent(scope: CreateScope, propertyId: string): void {
  const key = keyFor(scope);
  const stored = sessionStorage.getItem(key);
  if (stored) sessionStorage.setItem(key, JSON.stringify({ ...JSON.parse(stored), resolvedId: propertyId }));
}

/** An explicit new-form action can discard confirmed results. Uncertain intents
 * survive that action and must first be resolved by reopening/replaying. */
export function clearConfirmedAuthoringCreateIntents(kind: CreateKind, actorId: string, companyId: string): void {
  for (const key of Object.keys(sessionStorage)) {
    if (!key.startsWith(prefix)) continue;
    const [storedKind, actor, company] = JSON.parse(key.slice(prefix.length));
    if (kind === storedKind && actor === actorId && company === companyId && JSON.parse(sessionStorage.getItem(key) || '{}').resolvedId) sessionStorage.removeItem(key);
  }
}
