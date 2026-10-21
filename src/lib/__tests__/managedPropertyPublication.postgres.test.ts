import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import postgres from 'postgres';
import { applyTransactionScript } from '../../test/applyTransactionScript';
import { MANAGED_PROPERTY_DRAFT_FIELDS } from '../managedPropertyDraftFields';

// Never accepts a DATABASE_URL or hosted credentials. Own Unix-socket-only cluster.
const lookup = spawnSync('which', ['postgres'], { encoding: 'utf8' });
const pgAvailable = lookup.status === 0 && lookup.stdout.trim().length > 0;
if (process.env.CI && !pgAvailable) throw new Error('CI must supply local PostgreSQL for the publication contract');
const suite = pgAvailable ? describe : describe.skip;
const pgRoot = pgAvailable ? dirname(dirname(realpathSync(lookup.stdout.trim()))) : '';
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const C = id(1), OTHER = id(2), SPACE = id(3), OTHER_SPACE = id(4), DEAD_SPACE = id(5), UNAUTHORIZED_SPACE = id(6);
const U = { admin: id(10), editor: id(11), viewer: id(12), outsider: id(13), team: id(14), owner: id(15), provider: id(16), staff: id(17), unassignedStaff: id(18), inactive: id(19) };
let directory = ''; let started = false; let sql: ReturnType<typeof postgres>;
function run(bin: string, args: string[]) {
 const exe = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
 return root ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' }) : execFileSync(exe, args, { encoding: 'utf8' });
}
function sourceFunction(path: string, name: string) {
 const source = readFileSync(path, 'utf8');
 const start = source.search(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION (?:public\\.)?${name}\\(`));
 if (start < 0) throw new Error(`Source function missing: ${name}`);
 const opening = source.indexOf('$$', start);
 return source.slice(start, source.indexOf('$$;', opening + 2) + 3);
}
async function as<T>(actor: string | null, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
 return sql.begin(async tx => {
  await tx.unsafe(`SET LOCAL ROLE ${actor === null ? 'anon' : 'authenticated'}`);
  await tx`SELECT set_config('request.jwt.claim.sub',${actor ?? ''},true)`;
  return fn(tx);
 }) as Promise<T>;
}
async function read(actor:string,key:string) { return as(actor,async tx=>(await tx`SELECT read_managed_property_draft_checked(${key}) AS row`)[0].row); }
let sequence = 200;
async function property(patch: Record<string, unknown> = {}) {
 const key = id(sequence++);
 const data = { id: key, management_company_id: C, title_en: 'Synthetic villa', title_ru: 'Вилла', is_active: false, approval_status: 'draft', ...patch };
 await sql`INSERT INTO properties ${sql(data)}`;
 await sql`INSERT INTO operating_space_properties VALUES (${SPACE},${key},${C})`;
 return key;
}
async function version(key: string) {
 return (await sql`SELECT updated_at::text AS value FROM properties WHERE id=${key}`)[0].value as string;
}
// Bind opaque revision strings as text: postgres-js otherwise infers timestamptz
// and serializes through JavaScript Date, truncating server microseconds.
async function save(actor: string, key: string, patch: Record<string, postgres.JSONValue>, submit = false, expected?: string) {
 const revision = expected ?? await version(key);
 return as(actor, async tx => (await tx`SELECT save_managed_property_draft_checked(${key},${revision}::text::timestamptz,${tx.json(patch)},${submit}) AS result`)[0].result);
}
async function review(actor: string, key: string, decision = 'approve', expected?: string, reason: string | null = null) {
 const revision = expected ?? await version(key);
 return as(actor, async tx => (await tx`SELECT review_property_submission_checked(${key},${revision}::text::timestamptz,${decision},${reason}) AS result`)[0].result);
}
async function create(actor: string, company = C, space: string | null = SPACE) {
 return as(actor, async tx => (await tx`SELECT create_managed_property_checked(${company},${space},'New villa','Новая вилла','villa','rent') AS id`)[0].id as string);
}

// Source-canonical surviving tables. The April 19 cleanup dropped property_meters;
// recreating it here would hide a production compatibility failure.
const sensitiveTables=['property_documents','inventory_inspections','owner_portal_settings','portal_messages'];
const childTables = ['property_media','property_amenities','property_reviews','property_room_categories','property_rate_plans','property_stay_restrictions','property_key_assignments','property_utility_schedules','property_payout_rules','property_rate_seasons','property_price_offers','property_financials'];
function sourcePolicy(path:string,name:string) {
 const source=readFileSync(path,'utf8');
 let start=source.indexOf(`CREATE POLICY "${name}"`);
 if(start<0) start=source.indexOf(`CREATE POLICY ${name} `);
 if(start<0) throw new Error(`Missing source policy ${name}`);
 return source.slice(start,source.indexOf(';',start)+1).split('public.can_manage_property(').join('public.can_manage_property_e28_private(').split('is_admin_or_uno_team()').join('is_admin_or_uno_team_e28_private()');
}
async function installLegacyConsumers() {
 // Reuse the actual updatable canonical owner view. Add only its missing fixture
 // columns from generated canonical types; this is not a full migration replay.
 // Publisher write targets outside the view must exist in the base fixture too;
 // the static source contract checks the union without widening the owner view.
 const source=readFileSync('supabase/migrations/20260228013925_c84e0fbe-3bce-42ae-85be-05cfdf40ad3d.sql','utf8');
 const view=source.slice(source.indexOf('CREATE OR REPLACE VIEW public.owner_properties'),source.indexOf('-- Step 3:'));
 const names=view.slice(view.indexOf('SELECT')+6,view.indexOf('FROM properties')).split(',').map(field=>field.trim().split(/\s+AS\s+/i)[0]);
 const types=readFileSync('src/integrations/supabase/types.ts','utf8');
 const row=types.slice(types.indexOf('      properties: {')).split('        Insert: {')[0];
 const existing=new Set((await sql`SELECT column_name FROM information_schema.columns WHERE table_name='properties'`).map(c=>c.column_name));
 for(const name of names) {
  if(existing.has(name)) continue;
  if(!/^[a-z_]+$/.test(name)) throw new Error(`Invalid fixture column ${name}`);
  const type=row.match(new RegExp(`\\n          ${name}: ([^\\n]+)`))?.[1];
  if(!type) throw new Error(`Missing canonical fixture type ${name}`);
  const dbType=type.includes('string[]')?'text[]':type.includes('number')?'numeric':type.includes('boolean')?'boolean':type.includes('Json')?'jsonb':'text';
  await sql.unsafe(`ALTER TABLE public.properties ADD COLUMN ${name} ${dbType}`);
 }
 await sql.unsafe(view);
 await sql.unsafe('ALTER VIEW public.owner_properties SET (security_invoker=true); GRANT SELECT,UPDATE ON public.owner_properties TO authenticated;');
 await sql.unsafe(sourceFunction('supabase/migrations/20260122090230_e71787be-8a4c-4a8c-aba1-52358bf0803a.sql','publish_property_to_marketplace'));
 await sql.unsafe(sourceFunction('supabase/migrations/20260222052151_fd71c658-d60b-4051-a90a-9bb91593ebd0.sql','is_assigned_manager'));
 const catalog='supabase/migrations/20260820004935_8cdbaa30-5b89-4a52-a6bf-d96737ab1fc4.sql';
 await sql.unsafe(sourceFunction(catalog,'property_is_public'));
 await sql.unsafe(sourceFunction(catalog,'can_manage_property')
  .split('public.can_manage_property(').join('public.can_manage_property_e28_private(')
  .split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private(')
  .split("public.has_role(auth.uid(), 'uno_team'::app_role)").join('false'));
 await sql.unsafe(sourceFunction('supabase/migrations/20260228003243_22bd8cd0-c874-465c-9032-65ef34ed77fd.sql','is_mc_member_for_property'));
 for(const table of childTables) {
  await sql.unsafe(`CREATE TABLE public.${table}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,category_id uuid,payload text,owner_id uuid,reviewer_id uuid,is_public boolean DEFAULT false,is_active boolean DEFAULT true);
   ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
   GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated;`);
 }
 for(const name of ['property_amenities_manage','property_media_manage','property_reviews_host_manage','property_reviews_guest_insert','property_reviews_guest_update','property_reviews_public_read']) await sql.unsafe(sourcePolicy(catalog,name));
 const units='drizzle/migrations/0016_multi_unit_properties_categories_rate_plans.sql';
 for(const name of ['Managers write categories','Managers manage rate plans','Managers manage restrictions']) await sql.unsafe(sourcePolicy(units,name));
 const keys='supabase/migrations/20260227224512_0669d8d2-037d-4e63-a259-acaea61e715b.sql';
 for(const name of ['Users can manage keys for their properties','Users can manage utility schedules for their properties']) await sql.unsafe(sourcePolicy(keys,name));
 await sql.unsafe(sourcePolicy('supabase/migrations/20260228113254_62020ad4-e9ba-410f-a1b2-ebc9e1870471.sql','Users can manage payout rules for their properties'));
 await sql.unsafe(sourcePolicy('supabase/migrations/20260621011714_d52e840c-0b55-419d-923b-c31c54bb62c6.sql','MC members manage rate seasons'));
 await sql.unsafe(sourcePolicy('supabase/migrations/20260302130153_05a07296-bec2-4983-b4c3-c18b23d02304.sql','Managers can manage price offers'));
 await sql.unsafe(sourcePolicy('supabase/migrations/20260227233450_bea959b6-ee92-470f-8d68-472c844bc934.sql','mc_members_crud_property_financials'));
 await sql.unsafe(`CREATE TABLE property_operational_tasks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,assigned_to uuid,payload text);
  ALTER TABLE property_operational_tasks ENABLE ROW LEVEL SECURITY;
  GRANT SELECT,INSERT,UPDATE,DELETE ON property_operational_tasks TO authenticated;`);
 await sql.unsafe(sourcePolicy('supabase/migrations/20260228003243_22bd8cd0-c874-465c-9032-65ef34ed77fd.sql','mc_members_manage_tasks'));
 await sql.unsafe(sourcePolicy('supabase/migrations/20260228002512_594b444c-014b-4f71-8a43-cb7f257f34f3.sql','owners_and_mc_manage_operational_tasks'));
 await sql.unsafe(sourcePolicy('drizzle/migrations/0023_operating_security_ceilings.sql','operating_space_task_ceiling'));

 await sql.unsafe(sourceFunction('supabase/migrations/20260122131140_1d3722d7-58fb-43f6-a0f9-78e4ac1627b5.sql','is_admin_or_uno_team').split('public.is_admin_or_uno_team(').join('public.is_admin_or_uno_team_e28_private(').split("'admin', 'uno_team'").join("'admin'"));
 for(const table of sensitiveTables) {
  await sql.unsafe(`CREATE TABLE public.${table}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid,payload text,owner_user_id uuid,sender_id uuid,sender_role text,inspector_id uuid,uploaded_by uuid);
   ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
   GRANT SELECT,INSERT,UPDATE,DELETE ON public.${table} TO authenticated;`);
 }
 // Historical wider inspection grants deliberately reproduce the old bypass.
 // They are not deployed-equivalence evidence: the final alternate-shape case
 // replaces them with the surviving April source admin-only inspection policy.
 const sensitive='supabase/migrations/20260301035956_cac50c66-e53c-4eea-a6c9-41663a5b5536.sql';
 for(const name of ['MC members can view inspections','MC members can insert inspections','MC members can update inspections','MC admins can delete inspections',
  'Authorized users can view documents','MC members and owners can insert documents','MC admins and owners can update documents','MC admins and owners can delete documents']) await sql.unsafe(sourcePolicy(sensitive,name));
 const settings='supabase/migrations/20260301022612_dd4a7458-6f18-483f-87fd-7cc15a53e59d.sql';
 for(const name of ['MC members manage portal settings','Owners read own portal settings']) await sql.unsafe(sourcePolicy(settings,name));
 const portal='supabase/migrations/20260301023952_afedc09d-b32a-4f1c-b4b9-27bf613ebf07.sql';
 for(const name of ['Owner reads own portal messages','Owner sends portal messages','MC sends portal messages','MC updates read status','Owner updates read status']) await sql.unsafe(sourcePolicy(portal,name));

}

suite('checked managed property publication on isolated PostgreSQL', () => {
 beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), 'myuno-publication-'));
  chmodSync(directory, 0o700); if (root) chownSync(directory, 65534, 65534);
  run('initdb', ['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath ? ['-c',`dynamic_library_path=${libPath}`] : [])]);
  // This tiny disposable RLS fixture checks authorization, not JIT compilation.
  // Apply to every pooled connection without changing policies or test deadlines.
  run('pg_ctl', ['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55447 -c listen_addresses='' -c jit=off${libPath ? ` -c dynamic_library_path=${libPath}` : ''}`,'-w','start']);
  started = true;
  sql = postgres({ host: directory, port: 55447, database: 'postgres', username: owner, password: '', max: 4, onnotice: () => {} });
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/managed-property-publication-base.sql','utf8'));
  await sql.unsafe('GRANT INSERT ON property_activity_log TO authenticated;');
  await sql.unsafe(sourcePolicy('supabase/migrations/20260121060058_c3db524e-bfe7-4948-a85e-3338f7bcff32.sql','Authenticated users can log activity'));

  // Real source helper bodies, including active membership, module/action, Space,
  // and object assignment checks. Apply the same private-helper transformations.
  await sql.unsafe(sourceFunction('drizzle/migrations/0022_operating_scope_resolver.sql','actor_is_operating_company_overseer'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0021_operating_spaces_shadow_foundation.sql','actor_can_access_operating_space'));
  await sql.unsafe(sourceFunction('supabase/migrations/20260301040030_79529c97-8b40-4188-99e4-11c6a78752db.sql','mc_can_access').split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split("'admin', 'uno_team'").join("'admin'"));
  await sql.unsafe(sourceFunction('supabase/migrations/20260302100907_b2105b6d-9cd1-40d9-9f89-86a99c749d5b.sql','staff_can_access_property').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private(').split("'admin', 'uno_team'").join("'admin'"));
  for (const name of ['actor_property_scope_ceiling','actor_can_operate_property','actor_private_property_ceiling']) {
   await sql.unsafe(sourceFunction('drizzle/migrations/0023_operating_security_ceilings.sql',name).split('public.mc_can_access(').join('public.mc_can_access_e28_private(').split('public.staff_can_access_property(').join('public.staff_can_access_property_e28_private('));
  }
  await sql.unsafe(sourceFunction('drizzle/migrations/0028_uno_team_private_helpers.sql','actor_has_platform_admin'));
  await installLegacyConsumers();
  await sql.unsafe(sourceFunction('drizzle/migrations/0032_catalog_notification_private_boundaries.sql','actor_can_notify_property_submission'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0024_operating_cutover_blockers.sql','create_managed_property_checked').split('public.mc_can_access(').join('public.mc_can_access_e28_private('));
  await sql.unsafe(`
   REVOKE ALL ON FUNCTION create_managed_property_checked(uuid,uuid,text,text,text,text) FROM PUBLIC,anon;
   GRANT EXECUTE ON FUNCTION create_managed_property_checked(uuid,uuid,text,text,text,text) TO authenticated;
   CREATE POLICY legacy_property_read ON properties FOR SELECT TO authenticated USING (
    owner_id=auth.uid() OR provider_id=auth.uid() OR EXISTS(SELECT 1 FROM providers pr WHERE pr.id=provider_id AND pr.user_id=auth.uid())
    OR staff_can_access_property_e28_private(auth.uid(),id));
   CREATE POLICY legacy_property_update ON properties FOR UPDATE TO authenticated USING (
    owner_id=auth.uid() OR provider_id=auth.uid() OR EXISTS(SELECT 1 FROM providers pr WHERE pr.id=provider_id AND pr.user_id=auth.uid())
    OR staff_can_access_property_e28_private(auth.uid(),id));
   CREATE POLICY legacy_property_insert ON properties FOR INSERT TO authenticated WITH CHECK (true);
   CREATE POLICY existing_space_select ON properties AS RESTRICTIVE FOR SELECT TO authenticated USING(actor_private_property_ceiling(id));
   CREATE POLICY existing_space_update ON properties AS RESTRICTIVE FOR UPDATE TO authenticated USING(actor_private_property_ceiling(id)) WITH CHECK(actor_private_property_ceiling(id));
  `);
  await sql`INSERT INTO auth.users ${sql(Object.values(U).map(id=>({id})))}`;
  await sql`INSERT INTO management_companies VALUES (${C},true),(${OTHER},true)`;
  await sql`INSERT INTO operating_spaces(id,management_company_id,is_active) VALUES (${SPACE},${C},true),(${OTHER_SPACE},${OTHER},true),(${DEAD_SPACE},${C},false),(${UNAUTHORIZED_SPACE},${C},true)`;
  await sql`INSERT INTO user_roles VALUES (${U.admin},'admin'),(${U.team},'uno_team')`;
  for (const [i, user] of [U.editor,U.viewer,U.staff,U.unassignedStaff,U.inactive].entries()) {
   const member = id(50+i);
   await sql`INSERT INTO management_company_members VALUES (${member},${C},${user},${[U.staff,U.unassignedStaff].includes(user) ? 'staff' : 'manager'},${user!==U.inactive})`;
   await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES (${C},${user},'properties',true,${user!==U.viewer},false)`;
   await sql`INSERT INTO operating_space_members VALUES (${SPACE},${C},${member},true)`;
  }
  await sql`INSERT INTO providers VALUES (${id(90)},${U.provider})`;
  // Reproduce the original WHAT bypass before installing candidate trigger.
  const vulnerable = await property();
  expect((await as(U.viewer, tx => tx`UPDATE properties SET approval_status='approved',is_active=true WHERE id=${vulnerable} RETURNING id`))).toHaveLength(1);
  // Actual surviving source policy formerly permitted forged state-machine logs.
  await as(U.editor,tx=>tx`INSERT INTO property_activity_log(property_id,actor_id,action) VALUES(${vulnerable},${U.admin},'managed_property_publication_changed')`);

  // The unchecked legacy function is callable, but its current canonical view
  // omits op.amenities. Preserve that real source/live-shape failure rather than
  // fabricate a wider view to demonstrate a successful clone escape.
  expect((await sql`SELECT has_function_privilege('authenticated','public.publish_property_to_marketplace(uuid)','EXECUTE') AS allowed`)[0].allowed).toBe(true);
  const legacy=await property({title:'Legacy draft'});
  const linked=await property({title:'Existing marketplace row'});
  const beforeLegacy=(await sql`SELECT count(*)::int AS count FROM properties`)[0].count;
  for(const marketplaceId of [null,linked]) {
   await sql`UPDATE properties SET marketplace_property_id=${marketplaceId} WHERE id=${legacy}`;
   await expect(as(U.outsider,tx=>tx`SELECT publish_property_to_marketplace(${legacy})`)).rejects.toThrow(/record "op" has no field "amenities"/);
  }
  expect((await sql`SELECT count(*)::int AS count FROM properties`)[0].count).toBe(beforeLegacy);
  expect(await sql`SELECT approval_status,is_active FROM properties WHERE id IN (${legacy},${linked})`).toEqual([
   {approval_status:'draft',is_active:false},{approval_status:'draft',is_active:false},
  ]);
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-publication/checked-publication.candidate.sql','utf8'));
  const permissions='supabase/migrations/20260226072628_e0c74d35-4281-4aad-b700-f89f10dc00ca.sql';
  await sql.unsafe(sourceFunction(permissions,'is_mc_admin'));
  await sql.unsafe('ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY; GRANT SELECT,INSERT,UPDATE,DELETE ON team_member_permissions TO authenticated;');
  await sql.unsafe(sourcePolicy(permissions,'MC admins can manage permissions'));
  await sql.unsafe(sourcePolicy(permissions,'Members can read own permissions'));
  await sql.unsafe(sourceFunction('drizzle/migrations/0024_operating_cutover_blockers.sql','actor_is_space_limited'));
  for(const name of ['operating_space_permission_write','operating_space_permission_update','operating_space_permission_delete']) await sql.unsafe(sourcePolicy('drizzle/migrations/0024_operating_cutover_blockers.sql',name));
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-publication/platform-admin-authoring-delegation.candidate.sql','utf8'));
  // Prove the independent pre-existing membership-only task grant, then intersect it.
  const taskProperty=await create(U.staff);
  expect(await as(U.staff,tx=>tx`INSERT INTO property_operational_tasks(property_id,payload) VALUES(${taskProperty},'membership bypass') RETURNING id`)).toHaveLength(1);
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-publication/employee-task-capability.candidate.sql','utf8'));
  await sql`INSERT INTO property_documents(property_id,uploaded_by,payload) VALUES(${taskProperty},${U.owner},'private door code')`;
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_documents WHERE property_id=${taskProperty}`)).toHaveLength(1);
  // Match the surviving source schema before applying the complete candidate.
  expect((await sql`SELECT to_regclass('public.property_meters') AS table_name`)[0].table_name).toBeNull();
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-publication/employee-operational-membership.candidate.sql','utf8'));
  const normalizeSource=readFileSync('supabase/migrations/20260225144021_bfb9f5d1-f20a-4f47-a6d4-70971cc08d8f.sql','utf8');
  await sql.unsafe(normalizeSource.match(/CREATE OR REPLACE FUNCTION normalize_district\(\)[\s\S]*?\$\$ LANGUAGE plpgsql;/)![0]);
  await sql.unsafe('CREATE TRIGGER trg_normalize_district_properties BEFORE INSERT OR UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION normalize_district();');
  await sql.unsafe(sourcePolicy('supabase/migrations/20260205111048_c571471b-a01c-4107-86f6-048ff7cb33e3.sql','public_view_active'));
  await sql.unsafe("ALTER POLICY public_view_active ON public.properties TO anon; GRANT SELECT(id,title_en,is_active,approval_status) ON public.properties TO anon;");
  await applyTransactionScript(sql,readFileSync('docs/convergence/employee-property-revisions/published-revisions.candidate.sql','utf8'));



 }, 60000);
 afterAll(async () => {
  if (sql) await sql.end();
  if (started) run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);
  if (directory) rmSync(directory,{recursive:true,force:true});
 });

 it('installs every surviving operational ceiling with the source-dropped meters table absent', async () => {
  expect((await sql`SELECT to_regclass('public.property_meters') AS table_name`)[0].table_name).toBeNull();
  const policies=await sql`SELECT tablename,cmd,permissive FROM pg_policies
   WHERE schemaname='public' AND policyname LIKE 'employee_%_capability_ceiling'
   ORDER BY tablename,cmd`;
  expect(policies).toEqual([...sensitiveTables].sort().flatMap(tablename=>
   ['DELETE','INSERT','SELECT','UPDATE'].map(cmd=>({tablename,cmd,permissive:'RESTRICTIVE'}))));
 });
 it('creates an inactive canonical draft without claiming the employee is owner/provider', async () => {
  const key = await create(U.editor);
  const [p] = await sql`SELECT approval_status,is_active,owner_id,provider_id,management_company_id,instant_booking FROM properties WHERE id=${key}`;
  expect(p).toEqual({approval_status:'draft',is_active:false,owner_id:null,provider_id:null,management_company_id:C,instant_booking:false});
  expect(await sql`SELECT property_id FROM operating_space_properties WHERE property_id=${key}`).toHaveLength(1);
  expect(await save(U.editor,key,{title_en:'Saved by editor'})).toMatchObject({id:key,approval_status:'draft',is_active:false});
 });
 it('does not let a content-only creator choose an alternate booking mode through RPC inputs', async () => {
  for(const actor of [U.editor,U.staff]) await expect(as(actor,tx=>tx`SELECT create_managed_property_checked(${C},${SPACE},'Sale','Продажа','villa','sale')`)).rejects.toThrow(/bookings edit/);
 });
 it('gives staff only a narrow creator relation, with no raw property or operational assignment access', async () => {
  const key=await create(U.staff);
  expect(await sql`SELECT property_id FROM property_manager_assignments WHERE property_id=${key}`).toHaveLength(0);
  expect((await sql`SELECT content_author_user_id FROM properties WHERE id=${key}`)[0].content_author_user_id).toBe(U.staff);
  expect(await as(U.staff,tx=>tx`SELECT * FROM properties WHERE id=${key}`)).toHaveLength(0);
  expect(await as(U.staff,tx=>tx`UPDATE properties SET title_en='Direct bypass' WHERE id=${key} RETURNING id`)).toHaveLength(0);
  expect(await save(U.staff,key,{title_en:'Staff draft'})).toMatchObject({id:key,title_en:'Staff draft'});
  const row=await read(U.staff,key);
  expect(row).toMatchObject({id:key,title_en:'Staff draft',management_company_id:C});
  for(const field of ['owner_id','provider_id','content_author_user_id','owner_contact_id','lock_code','ical_token','purchase_price']) expect(row).not.toHaveProperty(field);
  expect(Object.keys(row).every(field=>[...MANAGED_PROPERTY_DRAFT_FIELDS,'id','management_company_id','approval_status','is_active','created_at','updated_at','rejection_reason'].includes(field))).toBe(true);
  await expect(read(U.unassignedStaff,key)).rejects.toThrow(/unavailable/);
  await expect(save(U.unassignedStaff,key,{title_en:'Wrong author'})).rejects.toThrow(/unavailable/);
  await expect(save(U.staff,await property(),{title_en:'Wrong object'})).rejects.toThrow(/unavailable|permission/);
 });
 it('rejects inconsistent edit-without-view capability before creating a stranded shell', async () => {
  const before=(await sql`SELECT count(*)::int AS count FROM properties`)[0].count;
  await sql`UPDATE team_member_permissions SET can_view=false,can_edit=true WHERE user_id=${U.staff} AND module='properties'`;
  try {
   await expect(create(U.staff)).rejects.toThrow(/permission/);
   expect((await sql`SELECT count(*)::int AS count FROM properties`)[0].count).toBe(before);
  } finally { await sql`UPDATE team_member_permissions SET can_view=true WHERE user_id=${U.staff} AND module='properties'`; }
 });
 it('lists only own safe authored rows and a bounded explicit Space picker in legacy or enforced mode', async () => {
  const own=await create(U.staff); const other=await create(U.unassignedStaff);
  const list=(actor:string)=>as(actor,tx=>tx`SELECT list_managed_property_drafts_checked(${C}) AS row`);
  const rows=await list(U.staff);
  expect(rows.map(r=>r.row.id)).toContain(own); expect(rows.map(r=>r.row.id)).not.toContain(other);
  expect(rows.every(r=>!('lock_code' in r.row))).toBe(true);
  await expect(as(U.staff,tx=>tx`SELECT list_managed_property_drafts_checked(${C},101,0)`)).rejects.toThrow(/bounded/);
  await expect(as(U.staff,tx=>tx`SELECT list_managed_property_drafts_checked(${OTHER})`)).rejects.toThrow(/permission/);
  const spaces=()=>as(U.staff,tx=>tx`SELECT * FROM list_managed_property_authoring_spaces_checked(${C})`);
  expect((await spaces()).map(s=>s.id)).toEqual([SPACE]);
  await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${C}`;
  try { expect((await spaces()).map(s=>s.id)).toEqual([SPACE]); expect(await read(U.staff,own)).toMatchObject({id:own}); }
  finally { await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${C}`; }
 });
 it.each([U.team,U.viewer,U.outsider,U.inactive])('denies create to undelegated actor %s with no partial shell/assignment', async actor => {
  const before = (await sql`SELECT count(*)::int AS count FROM properties`)[0].count;
  await expect(create(actor)).rejects.toThrow(/authority|permission/);
  expect((await sql`SELECT count(*)::int AS count FROM properties`)[0].count).toBe(before);
 });
 it.each([null,OTHER_SPACE,DEAD_SPACE,UNAUTHORIZED_SPACE])('requires authorized active same-company Space for staff creation (%s)', async space => {
  await expect(create(U.staff,C,space)).rejects.toThrow(/space/);
 });
 it('denies editing an object outside the current explicit Space', async () => {
  const outside=await property();
  await sql`UPDATE operating_space_properties SET operating_space_id=${UNAUTHORIZED_SPACE} WHERE property_id=${outside}`;
  await expect(save(U.editor,outside,{title_en:'Wrong Space'})).rejects.toThrow(/unavailable|permission/);
 });
 it.each(['space','space-deleted','space-member','space-member-deleted','company-member','company-member-deleted','module-view','module-edit','module-deleted','space-assignment','deleted-property'])('revokes author authority immediately for %s, including legacy Space mode', async kind => {
  const key=await create(U.staff);
  await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${C}`;
  const member=(await sql`SELECT id FROM management_company_members WHERE user_id=${U.staff}`)[0].id;
  try {
   if(kind==='space') await sql`UPDATE operating_spaces SET is_active=false WHERE id=${SPACE}`;
   if(kind==='space-deleted') await sql`DELETE FROM operating_spaces WHERE id=${SPACE}`;
   if(kind==='space-member-deleted') await sql`DELETE FROM operating_space_members WHERE company_member_id=${member}`;
   if(kind==='company-member-deleted') await sql`DELETE FROM management_company_members WHERE user_id=${U.staff}`;
   if(kind==='module-deleted') await sql`DELETE FROM team_member_permissions WHERE user_id=${U.staff} AND module='properties'`;
   if(kind==='space-member') await sql`UPDATE operating_space_members SET is_active=false WHERE company_member_id=${member}`;
   if(kind==='company-member') await sql`UPDATE management_company_members SET is_active=false WHERE user_id=${U.staff}`;
   if(kind==='module-view') await sql`UPDATE team_member_permissions SET can_view=false,can_edit=false WHERE user_id=${U.staff} AND module='properties'`;
   if(kind==='module-edit') await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.staff} AND module='properties'`;
   if(kind==='space-assignment') await sql`DELETE FROM operating_space_properties WHERE property_id=${key}`;
   if(kind==='deleted-property') await sql`UPDATE properties SET deleted_at=now() WHERE id=${key}`;
   if(kind!=='module-edit') await expect(read(U.staff,key)).rejects.toThrow(/unavailable/);
   await expect(save(U.staff,key,{title_en:'Revoked'})).rejects.toThrow(/unavailable|permission/);
  } finally {
   await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${C}`;
   if(kind==='space-deleted') await sql`INSERT INTO operating_spaces(id,management_company_id,is_active) VALUES(${SPACE},${C},true)`;
   if(kind==='space-member-deleted') await sql`INSERT INTO operating_space_members VALUES(${SPACE},${C},${member},true)`;
   if(kind==='company-member-deleted') await sql`INSERT INTO management_company_members VALUES(${member},${C},${U.staff},'staff',true)`;
   if(kind==='module-deleted') await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES(${C},${U.staff},'properties',true,true,false)`;
   await sql`UPDATE operating_spaces SET is_active=true WHERE id=${SPACE}`;
   await sql`UPDATE operating_space_members SET is_active=true WHERE company_member_id=${member}`;
   await sql`UPDATE management_company_members SET is_active=true WHERE user_id=${U.staff}`;
   await sql`UPDATE team_member_permissions SET can_view=true,can_edit=true WHERE user_id=${U.staff} AND module='properties'`;
  }
 });
 it('rolls back the canonical shell if its required Space assignment fails', async () => {
  const before=(await sql`SELECT count(*)::int AS count FROM properties`)[0].count;
  await sql.unsafe(`ALTER TABLE operating_space_properties ADD CONSTRAINT test_reject_assignment CHECK(operating_space_id<>'${SPACE}') NOT VALID`);
  try {
   await expect(create(U.staff)).rejects.toThrow(/test_reject_assignment/);
   expect((await sql`SELECT count(*)::int AS count FROM properties`)[0].count).toBe(before);
  } finally { await sql.unsafe('ALTER TABLE operating_space_properties DROP CONSTRAINT test_reject_assignment'); }
 });
 it('does not grant any assignment-derived child writes or private financial reads to a fresh content author', async () => {
  const key=await create(U.staff); const category=id(sequence++);
  await sql`INSERT INTO property_room_categories(id,property_id) VALUES(${category},${key})`;
  for(const table of childTables) {
   const payload={id:id(sequence++),property_id:key,category_id:category,payload:'private'};
   await sql`INSERT INTO ${sql(table)} ${sql(payload)}`;
   if(!['property_media','property_amenities'].includes(table)) expect(await as(U.staff,tx=>tx`SELECT id FROM ${tx(table)} WHERE property_id=${key}`)).toHaveLength(0);
   await expect(as(U.staff,tx=>tx`INSERT INTO ${tx(table)} ${tx({...payload,id:id(sequence++)})}`)).rejects.toThrow(/row-level/);
   expect(await as(U.staff,tx=>tx`UPDATE ${tx(table)} SET payload='forged' WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
   expect(await as(U.staff,tx=>tx`DELETE FROM ${tx(table)} WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
  }
  await save(U.staff,key,{},true); await review(U.admin,key);
  expect(await read(U.staff,key)).toMatchObject({approval_status:'approved',is_active:true});
  await expect(save(U.staff,key,{title_en:'After publication'})).rejects.toThrow(/locked/);
  for(const table of childTables) await expect(as(U.staff,tx=>tx`INSERT INTO ${tx(table)} ${tx({id:id(sequence++),property_id:key,category_id:category})}`)).rejects.toThrow(/row-level/);
  await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.staff} AND module='properties'`;
  try { await expect(as(U.staff,tx=>tx`INSERT INTO property_media(property_id) VALUES(${key})`)).rejects.toThrow(/row-level/); }
  finally { await sql`UPDATE team_member_permissions SET can_edit=true WHERE user_id=${U.staff} AND module='properties'`; }
 });
 it('preserves guest review ownership and existing owner/provider/actual-manager child permissions', async () => {
  const key=await create(U.staff);
  expect(await as(U.outsider,tx=>tx`INSERT INTO property_reviews(property_id,reviewer_id) VALUES(${key},${U.outsider}) RETURNING id`)).toHaveLength(1);
  for(const [actor,patch] of [[U.owner,{owner_id:U.owner}],[U.provider,{provider_id:id(90)}]] as const) {
   const owned=await property(patch);
   expect(await as(actor,tx=>tx`INSERT INTO property_media(property_id) VALUES(${owned}) RETURNING id`)).toHaveLength(1);
  }
  const assigned=await property();
  await sql`INSERT INTO property_manager_assignments(property_id,manager_user_id,is_active) VALUES(${assigned},${U.unassignedStaff},true)`;
  expect(await as(U.unassignedStaff,tx=>tx`INSERT INTO property_media(property_id) VALUES(${assigned}) RETURNING id`)).toHaveLength(1);
 });
 it('revokes the broken unchecked publisher entrypoint rather than relying on its missing view field', async () => {
  const key=await create(U.staff); const before=(await sql`SELECT count(*)::int AS count FROM properties`)[0].count;
  for(const actor of [U.staff,U.outsider,U.admin,null]) await expect(as(actor,tx=>tx`SELECT publish_property_to_marketplace(${key})`)).rejects.toThrow(/permission denied/);
  expect((await sql`SELECT count(*)::int AS count FROM properties`)[0].count).toBe(before);
  expect((await sql`SELECT approval_status,is_active FROM properties WHERE id=${key}`)[0]).toEqual({approval_status:'draft',is_active:false});
 });
 it('preserves all six fractional digits when binding opaque PostgreSQL revision strings',async()=>{
  const token='2026-10-19T07:36:06.811163+00:00';
  const [roundtrip]=await sql`SELECT to_char(${token}::text::timestamptz,'US') AS microseconds`;
  expect(roundtrip.microseconds).toBe('811163');
 });
 it('advances the exact opaque revision on consecutive definer saves in a single transaction', async () => {
  const key=await create(U.staff);const initial=await version(key);
  await as(U.staff,async tx=>{
   const a=(await tx`SELECT save_managed_property_draft_checked(${key},${initial}::text::timestamptz,'{}',false) AS row`)[0].row;
   const b=(await tx`SELECT save_managed_property_draft_checked(${key},${a.updated_at}::text::timestamptz,'{}',true) AS row`)[0].row;
   expect(a.updated_at).not.toBe(initial);expect(b.updated_at).not.toBe(a.updated_at);
  });
  await expect(review(U.admin,key,'approve',initial)).rejects.toThrow(/changed/);
 });
 it('allows at most one concurrent review of the same pending version', async () => {
  const key=await property(); await save(U.editor,key,{},true); const expected=await version(key);
  const results=await Promise.allSettled([review(U.admin,key,'approve',expected),review(U.admin,key,'reject',expected,'Needs work')]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(results.filter(result=>result.status==='rejected')).toHaveLength(1);
  expect(await sql`SELECT actor_id FROM property_activity_log WHERE property_id=${key} AND actor_id=${U.admin}`).toHaveLength(1);
 });
 it('rejects invalid actor-supplied type conversion instead of partially saving', async () => {
  const key=await property();
  await expect(save(U.editor,key,{title_en:'Bad patch',price_per_night:'not-a-number'})).rejects.toThrow();
  expect((await sql`SELECT title_en FROM properties WHERE id=${key}`)[0].title_en).toBe('Synthetic villa');
 });
 it.each(['owner_id','content_author_user_id','provider_id','management_company_id','reviewed_by','approved_by','is_active','approval_status','lock_code','ownership_verification_status'])('rejects protected %s in checked patch and direct API update', async field => {
  const key=await property();
  const value = field==='is_active' ? true : field==='approval_status' ? 'approved' : field.endsWith('_id') || field.endsWith('_by') ? U.editor : 'forged';
  await expect(save(U.editor,key,{[field]:value})).rejects.toThrow(/unsupported/);
  await expect(as(U.editor,tx=>tx`UPDATE properties SET ${tx({[field]:value})} WHERE id=${key}`)).rejects.toThrow(/protected|inactive|employee/);
 });
 it('separates property content, tariff and booking authority and accepts unchanged protected-category values', async () => {
  const key=await property({price_per_night:100,instant_booking:false});
  await expect(save(U.editor,key,{price_per_night:200})).rejects.toThrow(/pricing edit/);
  await expect(save(U.editor,key,{instant_booking:true})).rejects.toThrow(/bookings edit/);
  await expect(as(U.editor,tx=>tx`UPDATE properties SET price_per_night=200 WHERE id=${key}`)).rejects.toThrow(/pricing edit/);
  expect(await save(U.editor,key,{title_en:'Content edit',price_per_night:100,instant_booking:false})).toMatchObject({id:key});
  await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES (${C},${U.editor},'pricing',true,true,false)`;
  try {
   expect(await save(U.editor,key,{price_per_night:200})).toMatchObject({id:key});
   expect((await as(U.editor,tx=>tx`SELECT actor_can_operate_property(${key},${C},'finance','edit') AS allowed`))[0].allowed).toBe(false);
   expect((await as(U.editor,tx=>tx`SELECT actor_can_operate_property(${key},${C},'pricing','edit') AS allowed`))[0].allowed).toBe(false);
   await expect(save(U.editor,key,{instant_booking:true})).rejects.toThrow(/bookings edit/);
   await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES (${C},${U.editor},'bookings',true,true,false)`;
   expect(await save(U.editor,key,{instant_booking:true})).toMatchObject({id:key});
  } finally { await sql`DELETE FROM team_member_permissions WHERE user_id=${U.editor} AND module IN ('pricing','bookings')`; }
 });
 it('rejects arbitrary cross-company complex/private-project links and preserves established project relationships', async () => {
  const key=await property(); const same=id(401),foreign=id(402),listed=id(403),privateProject=id(404);
  await sql`INSERT INTO property_complexes VALUES (${same},${C},true),(${foreign},${OTHER},true)`;
  await sql`INSERT INTO property_projects VALUES (${listed},${OTHER},true,true,true),(${privateProject},${OTHER},true,false,false)`;
  await expect(save(U.editor,key,{complex_id:foreign})).rejects.toThrow(/same-company/);
  await expect(save(U.editor,key,{project_id:privateProject})).rejects.toThrow(/publicly approved/);
  expect(await save(U.editor,key,{complex_id:same,project_id:listed})).toMatchObject({id:key});
  await expect(save(U.editor,key,{project_id:null})).rejects.toThrow(/separate authorization/);
 });
 it('requires properties-edit even if legacy RLS grants readable writable company rows', async () => {
  const key=await property();
  await expect(as(U.viewer,tx=>tx`UPDATE properties SET title_en='forged' WHERE id=${key}`)).rejects.toThrow(/edit permission/);
  await expect(save(U.viewer,key,{title_en:'forged'})).rejects.toThrow(/edit permission/);
 });
 it('cannot bypass checked creation by inserting an approved row or claiming ownership', async () => {
  await expect(as(U.editor,tx=>tx`INSERT INTO properties(management_company_id,owner_id,is_active,approval_status) VALUES(${C},${U.editor},true,'approved')`)).rejects.toThrow(/checked creation/);
 });
 it('rejects stale draft save, preserving a newer writer and version', async () => {
  const key=await property(); const old=await version(key);
  await save(U.editor,key,{title_en:'Newer'},false,old);
  await expect(save(U.editor,key,{title_en:'Stale'},false,old)).rejects.toThrow(/changed/);
  expect((await sql`SELECT title_en FROM properties WHERE id=${key}`)[0].title_en).toBe('Newer');
 });
 it('freezes pending and approved rows against employee autosave and publication toggles', async () => {
  for(const state of ['pending','approved']) {
   const key=await property({approval_status:state,is_active:state==='approved'});
   await expect(save(U.editor,key,{title_en:'Unreviewed'})).rejects.toThrow(/locked/);
   await expect(as(U.editor,tx=>tx`UPDATE properties SET title_en='Unreviewed' WHERE id=${key}`)).rejects.toThrow(/locked/);
  }
 });
 it('freezes creator pending content and keeps only the safe review readback after publication', async () => {
  const key=await create(U.staff);await save(U.staff,key,{},true);
  expect(await read(U.staff,key)).toMatchObject({approval_status:'pending',is_active:false});
  await expect(save(U.staff,key,{title_en:'Changed during review'})).rejects.toThrow(/locked/);
  await review(U.admin,key);
  expect(await read(U.staff,key)).toMatchObject({approval_status:'approved',is_active:true});
  await expect(save(U.staff,key,{title_en:'Changed after publication'})).rejects.toThrow(/locked/);
 });
 it('requires platform admin and current pending version; stale review cannot publish unseen content', async () => {
  const key=await property(); await save(U.editor,key,{},true); const pending=await version(key);
  await expect(review(U.editor,key,'approve',pending)).rejects.toThrow(/platform admin/);
  await as(U.admin,tx=>tx`UPDATE properties SET title_en='Changed by another admin' WHERE id=${key}`);
  await expect(review(U.admin,key,'approve',pending)).rejects.toThrow(/changed/);
  expect((await sql`SELECT is_active FROM properties WHERE id=${key}`)[0].is_active).toBe(false);
 });
 it('publishes only after approve, returns canonical state and records actor/version audit atomically', async () => {
  const key=await property();
  expect(await as(null,tx=>tx`SELECT id FROM public_property_catalog WHERE id=${key}`)).toHaveLength(0);
  const submitted=await save(U.editor,key,{title_en:'Reviewed title'},true);
  expect(submitted).toMatchObject({approval_status:'pending',is_active:false});
  expect(await as(null,tx=>tx`SELECT id FROM public_property_catalog WHERE id=${key}`)).toHaveLength(0);
  const approved=await review(U.admin,key,'approve',submitted.updated_at);
  expect(approved).toMatchObject({id:key,approval_status:'approved',is_active:true,approved_by:U.admin,reviewed_by:U.admin});
  expect(await as(null,tx=>tx`SELECT title_en FROM public_property_catalog WHERE id=${key}`)).toEqual([{title_en:'Reviewed title'}]);
  const audit=await sql`SELECT actor_id,details FROM property_activity_log WHERE property_id=${key} ORDER BY created_at`;
  expect(audit.map(a=>a.actor_id)).toEqual([U.editor,U.admin]);
  expect(audit[1].details).toMatchObject({from_status:'pending',to_status:'approved',reviewed_version:submitted.updated_at});
  await expect(review(U.admin,key)).rejects.toThrow(/pending/);
 });
 it('rejects with a reason; employee can revise rejected content and resubmit without editing review evidence', async () => {
  const key=await property(); await save(U.editor,key,{},true);
  await expect(review(U.admin,key,'reject')).rejects.toThrow(/reason/);
  await review(U.admin,key,'reject',undefined,'Please add photos');
  const draft=await save(U.editor,key,{images:['https://example.invalid/synthetic.jpg']});
  expect(draft).toMatchObject({approval_status:'draft',is_active:false});
  expect((await sql`SELECT rejection_reason FROM properties WHERE id=${key}`)[0].rejection_reason).toBe('Please add photos');
  expect(await save(U.editor,key,{},true)).toMatchObject({approval_status:'pending'});
 });
 it('preserves independently verified owner/provider/admin updates under their existing RLS', async () => {
  const owned=await property({owner_id:U.owner,approval_status:'approved',is_active:true});
  const supplied=await property({provider_id:id(90),approval_status:'approved',is_active:true});
  expect(await as(U.owner,tx=>tx`UPDATE properties SET title_en='Owner update' WHERE id=${owned} RETURNING id`)).toHaveLength(1);
  expect(await as(U.provider,tx=>tx`UPDATE properties SET title_en='Provider update' WHERE id=${supplied} RETURNING id`)).toHaveLength(1);
  expect(await as(U.admin,tx=>tx`UPDATE properties SET title_en='Admin update' WHERE id=${supplied} RETURNING id`)).toHaveLength(1);
  await expect(save(U.outsider,supplied,{})).rejects.toThrow(/unavailable/);
 });
 it('allows scoped pending alerts but denies employment-alone, unrelated, published and missing rows', async () => {
  const key=await property(); await save(U.editor,key,{},true);
  const can=(actor:string,p=key)=>as(actor,async tx=>(await tx`SELECT actor_can_notify_property_submission(${p}) AS allowed`)[0].allowed);
  expect(await can(U.editor)).toBe(true); expect(await can(U.admin)).toBe(true);
  for(const actor of [U.team,U.viewer,U.outsider,U.unassignedStaff]) expect(await can(actor)).toBe(false);
  await review(U.admin,key); expect(await can(U.editor)).toBe(false); expect(await can(U.admin,id(999999))).toBe(false);
 });
 it('closes inherited membership-only task reads and writes for the newly invited content-only staff', async () => {
  const key=await create(U.staff);
  await sql`INSERT INTO property_operational_tasks(property_id,payload) VALUES(${key},'private task')`;
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_operational_tasks WHERE property_id=${key}`)).toHaveLength(0);
  await expect(as(U.staff,tx=>tx`INSERT INTO property_operational_tasks(property_id) VALUES(${key})`)).rejects.toThrow(/row-level/);
  expect(await as(U.staff,tx=>tx`UPDATE property_operational_tasks SET payload='forged' WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
  expect(await as(U.staff,tx=>tx`DELETE FROM property_operational_tasks WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
  await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES(${C},${U.staff},'tasks',true,true,false)`;
  try {
   await expect(as(U.staff,tx=>tx`INSERT INTO property_operational_tasks(property_id) VALUES(${key})`)).rejects.toThrow(/row-level/);
   await sql`INSERT INTO property_manager_assignments(property_id,manager_user_id,is_active) VALUES(${key},${U.staff},true)`;
   expect(await as(U.staff,tx=>tx`INSERT INTO property_operational_tasks(property_id) VALUES(${key}) RETURNING id`)).toHaveLength(1);
   await sql`UPDATE management_company_members SET is_active=false WHERE user_id=${U.staff}`;
   expect(await as(U.staff,tx=>tx`SELECT id FROM property_operational_tasks WHERE property_id=${key}`)).toHaveLength(0);
  } finally {
   await sql`UPDATE management_company_members SET is_active=true WHERE user_id=${U.staff}`;
   await sql`DELETE FROM property_manager_assignments WHERE property_id=${key}`;
   await sql`DELETE FROM team_member_permissions WHERE user_id=${U.staff} AND module='tasks'`;
  }
 });
 it('preserves existing owner and nonemployee task-assignee policy paths while adding no new task grant', async () => {
  const owned=await property({owner_id:U.owner});const external=await property({provider_id:id(90)});
  expect(await as(U.owner,tx=>tx`INSERT INTO property_operational_tasks(property_id) VALUES(${owned}) RETURNING id`)).toHaveLength(1);
  await sql`INSERT INTO property_operational_tasks(property_id,assigned_to) VALUES(${external},${U.provider}),(${external},${U.outsider}),(${external},${U.admin})`;
  for(const actor of [U.provider,U.outsider,U.admin]) {
   expect(await as(actor,tx=>tx`SELECT id FROM property_operational_tasks WHERE property_id=${external} AND assigned_to=${actor}`)).toHaveLength(1);
   expect(await as(actor,tx=>tx`UPDATE property_operational_tasks SET payload='permitted' WHERE property_id=${external} AND assigned_to=${actor} RETURNING id`)).toHaveLength(1);
  }
  // Ceiling alone is not a permissive grant, even for the preserved platform admin.
  expect((await as(U.admin,tx=>tx`SELECT actor_employee_task_capability_ceiling(${external},'edit') AS allowed`))[0].allowed).toBe(true);
  expect((await as(U.team,tx=>tx`SELECT actor_employee_task_capability_ceiling(${external},'edit') AS allowed`))[0].allowed).toBe(false);
 });
 it.each(sensitiveTables)('denies raw %s operations to content-only staff without opening legacy portal policies', async table => {
  const key=await create(U.staff);
  const row={property_id:key,payload:'private',owner_user_id:U.owner,sender_id:U.staff,sender_role:'mc',inspector_id:U.staff,uploaded_by:U.staff};
  await sql`INSERT INTO ${sql(table)} ${sql(row)}`;
  expect(await as(U.staff,tx=>tx`SELECT id FROM ${tx(table)} WHERE property_id=${key}`)).toHaveLength(0);
  await expect(as(U.staff,tx=>tx`INSERT INTO ${tx(table)} ${tx(row)}`)).rejects.toThrow(/row-level/);
  expect(await as(U.staff,tx=>tx`UPDATE ${tx(table)} SET payload='forged' WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
  expect(await as(U.staff,tx=>tx`DELETE FROM ${tx(table)} WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
 });
 it('preserves existing operational manager checks, rejects reparenting and does not repair reversed portal grants', async () => {
  const key=await property();const outside=await property();
  await sql`UPDATE operating_space_properties SET operating_space_id=${UNAUTHORIZED_SPACE} WHERE property_id=${outside}`;
  for(const table of ['property_documents','inventory_inspections']) {
   expect(await as(U.editor,tx=>tx`INSERT INTO ${tx(table)}(property_id) VALUES(${key}) RETURNING id`)).toHaveLength(1);
   await expect(as(U.editor,tx=>tx`UPDATE ${tx(table)} SET property_id=${outside} WHERE property_id=${key}`)).rejects.toThrow(/row-level/);
  }
  await expect(as(U.editor,tx=>tx`INSERT INTO owner_portal_settings(property_id,owner_user_id) VALUES(${key},${U.owner})`)).rejects.toThrow(/row-level/);
  await expect(as(U.editor,tx=>tx`INSERT INTO portal_messages(property_id,sender_id,sender_role) VALUES(${key},${U.editor},'mc')`)).rejects.toThrow(/row-level/);
 });
 it.each(['property_documents','inventory_inspections'])('requires live operational module and membership for assigned staff on %s', async table => {
  const key=await create(U.staff);
  await sql`INSERT INTO property_manager_assignments(property_id,manager_user_id,is_active) VALUES(${key},${U.staff},true)`;
  try {
   expect(await as(U.staff,tx=>tx`INSERT INTO ${tx(table)}(property_id) VALUES(${key}) RETURNING id`)).toHaveLength(1);
   await sql`UPDATE team_member_permissions SET can_view=false,can_edit=false WHERE user_id=${U.staff} AND module='properties'`;
   expect(await as(U.staff,tx=>tx`SELECT id FROM ${tx(table)} WHERE property_id=${key}`)).toHaveLength(0);
   await expect(as(U.staff,tx=>tx`INSERT INTO ${tx(table)}(property_id) VALUES(${key})`)).rejects.toThrow(/row-level/);
   await sql`UPDATE team_member_permissions SET can_view=true,can_edit=true WHERE user_id=${U.staff} AND module='properties'`;
   await sql`UPDATE management_company_members SET is_active=false WHERE user_id=${U.staff}`;
   expect(await as(U.staff,tx=>tx`SELECT id FROM ${tx(table)} WHERE property_id=${key}`)).toHaveLength(0);
  } finally {
   await sql`UPDATE management_company_members SET is_active=true WHERE user_id=${U.staff}`;
   await sql`UPDATE team_member_permissions SET can_view=true,can_edit=true WHERE user_id=${U.staff} AND module='properties'`;
   await sql`DELETE FROM property_manager_assignments WHERE property_id=${key}`;
  }
 });
 it('preserves independent owner, provider, admin and nonemployee inspector/uploader ceiling paths without granting new access', async () => {
  const key=await property({owner_id:U.owner,provider_id:id(90)});
  for(const actor of [U.owner,U.provider,U.admin,U.outsider]) {
   expect((await as(actor,tx=>tx`SELECT actor_employee_property_capability_ceiling(${key},'view') AS allowed`))[0].allowed).toBe(true);
  }
  expect(await as(U.owner,tx=>tx`INSERT INTO property_documents(property_id,uploaded_by) VALUES(${key},${U.owner}) RETURNING id`)).toHaveLength(1);
  expect(await as(U.admin,tx=>tx`INSERT INTO inventory_inspections(property_id) VALUES(${key}) RETURNING id`)).toHaveLength(1);
  await sql`INSERT INTO property_documents(property_id,uploaded_by) VALUES(${key},${U.outsider})`;
  await sql`INSERT INTO inventory_inspections(property_id,inspector_id) VALUES(${key},${U.outsider})`;
  expect(await as(U.outsider,tx=>tx`SELECT id FROM property_documents WHERE uploaded_by=${U.outsider} AND property_id=${key}`)).toHaveLength(1);
  expect(await as(U.outsider,tx=>tx`SELECT id FROM inventory_inspections WHERE inspector_id=${U.outsider} AND property_id=${key}`)).toHaveLength(1);
  await sql`INSERT INTO owner_portal_settings(property_id,owner_user_id) VALUES(${key},${U.owner})`;
  expect(await as(U.owner,tx=>tx`INSERT INTO portal_messages(property_id,sender_id,sender_role) VALUES(${key},${U.owner},'owner') RETURNING id`)).toHaveLength(1);
  expect((await as(U.team,tx=>tx`SELECT actor_employee_property_capability_ceiling(${key},'view') AS allowed`))[0].allowed).toBe(false);
 });
 it('permits only the explicit platform-admin authoring delegation subset for active same-company targets', async () => {
  const grant=(actor:string,target=U.unassignedStaff,company=C,module='pricing',extra:Record<string,unknown>={})=>as(actor,tx=>tx`INSERT INTO team_member_permissions ${tx({company_id:company,user_id:target,module,can_view:true,can_edit:true,can_export:false,sub_permissions:{},granted_by:actor,...extra})} RETURNING user_id`);
  await sql`UPDATE management_companies SET operating_spaces_enforced=false WHERE id=${C}`;
  try { await expect(grant(U.admin)).rejects.toThrow(/row-level/); }
  finally { await sql`UPDATE management_companies SET operating_spaces_enforced=true WHERE id=${C}`; }
  expect(await grant(U.admin)).toHaveLength(1);
  expect(await as(U.admin,tx=>tx`UPDATE team_member_permissions SET can_edit=false,granted_by=${U.admin} WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing' RETURNING user_id`)).toHaveLength(1);
  await expect(grant(U.team,U.viewer)).rejects.toThrow(/row-level/);
  await expect(grant(U.editor,U.viewer)).rejects.toThrow(/row-level/);
  await expect(grant(U.admin,U.inactive)).rejects.toThrow(/row-level/);
  await expect(grant(U.admin,U.staff,OTHER)).rejects.toThrow(/row-level/);
  await expect(grant(U.admin,U.staff,C,'finance')).rejects.toThrow(/row-level/);
  await expect(grant(U.admin,U.staff,C,'pricing',{can_export:true})).rejects.toThrow(/row-level/);
  await expect(grant(U.admin,U.staff,C,'pricing',{sub_permissions:{all:true}})).rejects.toThrow(/row-level/);
  expect(await as(U.admin,tx=>tx`DELETE FROM team_member_permissions WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing' RETURNING user_id`)).toHaveLength(0);
  await sql`UPDATE team_member_permissions SET can_export=true WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing'`;
  expect(await as(U.admin,tx=>tx`UPDATE team_member_permissions SET can_edit=true,granted_by=${U.admin} WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing' RETURNING user_id`)).toHaveLength(0);
  expect((await sql`SELECT can_export FROM team_member_permissions WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing'`)[0].can_export).toBe(true);
  await sql`DELETE FROM team_member_permissions WHERE company_id=${C} AND user_id=${U.unassignedStaff} AND module='pricing'`;
 });
 it('leaves independent company-admin permission management under its existing policy', async () => {
  const director=id(990),member=id(991);
  await sql`INSERT INTO auth.users VALUES(${director})`;
  await sql`INSERT INTO management_company_members VALUES(${member},${C},${director},'director',true)`;
  expect(await as(director,tx=>tx`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES(${C},${U.staff},'finance',true,true,true) RETURNING user_id`)).toHaveLength(1);
  expect(await as(director,tx=>tx`DELETE FROM team_member_permissions WHERE company_id=${C} AND user_id=${U.staff} AND module='finance' RETURNING user_id`)).toHaveLength(1);
 });
 it('rolls back the property transition if the trusted audit append fails', async () => {
  const key=await create(U.staff);const initial=await version(key);
  await sql.unsafe("ALTER TABLE property_activity_log ADD CONSTRAINT test_audit_failure CHECK(action<>'managed_property_publication_changed') NOT VALID");
  try {
   await expect(save(U.staff,key,{title_en:'Must roll back'},true)).rejects.toThrow(/test_audit_failure/);
   expect((await sql`SELECT title_en,approval_status FROM properties WHERE id=${key}`)[0]).toEqual({title_en:'New villa',approval_status:'draft'});
   expect(await version(key)).toBe(initial);
  } finally { await sql.unsafe('ALTER TABLE property_activity_log DROP CONSTRAINT test_audit_failure'); }
 });
 it('denies anonymous execution and forged publication audit actions while preserving legacy log actions', async () => {
  const key=await property();
  await expect(as(null,tx=>tx`SELECT save_managed_property_draft_checked(${key},now(),'{}',false)`)).rejects.toThrow(/permission denied/);
  for(const action of ['managed_property_draft_created','managed_property_publication_changed']) {
   await expect(as(U.editor,tx=>tx`INSERT INTO property_activity_log(property_id,actor_id,action) VALUES(${key},${U.admin},${action})`)).rejects.toThrow(/row-level/);
  }
  await as(U.editor,tx=>tx`INSERT INTO property_activity_log(property_id,actor_id,action) VALUES(${key},${U.editor},'legacy_note')`);
  expect(await sql`SELECT action FROM property_activity_log WHERE property_id=${key} AND action='legacy_note'`).toHaveLength(1);
 });
 describe('published property revision proposals', () => {
  async function published(patch: Record<string, unknown> = {}) {
   return property({content_author_user_id:U.staff,approval_status:'approved',is_active:true,...patch});
  }
  async function revisionRead(actor:string,key:string) {
   return as(actor,async tx=>(await tx`SELECT read_managed_property_revision_checked(${key}) AS state`)[0].state);
  }
  async function revisionSave(actor:string,key:string,patch:Record<string,postgres.JSONValue>,submit=false,expected?:{property:{updated_at:string};revision:{version:string}|null},restart=false) {
   const state=expected??await revisionRead(actor,key);
   return as(actor,async tx=>(await tx`SELECT save_managed_property_revision_checked(${key},${state.property.updated_at}::text::timestamptz,${state.revision?.version??null}::uuid,${tx.json(patch)},${submit},${restart}) AS state`)[0].state);
  }
  async function revisionReview(key:string,decision='approve',expected?:{property:{updated_at:string};revision:{version:string}},reason:string|null=null,actor=U.admin) {
   const state=expected??await revisionRead(actor,key);
   return as(actor,async tx=>(await tx`SELECT review_managed_property_revision_checked(${key},${state.property.updated_at}::text::timestamptz,${state.revision?.version??null}::uuid,${decision},${reason}) AS state`)[0].state);
  }
  it('saves and submits proposals without changing public canonical data or assignment authority',async()=>{
   const key=await published({title_en:'Published title',price_per_night:100,lock_code:'private'});
   const original=(await sql`SELECT to_jsonb(p)-ARRAY['publication_revision','updated_at'] AS row FROM properties p WHERE id=${key}`)[0].row;
   const draft=await revisionSave(U.staff,key,{title_en:'New title'});
   expect(draft.revision).toMatchObject({status:'draft',patch:{title_en:'New title'}});
   const pending=await revisionSave(U.staff,key,{},true);
   expect(pending).toMatchObject({property:{title_en:'Published title',is_active:true,approval_status:'approved'},revision:{status:'pending'},conflict:false});
   expect((await sql`SELECT to_jsonb(p)-ARRAY['publication_revision','updated_at'] AS row FROM properties p WHERE id=${key}`)[0].row).toEqual(original);
   expect((await as(null,tx=>tx`SELECT title_en FROM public_property_catalog WHERE id=${key}`))[0].title_en).toBe('Published title');
   expect(await as(U.staff,tx=>tx`SELECT id FROM properties WHERE id=${key}`)).toHaveLength(0);
   expect(await sql`SELECT property_id FROM property_manager_assignments WHERE property_id=${key}`).toHaveLength(0);
   expect(pending.revision).not.toHaveProperty('base_fingerprint');
   expect(pending.property).not.toHaveProperty('lock_code');
   expect(pending.revision.base).not.toHaveProperty('lock_code');
   expect(pending.revision).not.toHaveProperty('author_id');
   // Approved/active rows remain publicly readable through explicit safe columns,
   // but neither anonymous nor unrelated signed-in users can read the proposal.
   expect((await as(null,tx=>tx`SELECT title_en FROM properties WHERE id=${key}`))[0].title_en).toBe('Published title');
   await expect(as(null,tx=>tx`SELECT publication_revision FROM properties WHERE id=${key}`)).rejects.toThrow(/permission denied/);
   await expect(as(null,tx=>tx`SELECT * FROM properties WHERE id=${key}`)).rejects.toThrow(/permission denied/);
   expect(await as(U.outsider,tx=>tx`SELECT publication_revision FROM properties WHERE id=${key}`)).toHaveLength(0);
   expect((await as(null,tx=>tx`SELECT to_jsonb(c) AS row FROM public_property_catalog c WHERE id=${key}`))[0].row).not.toHaveProperty('publication_revision');
  });
  it('atomically approves exactly the reviewed content and preserves publication, ownership and company',async()=>{
   const key=await published({owner_id:U.owner,provider_id:id(90),title_en:'Old title'});
   const pending=await revisionSave(U.staff,key,{title_en:'Reviewed title',description_en:'Reviewed text'},true);
   const accepted=await revisionReview(key,'approve',pending);
   expect(accepted).toMatchObject({property:{title_en:'Reviewed title',description_en:'Reviewed text',approval_status:'approved',is_active:true},revision:{status:'approved'},conflict:false});
   expect((await sql`SELECT owner_id,provider_id,management_company_id FROM properties WHERE id=${key}`)[0]).toEqual({owner_id:U.owner,provider_id:id(90),management_company_id:C});
   expect((await as(null,tx=>tx`SELECT title_en FROM public_property_catalog WHERE id=${key}`))[0].title_en).toBe('Reviewed title');
   const audit=(await sql`SELECT details,actor_id FROM property_activity_log WHERE property_id=${key} AND action='managed_property_revision_changed' ORDER BY created_at DESC LIMIT 1`)[0];
   expect(audit.actor_id).toBe(U.admin);expect(audit.details.from_version).toBe(pending.revision.version);
   expect(audit.details.revision.patch).toEqual({title_en:'Reviewed title',description_en:'Reviewed text'});
   expect(audit.details.revision).not.toHaveProperty('base_fingerprint');
   await expect(revisionReview(key,'approve',pending)).rejects.toThrow(/changed/);
  });
  it('requires a return reason, keeps published content and supports correction/resubmission',async()=>{
   const key=await published({title_en:'Public'});
   const pending=await revisionSave(U.staff,key,{title_en:'First proposal'},true);
   await expect(revisionReview(key,'reject',pending)).rejects.toThrow(/reason/);
   const rejected=await revisionReview(key,'reject',pending,'Please fix the title');
   expect(rejected).toMatchObject({property:{title_en:'Public',is_active:true},revision:{status:'rejected',reason:'Please fix the title'}});
   const corrected=await revisionSave(U.staff,key,{title_en:'Corrected'},true);
   expect(corrected.revision).toMatchObject({status:'pending',patch:{title_en:'Corrected'}});
   expect(corrected.revision).not.toHaveProperty('reason');
  });
  it('freezes a pending proposal even when a restart is requested',async()=>{
   const key=await published();const pending=await revisionSave(U.staff,key,{title_en:'Pending'},true);
   await expect(revisionSave(U.staff,key,{title_en:'Different'},false,pending)).rejects.toThrow(/locked/);
   await expect(revisionSave(U.staff,key,{},false,pending,true)).rejects.toThrow(/locked/);
  });
  it('requires current row and proposal CAS independently and permits only one concurrent save',async()=>{
   const key=await published();const initial=await revisionRead(U.staff,key);
   const outcomes=await Promise.allSettled([revisionSave(U.staff,key,{title_en:'A'},false,initial),revisionSave(U.staff,key,{title_en:'B'},false,initial)]);
   expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);
   expect(outcomes.filter(r=>r.status==='rejected')).toHaveLength(1);
   const current=await revisionRead(U.staff,key);
   await expect(revisionSave(U.staff,key,{title_en:'Forged version'},false,{...current,revision:{version:id(999)}})).rejects.toThrow(/changed/);
   await expect(revisionSave(U.staff,key,{title_en:'Stale row'},false,{...current,property:initial.property})).rejects.toThrow(/changed/);
  });
  it('permits at most one concurrent exact-version review',async()=>{
   const key=await published();const pending=await revisionSave(U.staff,key,{title_en:'New title'},true);
   const outcomes=await Promise.allSettled([revisionReview(key,'approve',pending),revisionReview(key,'reject',pending,'Needs changes')]);
   expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(outcomes.filter(r=>r.status==='rejected')).toHaveLength(1);
   expect(await sql`SELECT actor_id FROM property_activity_log WHERE property_id=${key} AND action='managed_property_revision_changed' AND actor_id=${U.admin}`).toHaveLength(1);
  });
  it('detects independent live changes even after reloading the current row timestamp',async()=>{
   const key=await published({owner_id:U.owner,title_en:'Before'});
   await revisionSave(U.staff,key,{title_en:'Employee proposal'},true);
   await as(U.owner,tx=>tx`UPDATE properties SET title_en='Owner changed live title' WHERE id=${key}`);
   const current=await revisionRead(U.admin,key);expect(current.conflict).toBe(true);
   await expect(revisionReview(key,'approve',current)).rejects.toThrow(/published property changed/);
   expect((await sql`SELECT title_en FROM properties WHERE id=${key}`)[0].title_en).toBe('Owner changed live title');
   await revisionReview(key,'reject',current,'Please review the current public title');
   await expect(revisionSave(U.staff,key,{description_en:'New detail'})).rejects.toThrow(/explicitly restart/);
   const restarted=await revisionSave(U.staff,key,{},false,undefined,true);
   expect(restarted).toMatchObject({revision:{status:'draft',patch:{},base:{title_en:'Owner changed live title'}},conflict:false});
  });
  it('does not confuse proposal-only updates with canonical changes and fingerprints are timezone stable',async()=>{
   const key=await published();const draft=await revisionSave(U.staff,key,{title_en:'First'});
   const timezoneRead=await as(U.staff,async tx=>{
    await tx.unsafe("SET LOCAL TimeZone='Asia/Bangkok'");
    return (await tx`SELECT read_managed_property_revision_checked(${key}) AS state`)[0].state;
   });
   expect(timezoneRead.conflict).toBe(false);
   const pending=await revisionSave(U.staff,key,{description_en:'Second'},true,draft);
   const accepted=await as(U.admin,async tx=>{
    await tx.unsafe("SET LOCAL TimeZone='America/Los_Angeles'");
    return (await tx`SELECT review_managed_property_revision_checked(${key},${pending.property.updated_at}::text::timestamptz,${pending.revision.version}::uuid,'approve',NULL) AS state`)[0].state;
   });
   expect(accepted.property.title_en).toBe('First');expect(accepted.property.description_en).toBe('Second');
  });
  it('normalizes district before displaying the exact proposal and retains post-trigger equality',async()=>{
   const key=await published({district:'Patong'});
   const pending=await revisionSave(U.staff,key,{district:' bang-tao '},true);
   expect(pending.revision.patch.district).toBe('Bang Tao');
   expect((await revisionReview(key,'approve',pending)).property.district).toBe('Bang Tao');
  });
  it('preserves separate pricing and bookings permissions in proposed content',async()=>{
   const key=await published({price_per_night:100,instant_booking:false});
   await expect(revisionSave(U.staff,key,{price_per_night:200})).rejects.toThrow(/pricing edit/);
   await expect(revisionSave(U.staff,key,{instant_booking:true})).rejects.toThrow(/bookings edit/);
   await sql`INSERT INTO team_member_permissions(company_id,user_id,module,can_view,can_edit,can_export) VALUES(${C},${U.staff},'pricing',true,true,false)`;
   try {
    expect((await revisionSave(U.staff,key,{price_per_night:200})).revision.patch.price_per_night).toBe(200);
    await expect(revisionSave(U.staff,key,{instant_booking:true})).rejects.toThrow(/bookings edit/);
    await sql`UPDATE team_member_permissions SET can_edit=false WHERE user_id=${U.staff} AND module='pricing'`;
    await expect(revisionSave(U.staff,key,{title_en:'Otherwise harmless'})).rejects.toThrow(/pricing edit/);
   } finally {await sql`DELETE FROM team_member_permissions WHERE user_id=${U.staff} AND module='pricing'`;}
  });
  it.each([U.viewer,U.team,U.outsider,U.unassignedStaff,U.inactive])('denies unauthorized revision actor %s',async actor=>{
   const key=await published();const initial=await revisionRead(U.staff,key);
   await expect(revisionSave(actor,key,{title_en:'Unauthorized'},false,initial)).rejects.toThrow(/permission|unavailable/);
   await expect(revisionReview(key,'approve',{...initial,revision:{version:id(999)}},null,actor)).rejects.toThrow(/platform admin/);
  });
  it('rechecks active company and Space membership rather than trusting creator identity',async()=>{
   const key=await published();const initial=await revisionRead(U.staff,key);
   await sql`UPDATE operating_space_members SET is_active=false WHERE company_member_id IN (SELECT id FROM management_company_members WHERE user_id=${U.staff})`;
   try {
    await expect(revisionRead(U.staff,key)).rejects.toThrow(/unavailable/);
    await expect(revisionSave(U.staff,key,{title_en:'After revocation'},false,initial)).rejects.toThrow(/unavailable/);
   } finally {await sql`UPDATE operating_space_members SET is_active=true WHERE company_member_id IN (SELECT id FROM management_company_members WHERE user_id=${U.staff})`;}
   await sql`UPDATE operating_space_properties SET operating_space_id=${UNAUTHORIZED_SPACE} WHERE property_id=${key}`;
   await expect(revisionRead(U.staff,key)).rejects.toThrow(/unavailable/);
  });
  it.each(['owner_id','provider_id','management_company_id','approval_status','is_active','publication_revision','lock_code'])('rejects protected revision field %s',async field=>{
   const key=await published();await expect(revisionSave(U.staff,key,{[field]:'forged'})).rejects.toThrow(/unsupported/);
  });
  it('blocks direct envelope forgery by independent owner/provider/admin without removing their canonical rights',async()=>{
   const key=await published({owner_id:U.owner,provider_id:id(90)});
   for(const actor of [U.owner,U.provider,U.admin]) {
    await expect(as(actor,tx=>tx`UPDATE properties SET publication_revision='{"status":"approved"}' WHERE id=${key}`)).rejects.toThrow(/checked workflow/);
    expect(await as(actor,tx=>tx`UPDATE properties SET title_en='Existing independent writer' WHERE id=${key} RETURNING id`)).toHaveLength(1);
   }
  });
  it('blocks empty submission, unpublished properties and anonymous calls',async()=>{
   const key=await published();await expect(revisionSave(U.staff,key,{},true)).rejects.toThrow(/changed content/);
   await as(U.admin,tx=>tx`UPDATE properties SET is_active=false WHERE id=${key}`);
   await expect(revisionRead(U.staff,key)).rejects.toThrow(/published/);
   await expect(as(null,tx=>tx`SELECT read_managed_property_revision_checked(${key})`)).rejects.toThrow(/permission denied/);
   await expect(as(null,tx=>tx`SELECT list_managed_property_revisions_checked()`)).rejects.toThrow(/permission denied/);
  });
  it('limits the pending queue to authenticated platform admins with bounded pagination',async()=>{
   const key=await published();await revisionSave(U.staff,key,{title_en:'Queue proposal'},true);
   const rows=await as(U.admin,tx=>tx`SELECT list_managed_property_revisions_checked(100,0) AS row`);
   expect(rows.some(r=>r.row.property.id===key)).toBe(true);
   await expect(as(U.staff,tx=>tx`SELECT list_managed_property_revisions_checked()`)).rejects.toThrow(/platform admin/);
   await expect(as(U.admin,tx=>tx`SELECT list_managed_property_revisions_checked(101,0)`)).rejects.toThrow(/bounded/);
  });
  it('rolls back proposal and approval when audit append fails',async()=>{
   const key=await published();let before=await version(key);
   await sql.unsafe("ALTER TABLE property_activity_log ADD CONSTRAINT test_revision_audit_failure CHECK(action<>'managed_property_revision_changed') NOT VALID");
   try {
    await expect(revisionSave(U.staff,key,{title_en:'Cannot save'})).rejects.toThrow(/test_revision_audit_failure/);
    expect(await version(key)).toBe(before);expect((await revisionRead(U.staff,key)).revision).toBeNull();
   } finally {await sql.unsafe('ALTER TABLE property_activity_log DROP CONSTRAINT test_revision_audit_failure');}
   const pending=await revisionSave(U.staff,key,{title_en:'Cannot approve'},true);before=await version(key);
   await sql.unsafe("ALTER TABLE property_activity_log ADD CONSTRAINT test_revision_audit_failure CHECK(action<>'managed_property_revision_changed') NOT VALID");
   try {
    await expect(revisionReview(key,'approve',pending)).rejects.toThrow(/test_revision_audit_failure/);
    expect(await version(key)).toBe(before);expect((await revisionRead(U.staff,key)).revision.status).toBe('pending');
    expect((await sql`SELECT title_en FROM properties WHERE id=${key}`)[0].title_en).toBe('Synthetic villa');
   } finally {await sql.unsafe('ALTER TABLE property_activity_log DROP CONSTRAINT test_revision_audit_failure');}
  });
  it('rejects a persisted envelope changed by an unexpected BEFORE trigger',async()=>{
   const key=await published();const before=await version(key);
   await sql.unsafe(`CREATE FUNCTION public.test_drop_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.publication_revision:=NULL; RETURN NEW; END $$;
    CREATE TRIGGER zzzz_test_drop_revision BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION test_drop_revision();`);
   try {
    await expect(revisionSave(U.staff,key,{title_en:'Drop must not succeed'})).rejects.toThrow(/revision save changed/);
    expect(await version(key)).toBe(before);expect((await revisionRead(U.staff,key)).revision).toBeNull();
   } finally {await sql.unsafe('DROP TRIGGER zzzz_test_drop_revision ON properties; DROP FUNCTION test_drop_revision();');}
  });
  it('reserves audit actions against client forgery',async()=>{
   const key=await published();
   await expect(as(U.staff,tx=>tx`INSERT INTO property_activity_log(property_id,actor_id,action) VALUES(${key},${U.admin},'managed_property_revision_changed')`)).rejects.toThrow(/row-level/);
  });
 });

 it('preserves the narrower deployed admin-only inspection policy without restoring historical member grants', async () => {
  for(const name of ['MC members can view inspections','MC members can insert inspections','MC members can update inspections','MC admins can delete inspections']) {
   await sql.unsafe(`DROP POLICY "${name}" ON public.inventory_inspections`);
  }
  await sql.unsafe(sourcePolicy('supabase/migrations/20260419023631_9bc7abe6-d740-480a-bfa8-179629f4dff7.sql','Admins manage inspections'));
  const policies=await sql`SELECT policyname,permissive FROM pg_policies
   WHERE schemaname='public' AND tablename='inventory_inspections' ORDER BY policyname`;
  expect(policies.filter(policy=>policy.permissive==='PERMISSIVE')).toEqual([
   {policyname:'Admins manage inspections',permissive:'PERMISSIVE'},
  ]);
  expect(policies.filter(policy=>policy.permissive==='RESTRICTIVE')).toHaveLength(4);
  const key=await property();
  expect(await as(U.admin,tx=>tx`INSERT INTO inventory_inspections(property_id,inspector_id) VALUES(${key},${U.outsider}) RETURNING id`)).toHaveLength(1);
  for(const actor of [U.editor,U.staff,U.team,U.outsider]) {
   expect(await as(actor,tx=>tx`SELECT id FROM inventory_inspections WHERE property_id=${key}`)).toHaveLength(0);
   await expect(as(actor,tx=>tx`INSERT INTO inventory_inspections(property_id,inspector_id) VALUES(${key},${actor})`)).rejects.toThrow(/row-level/);
   expect(await as(actor,tx=>tx`UPDATE inventory_inspections SET payload='forged' WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
   expect(await as(actor,tx=>tx`DELETE FROM inventory_inspections WHERE property_id=${key} RETURNING id`)).toHaveLength(0);
  }
 });
 // Keep last: the fail-closed rollback intentionally revokes checked workflow RPCs.
 it('rolls back with meters absent while retaining all surviving operational ceilings', async () => {
  const key=await create(U.staff);
  await sql`INSERT INTO property_documents(property_id,uploaded_by) VALUES(${key},${U.staff})`;
  const before=await sql`SELECT tablename,policyname,permissive,cmd,qual,with_check FROM pg_policies
   WHERE schemaname='public' AND policyname LIKE 'employee_%_ceiling' ORDER BY tablename,policyname`;
  expect(before).toHaveLength(20); // Four commands on four surviving tables plus tasks.
  await applyTransactionScript(sql,readFileSync('docs/hardening/rollback/employee_property_publication.candidate.sql','utf8'));
  expect((await sql`SELECT to_regclass('public.property_meters') AS table_name`)[0].table_name).toBeNull();
  expect(await sql`SELECT tablename,policyname,permissive,cmd,qual,with_check FROM pg_policies
   WHERE schemaname='public' AND policyname LIKE 'employee_%_ceiling' ORDER BY tablename,policyname`).toEqual(before);
  expect(await as(U.staff,tx=>tx`SELECT id FROM property_documents WHERE property_id=${key}`)).toHaveLength(0);
  await expect(as(U.staff,tx=>tx`INSERT INTO property_documents(property_id,uploaded_by) VALUES(${key},${U.staff})`)).rejects.toThrow(/row-level/);
  await expect(read(U.staff,key)).rejects.toThrow(/permission denied/);
  await expect(save(U.staff,key,{title_en:'Blocked by rollback'})).rejects.toThrow(/permission denied/);
 });
});
