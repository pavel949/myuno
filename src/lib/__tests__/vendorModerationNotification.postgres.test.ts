import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';

const originalSource = readFileSync('supabase/migrations/20260121010005_982a783a-0ff3-49fc-bd4a-230f9365dbd8.sql', 'utf8');
const originalStart = originalSource.indexOf('CREATE OR REPLACE FUNCTION notify_vendor_on_content_status_change()');
const originalEnd = originalSource.indexOf('$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;', originalStart);
const originalFunction = originalSource.slice(originalStart, originalEnd + '$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;'.length);
const candidate = readFileSync('docs/convergence/employee-property-publication/vendor-notification-row-shape.candidate.sql', 'utf8');
const lookup = spawnSync('which', ['postgres'], { encoding: 'utf8' });
const pgAvailable = lookup.status === 0 && lookup.stdout.trim().length > 0;
if (process.env.CI && !pgAvailable) throw new Error('CI must supply local PostgreSQL for vendor moderation regression tests');
const suite = pgAvailable ? describe : describe.skip;
const pgRoot = pgAvailable ? dirname(dirname(realpathSync(lookup.stdout.trim()))) : '';
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const providerId = '00000000-0000-4000-8000-000000000001';
const providerUser = '00000000-0000-4000-8000-000000000002';
const missingProvider = '00000000-0000-4000-8000-000000000003';
let directory = '';
let started = false;
let sql: ReturnType<typeof postgres>;
let originalAcl: string | null;

function run(binary: string, args: string[]) {
  const exe = existsSync(join(pgRoot, 'bin', binary)) ? join(pgRoot, 'bin', binary) : binary;
  return root
    ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' })
    : execFileSync(exe, args, { encoding: 'utf8' });
}

async function property(provider: string | null = providerId) {
  const [row] = await sql`INSERT INTO public.properties(provider_id,title_en,approval_status)
    VALUES(${provider},'Synthetic villa','draft') RETURNING id`;
  return row.id as string;
}

async function service(name: string | null = 'Synthetic restaurant') {
  const [row] = await sql`INSERT INTO public.restaurants(provider_id,name_en,approval_status)
    VALUES(${providerId},${name},'pending') RETURNING id`;
  return row.id as string;
}

async function notifications(id: string) {
  return sql`SELECT user_id,title,body,type,data,is_read FROM public.notifications WHERE data->>'item_id'=${id}`;
}

