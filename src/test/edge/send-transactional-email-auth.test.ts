import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Source guard: send-transactional-email runs with verify_jwt = false, so it must
// authenticate service callers itself before doing any work.
const root = resolve(__dirname, '../../..');
const source = readFileSync(resolve(root, 'supabase/functions/send-transactional-email/index.ts'), 'utf8');
const config = readFileSync(resolve(root, 'supabase/config.toml'), 'utf8');

describe('send-transactional-email auth boundary', () => {
  it('gateway JWT verification is disabled, so an in-function guard is required', () => {
    expect(config).toMatch(/\[functions\.send-transactional-email\]\s*\nverify_jwt = false/);
  });

  it('requires a service caller before parsing the body or creating clients', () => {
    const guard = source.indexOf('await requireServiceCaller(req, corsHeaders)');
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(source.indexOf('await req.json()'));
    expect(guard).toBeLessThan(source.indexOf("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"));
    expect(source).toMatch(/if \(denied\) return denied/);
  });
});
