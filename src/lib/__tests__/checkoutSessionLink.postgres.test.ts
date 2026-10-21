/** Disposable local SQL only; proves JSONB CAS semantics, not deployed schema/policies. */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';
let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
const root = process.getuid?.() === 0; const owner = root ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const lib = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
function run(bin: string, args: string[]) { const exe = join(pgRoot, 'bin', bin); return root ? execFileSync('runuser', ['-u', owner, '--', exe, ...args]) : execFileSync(exe, args); }
beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-checkout-cas-')); chmodSync(directory, 0o700); if (root) chownSync(directory, 65534, 65534);
  run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(lib ? ['-c', `dynamic_library_path=${lib}`] : [])]);
  run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'log'), '-o', `-k ${directory} -p 55467 -c listen_addresses=''${lib ? ` -c dynamic_library_path=${lib}` : ''}`, '-w', 'start']); started = true;
  sql = postgres({ host: directory, port: 55467, database: 'postgres', username: owner, max: 2 });
  await sql`CREATE TABLE orders(id text PRIMARY KEY, customer_user_id text, total_amount numeric, currency text, status text, metadata jsonb)`;
}, 60000);
afterAll(async () => { if (sql) await sql.end(); if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']); if (directory) rmSync(directory, { recursive: true, force: true }); });
it('real PostgreSQL rejects stale JSONB snapshot and preserves concurrent nested metadata on retry', async () => {
  await sql`INSERT INTO orders VALUES ('order','actor',1200,'THB','pending','{"transfer_type":"airport","route":{"to":"A"}}')`;
  const snapshot = (await sql`SELECT metadata FROM orders WHERE id='order'`)[0].metadata;
  await sql`UPDATE orders SET metadata=metadata || '{"note":"concurrent"}'::jsonb WHERE id='order'`;
  const stale = await sql`UPDATE orders SET metadata=${sql.json({ ...snapshot, stripe_session_id: 'ours' })} WHERE id='order' AND customer_user_id='actor' AND total_amount=1200 AND currency='THB' AND status='pending' AND metadata=${sql.json(snapshot)}::jsonb RETURNING id`;
  expect(stale).toHaveLength(0);
  const current = (await sql`SELECT metadata FROM orders WHERE id='order'`)[0].metadata;
  const won = await sql`UPDATE orders SET metadata=${sql.json({ ...current, stripe_session_id: 'ours' })} WHERE id='order' AND customer_user_id='actor' AND total_amount=1200 AND currency='THB' AND status='pending' AND metadata=${sql.json(current)}::jsonb RETURNING id`;
  expect(won).toHaveLength(1); expect((await sql`SELECT metadata FROM orders`)[0].metadata).toEqual({ ...snapshot, note: 'concurrent', stripe_session_id: 'ours' });
});
it('simultaneous pointer CAS yields one winner, never replaces active pointer', async () => {
  await sql`UPDATE orders SET metadata='{}'`;
  const write = (id: string) => sql`UPDATE orders SET metadata=${sql.json({ stripe_session_id: id })} WHERE id='order' AND customer_user_id='actor' AND total_amount=1200 AND currency='THB' AND status='pending' AND metadata='{}'::jsonb RETURNING id`;
  const result = await Promise.all([write('a'), write('b')]); expect(result.map(r => r.length).sort()).toEqual([0, 1]);
});
it('quote/owner/status predicates and SQL NULL distinguish unknown JSON scalar', async () => {
  await sql`UPDATE orders SET metadata=NULL`;
  expect(await sql`UPDATE orders SET metadata='{}' WHERE id='order' AND customer_user_id='foreign' AND metadata IS NULL RETURNING id`).toHaveLength(0);
  expect(await sql`UPDATE orders SET metadata='{}' WHERE id='order' AND total_amount=1 AND metadata IS NULL RETURNING id`).toHaveLength(0);
  expect(await sql`UPDATE orders SET metadata='{}' WHERE id='order' AND status='confirmed' AND metadata IS NULL RETURNING id`).toHaveLength(0);
  expect(await sql`UPDATE orders SET metadata='{}' WHERE id='order' AND customer_user_id='actor' AND total_amount=1200 AND currency='THB' AND status='pending' AND metadata IS NULL RETURNING id`).toHaveLength(1);
  await sql`UPDATE orders SET metadata='null'::jsonb`;
  expect(await sql`UPDATE orders SET metadata='{}' WHERE metadata IS NULL RETURNING id`).toHaveLength(0);
});
