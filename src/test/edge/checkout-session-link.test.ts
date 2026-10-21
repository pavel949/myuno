import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { filterCheckoutSnapshot, linkCheckoutSession, type LinkOrder } from '../../../supabase/functions/_shared/checkout-session-link';
const source = ts.transpileModule(readFileSync('supabase/functions/create-checkout/index.ts', 'utf8').replace(/^import .*;\s*$/gm, ''), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
async function run(options: { owner?: string | null; mode?: 'error' | 'empty' | 'ackloss' | 'unexpected'; pointer?: string } = {}) {
  let handler: (request: Request) => Promise<Response>;
  let order: LinkOrder = { id: 'order', customer_user_id: options.owner === undefined ? 'actor' : options.owner, total_amount: 1200, currency: 'THB', status: 'pending', metadata: { transfer_type: 'airport', direction: 'from-airport', ...(options.pointer ? { stripe_session_id: options.pointer } : {}) } };
  const effects = { creates: 0, expires: [] as string[], filters: [] as [string, unknown][], quote: null as Record<string, unknown> | null };
  const client = { from: () => {
    let patch: Record<string, unknown> | undefined;
    const q = {
      select: () => q,
      eq: (column: string, value: unknown) => { effects.filters.push([column, value]); return q; },
      filter: (column: string, op: string, value: string) => { effects.filters.push([column, `${op}.${value}`]); return q; },
      is: () => q,
      update: (value: Record<string, unknown>) => { patch = value; return q; },
      single: async () => ({ data: structuredClone(order), error: null }),
      maybeSingle: async () => ({ data: structuredClone(order), error: null }),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => {
        if (!patch) throw Error('unexpected DML');
        if (!options.mode || options.mode === 'ackloss') order = { ...order, metadata: patch.metadata };
        const data = options.mode === 'empty' ? [] : options.mode === 'unexpected' ? [{ id: 'foreign' }] : [{ id: 'order' }];
        return Promise.resolve({ data, error: options.mode === 'error' || options.mode === 'ackloss' ? { message: 'synthetic write error' } : null }).then(resolve, reject);
      },
    }; return q;
  } };
  const providerSession = (id: string) => ({ id, status: 'open', payment_status: 'unpaid', amount_total: 120000, currency: 'thb', metadata: { order_id: 'order', user_id: 'actor', type: 'order_payment' }, url: 'https://checkout.stripe.com/test' });
  const stripe = { customers: { list: async () => ({ data: [{ id: 'customer' }] }) }, checkout: { sessions: {
    create: async (quote: Record<string, unknown>) => { effects.creates++; effects.quote = quote; return providerSession('created'); },
    retrieve: async (id: string) => providerSession(id), expire: async (id: string) => { effects.expires.push(id); return { ...providerSession(id), status: 'expired' }; },
  } } };
  vm.runInNewContext(source, { filterCheckoutSnapshot, linkCheckoutSession,
    createStripeClient: () => stripe, createServiceClient: () => client,
    createClient: () => ({ auth: { getUser: async () => ({ data: { user: { id: 'actor', email: 'synthetic@example.invalid' } }, error: null }) } }),
    getCorsHeaders: () => ({}), getAllowedOrigin: () => 'https://synthetic.invalid', withRateLimit: async () => null, RATE_LIMITS: { payment: {} },
    Deno: { env: { get: () => 'synthetic' }, serve: (fn: typeof handler) => { handler = fn; } },
    Response, URL, console: { info() {}, error() {} }, fetch: () => { throw Error('No network allowed'); },
  });
  const response = await handler!(new Request('https://synthetic.invalid', { method: 'POST', headers: { Authorization: 'Bearer synthetic' }, body: JSON.stringify({ order_id: 'order', order_type: 'transport', amount: 1, currency: 'USD' }) }));
  return { response, body: await response.json(), order, effects };
}
describe('actual create-checkout entrypoint with isolated SDK/provider ports', () => {
  it('preserves airport metadata; CAS includes actor/quote/status/snapshot; uses persisted amount', async () => {
    const r = await run(); expect(r.response.status).toBe(200); expect(r.order.metadata).toEqual({ transfer_type: 'airport', direction: 'from-airport', stripe_session_id: 'created' });
    expect(r.effects.filters).toContainEqual(['customer_user_id', 'actor']); expect(r.effects.filters).toContainEqual(['total_amount', 1200]); expect(r.effects.filters).toContainEqual(['status', 'pending']);
    expect(r.effects.filters).toContainEqual(['metadata', 'eq.{"transfer_type":"airport","direction":"from-airport"}']);
    expect(r.effects.quote).toMatchObject({ line_items: [{ price_data: { unit_amount: 120000, currency: 'thb' } }] });
  });
  it.each(['foreign', null])('foreign/unknown owner %s denied before provider', async owner => { const r = await run({ owner }); expect(r.response.status).toBe(403); expect(r.effects.creates).toBe(0); });
  it.each(['error', 'unexpected'] as const)('unknown write %s returns reconciliation/no URL and no cancellation', async mode => { const r = await run({ mode }); expect(r.response.status).toBe(503); expect(r.body).toEqual({ error: 'reconciliation_required' }); expect(r.effects.expires).toEqual([]); });
  it('known zero-row updates cannot return orphan URL; retires its own session after bounded retries', async () => { const r = await run({ mode: 'empty' }); expect(r.response.status).toBe(409); expect(r.effects.expires).toEqual(['created']); expect(r.body.url).toBeUndefined(); });
  it('committed acknowledgement loss is reconciled by reading owned pointer', async () => { const r = await run({ mode: 'ackloss' }); expect(r.response.status).toBe(200); expect(r.effects.expires).toEqual([]); });
  it('reuses verified open pointer without another provider creation', async () => { const r = await run({ pointer: 'existing' }); expect(r.response.status).toBe(200); expect(r.body.sessionId).toBe('existing'); expect(r.effects.creates).toBe(0); });
});