suite('vendor moderation on real isolated PostgreSQL', () => {
  beforeAll(async () => {
    // Owned Unix-socket-only cluster. Never accepts hosted URLs or credentials.
    directory = mkdtempSync(join(tmpdir(), 'myuno-vendor-moderation-'));
    chmodSync(directory, 0o700);
    if (root) chownSync(directory, 65534, 65534);
    run('initdb', ['-D', join(directory, 'data'), '-A', 'trust', '--no-locale', ...(libPath ? ['-c', `dynamic_library_path=${libPath}`] : [])]);
    run('pg_ctl', ['-D', join(directory, 'data'), '-l', join(directory, 'pg.log'), '-o', `-k ${directory} -p 55449 -c listen_addresses=''${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`, '-w', 'start']);
    started = true;
    sql = postgres({ host: directory, port: 55449, database: 'postgres', username: owner, password: '', max: 2, onnotice: () => {} });
    await sql.unsafe(`
      CREATE ROLE authenticated NOLOGIN;
      CREATE TABLE public.providers(id uuid PRIMARY KEY,user_id uuid);
      CREATE TABLE public.properties(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),provider_id uuid,title_en text NOT NULL,approval_status text,rejection_reason text);
      CREATE TABLE public.restaurants(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),provider_id uuid,name_en text,approval_status text,rejection_reason text);
      CREATE TABLE public.notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,title text,body text,type text,data jsonb,is_read boolean);
    `);
    await sql`INSERT INTO public.providers(id,user_id) VALUES(${providerId},${providerUser})`;
    await sql.unsafe(originalFunction);
    // A CREATE OR REPLACE compatibility repair must preserve the deployed ACL.
    await sql.unsafe(`REVOKE ALL ON FUNCTION public.notify_vendor_on_content_status_change() FROM PUBLIC,authenticated;
      CREATE TRIGGER trigger_notify_vendor_properties AFTER UPDATE OF approval_status ON public.properties
        FOR EACH ROW EXECUTE FUNCTION public.notify_vendor_on_content_status_change();
      CREATE TRIGGER trigger_notify_vendor_restaurants AFTER UPDATE OF approval_status ON public.restaurants
        FOR EACH ROW EXECUTE FUNCTION public.notify_vendor_on_content_status_change();`);
    const [before] = await sql`SELECT proacl::text AS acl FROM pg_proc WHERE oid='public.notify_vendor_on_content_status_change()'::regprocedure`;
    originalAcl = before.acl;
    await sql.unsafe(candidate);
  }, 60000);

  afterAll(async () => {
    if (sql) await sql.end();
    if (started) run('pg_ctl', ['-D', join(directory, 'data'), '-m', 'immediate', 'stop']);
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it.each(['properties', 'restaurants'] as const)('reproduces the original missing-field failure on %s', async table => {
    const id = table === 'properties' ? await property() : await service();
    await expect(sql.begin(async tx => {
      await tx.unsafe(originalFunction);
      await tx`UPDATE ${tx(table)} SET approval_status='approved' WHERE id=${id}`;
    })).rejects.toMatchObject({ code: '42703' });
    // The failed transaction rolls back both status and temporary function replacement.
    expect(await notifications(id)).toHaveLength(0);
  });

  it('allows provider-linked draft submission without sending a moderation result', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET approval_status='pending' WHERE id=${id}`;
    expect(await notifications(id)).toHaveLength(0);
    const [row] = await sql`SELECT approval_status FROM public.properties WHERE id=${id}`;
    expect(row.approval_status).toBe('pending');
  });

  it('approves a title-only property and keeps the provider recipient and payload', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET approval_status='pending' WHERE id=${id}`;
    await sql`UPDATE public.properties SET approval_status='approved' WHERE id=${id}`;
    expect(await notifications(id)).toEqual([{
      user_id: providerUser, title: '✅ Контент одобрен!', body: '"Synthetic villa" теперь виден пользователям',
      type: 'content_moderation', is_read: false,
      data: { item_id: id, item_type: 'properties', new_status: 'approved', rejection_reason: null },
    }]);
  });

  it('rejects a name-only service with its original reason and recipient', async () => {
    const id = await service();
    await sql`UPDATE public.restaurants SET approval_status='rejected',rejection_reason='Missing details' WHERE id=${id}`;
    expect(await notifications(id)).toEqual([{
      user_id: providerUser, title: '❌ Контент отклонён!', body: '"Synthetic restaurant" отклонён. Причина: Missing details',
      type: 'content_moderation', is_read: false,
      data: { item_id: id, item_type: 'restaurants', new_status: 'rejected', rejection_reason: 'Missing details' },
    }]);
  });

  it('approves a name-only service without requiring a title column', async () => {
    const id = await service();
    await sql`UPDATE public.restaurants SET approval_status='approved' WHERE id=${id}`;
    const [notice] = await notifications(id);
    expect(notice.body).toBe('"Synthetic restaurant" теперь виден пользователям');
    expect(notice.data.item_type).toBe('restaurants');
  });

  it('rejects a title-only property without requiring a name column', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET approval_status='rejected',rejection_reason='Needs correction' WHERE id=${id}`;
    const [notice] = await notifications(id);
    expect(notice.body).toBe('"Synthetic villa" отклонён. Причина: Needs correction');
  });

  it('keeps the generic fallback for a missing optional name value', async () => {
    const id = await service(null);
    await sql`UPDATE public.restaurants SET approval_status='approved' WHERE id=${id}`;
    expect((await notifications(id))[0].body).toBe('"Your item" теперь виден пользователям');
  });

  it('does not resend when approval status is unchanged', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET approval_status='approved' WHERE id=${id}`;
    await sql`UPDATE public.properties SET approval_status='approved',title_en='Updated title' WHERE id=${id}`;
    expect(await notifications(id)).toHaveLength(1);
  });

  it('does not notify for a title-only update', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET title_en='Edited title' WHERE id=${id}`;
    expect(await notifications(id)).toHaveLength(0);
  });

  it.each([null, missingProvider])('preserves the no-provider early return for %s', async provider => {
    const id = await property(provider);
    await sql`UPDATE public.properties SET approval_status='approved' WHERE id=${id}`;
    expect(await notifications(id)).toHaveLength(0);
  });

  it('does not notify when a rejected property returns to draft', async () => {
    const id = await property();
    await sql`UPDATE public.properties SET approval_status='rejected' WHERE id=${id}`;
    await sql`UPDATE public.properties SET approval_status='draft' WHERE id=${id}`;
    expect(await notifications(id)).toHaveLength(1);
    expect((await notifications(id))[0].body).toContain('Not specified');
  });

  it('preserves atomic failure when notification insertion is rejected', async () => {
    const id = await property();
    await expect(sql.begin(async tx => {
      await tx.unsafe(`ALTER TABLE public.notifications ADD CONSTRAINT reject_new_notifications CHECK (false) NOT VALID`);
      await tx`UPDATE public.properties SET approval_status='approved' WHERE id=${id}`;
    })).rejects.toMatchObject({ code: '23514' });
    const [row] = await sql`SELECT approval_status FROM public.properties WHERE id=${id}`;
    expect(row.approval_status).toBe('draft');
    expect(await notifications(id)).toHaveLength(0);
  });

  it('preserves SECURITY DEFINER, search_path and execution grants', async () => {
    const [fn] = await sql`SELECT proacl::text AS acl,prosecdef,proconfig FROM pg_proc
      WHERE oid='public.notify_vendor_on_content_status_change()'::regprocedure`;
    expect(fn.acl).toBe(originalAcl);
    expect(fn.prosecdef).toBe(true);
    expect(fn.proconfig).toEqual(['search_path=public']);
  });
});
