import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { newbuildRequestOnlyResponse } from '../../../supabase/functions/_shared/newbuild-request-only';
describe('server request-only containment', () => {
  it('returns a non-success response without claiming a hold/payment', async () => { const response = newbuildRequestOnlyResponse({ 'Access-Control-Allow-Origin': '*' }); expect(response.status).toBe(409); expect(await response.json()).toMatchObject({ success: false, request_only: true, reason: 'request_only' }); });
  it.each(['devmod-unit-hold', 'devmod-create-booking-checkout'])('%s gate precedes privileged factories', endpoint => { const source = readFileSync(`supabase/functions/${endpoint}/index.ts`, 'utf8'); const handler = source.slice(source.indexOf('Deno.serve')); expect(handler.indexOf('return newbuildRequestOnlyResponse')).toBeGreaterThan(0); for (const factory of ['createClient(', 'createServiceClient(', 'createStripeClient(']) if (handler.includes(factory)) expect(handler.indexOf('return newbuildRequestOnlyResponse')).toBeLessThan(handler.indexOf(factory)); });
});

it('policy review candidate is read-only rather than a blanket operator privilege change', () => {
  const sql = readFileSync('docs/newbuilds/project-unit-containment.sql', 'utf8').replace(/--[^\n]*/g, '');
  expect(sql).not.toMatch(/\b(?:REVOKE|GRANT|TRUNCATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i);
  expect(sql).toContain('pg_policies');
});
