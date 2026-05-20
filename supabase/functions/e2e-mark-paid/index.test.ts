import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')!;
const E2E_TOKEN = Deno.env.get('E2E_TEST_TOKEN') ?? '';
const FN_URL = `${SUPABASE_URL}/functions/v1/e2e-mark-paid`;

Deno.test('rejects request without x-e2e-token', async () => {
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ order_id: '00000000-0000-0000-0000-000000000000' }),
  });
  const body = await res.text();
  assertEquals(res.status === 403 || res.status === 503, true, `got ${res.status}: ${body}`);
});

Deno.test('rejects unknown order', async () => {
  if (!E2E_TOKEN) return; // skip if not configured
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-e2e-token': E2E_TOKEN },
    body: JSON.stringify({ order_id: '00000000-0000-0000-0000-000000000000' }),
  });
  const body = await res.text();
  assertEquals(res.status, 404, body);
});
