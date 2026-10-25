/** One pending nonce per mounted intent; session storage retains uncertain retries. */
type IntakePayload = Record<string, unknown>;
type RpcClient = { rpc(name: 'submit_consultation_request', args: { payload: never }): PromiseLike<{ data: unknown; error: unknown }> };
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type Pending = { key: string; fingerprint: string; receipt?: string; storageKey: string };
const stable = (value: unknown): string => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? '[' + value.map(stable).join(',') + ']' : '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable((value as IntakePayload)[key])).join(',') + '}';
export function createConsultationIntakeAttempt(options: { storage?: Store; crypto?: Crypto } = {}) {
  let pending: Pending | undefined;
  let inFlight: Promise<{ id: string; shouldDispatch: boolean }> | undefined;
  return {
    async submit(client: RpcClient, payload: IntakePayload, actorId?: string | null) {
      const cryptoApi = options.crypto || globalThis.crypto;
      const storage = options.storage || globalThis.sessionStorage;
      if (!cryptoApi?.subtle || !cryptoApi.randomUUID || !storage) throw new Error('Secure intake recovery is unavailable.');
      const clean = JSON.parse(JSON.stringify(payload)) as IntakePayload;
      delete clean.intake_request_key;
      const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(stable(clean)));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const meta = clean.vertical_metadata as Record<string, unknown> | undefined;
      const scope = stable({ entry: clean.entry_point || clean.request_type || 'consultation', project: meta?.project_id || null, unit: meta?.unit_id || null, intent: meta?.intent || null, ownerProperty: clean.owner_property_id || null });
      const storageKey = `myuno:intake-pending:v1:${actorId || 'guest'}:${scope}`;
      if (pending && pending.storageKey === storageKey && pending.fingerprint === fingerprint && pending.receipt) return { id: pending.receipt, shouldDispatch: false };
      if (inFlight) {
        if (pending?.storageKey !== storageKey || pending.fingerprint !== fingerprint) throw new Error('A previous intake attempt is still pending.');
        return inFlight.then(result => ({ ...result, shouldDispatch: false }));
      }
      const saved = storage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Pending;
        if (parsed.fingerprint !== fingerprint) throw new Error('The previous request outcome is uncertain; retry its original details.');
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.key)) throw new Error('The pending intake recovery record is invalid.');
        pending = { key: parsed.key, fingerprint, storageKey };
      } else if (!pending || pending.storageKey !== storageKey || pending.fingerprint !== fingerprint) {
        pending = { key: cryptoApi.randomUUID(), fingerprint, storageKey };
      }
      const attempt = pending!;
      storage.setItem(storageKey, JSON.stringify({ key: attempt.key, fingerprint })); // No contact payload is persisted.
      inFlight = (async () => {
        const { data, error } = await client.rpc('submit_consultation_request', { payload: { ...clean, intake_request_key: attempt.key, intake_actor_hint: actorId || 'guest' } as never });
        if (error) {
          // Deterministic input validation failures prove these exact details were rejected.
          // Actor/access changes, key conflicts and transport uncertainty retain recovery state.
          const code = (error as { code?: string }).code;
          if (code === '22023' || code === '22P02') { storage.removeItem(storageKey); pending = undefined; }
          throw error;
        }
        if (typeof data !== 'string' || !data.trim()) throw new Error('Consultation request receipt was not confirmed.');
        attempt.receipt = data;
        try { storage.removeItem(storageKey); } catch { /* Durable receipt wins over optional local cleanup. */ }
        return { id: data, shouldDispatch: true };
      })();
      try { return await inFlight; } finally { inFlight = undefined; }
    },
  };
}
