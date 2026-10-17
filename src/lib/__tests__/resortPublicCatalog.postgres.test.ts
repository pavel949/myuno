import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

// Synthetic local PostgreSQL only. No hosted credentials, guests or business writes.
let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
const root = process.getuid?.() === 0;
const owner = root ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
function run(bin: string, args: string[]) {
  const exe = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
  return root ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' }) : execFileSync(exe, args, { encoding: 'utf8' });
}
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
async function as<T>(role: 'anon' | 'authenticated', actor: string, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await tx`SELECT set_config('request.jwt.claim.sub',${actor},true)`;
    return fn(tx);
  }) as Promise<T>;
}
beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(),'resort-catalog-'));
  chmodSync(directory,0o700); if(root) chownSync(directory,65534,65534);
  run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55446 -c listen_addresses=''${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);
  started=true;
  sql=postgres({host:directory,port:55446,database:'postgres',username:owner,password:'',max:2,onnotice:()=>{}});
  await sql.unsafe(`
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
    GRANT USAGE ON SCHEMA public TO anon,authenticated,service_role;
    CREATE TABLE properties(id uuid PRIMARY KEY,is_active boolean,approval_status text,deleted_at timestamptz);
    CREATE VIEW public_property_catalog WITH(security_barrier=true) AS SELECT id FROM properties WHERE is_active AND approval_status='approved' AND deleted_at IS NULL;
    GRANT SELECT ON public_property_catalog TO anon,authenticated,service_role;
    CREATE TABLE property_room_categories(id uuid,property_id uuid,name_en text,name_ru text,base_price_per_night numeric,min_stay_nights integer,max_guests integer,is_active boolean,sort_order integer,private_note text);
    CREATE TABLE property_rate_plans(id uuid,category_id uuid,name_en text,name_ru text,adjustment_type text,adjustment_value numeric,is_refundable boolean,free_cancellation_days integer,min_stay_nights integer,max_stay_nights integer,min_advance_days integer,is_active boolean,private_note text);
    CREATE TABLE property_rate_seasons(category_id uuid,property_id uuid,start_date date,end_date date,nightly_rate numeric,min_stay_nights integer,is_active boolean,currency text,owner_id uuid,notes text);
    CREATE TABLE property_stay_restrictions(property_id uuid,category_id uuid,date date,price_override numeric,min_stay_nights integer,closed_to_arrival boolean,closed_to_departure boolean,stop_sell boolean,private_note text);
    GRANT SELECT,INSERT,UPDATE,DELETE ON property_room_categories,property_rate_plans,property_rate_seasons,property_stay_restrictions TO authenticated;
    GRANT SELECT ON property_room_categories,property_rate_plans,property_rate_seasons,property_stay_restrictions TO anon;
    ALTER TABLE property_room_categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE property_rate_plans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE property_rate_seasons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE property_stay_restrictions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read active categories" ON property_room_categories FOR SELECT TO anon,authenticated USING(is_active);
    CREATE POLICY "Public read active rate plans" ON property_rate_plans FOR SELECT TO anon,authenticated USING(is_active);
    CREATE POLICY "Public read active rate seasons of active properties" ON property_rate_seasons FOR SELECT TO anon,authenticated USING(is_active);
    CREATE POLICY "Public read restrictions" ON property_stay_restrictions FOR SELECT TO anon,authenticated USING(true);
    CREATE POLICY managers ON property_room_categories FOR ALL TO authenticated USING(current_setting('request.jwt.claim.sub',true)='manager') WITH CHECK(current_setting('request.jwt.claim.sub',true)='manager');
    CREATE FUNCTION get_category_availability(uuid,date,date) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT 2 $$;
    INSERT INTO properties VALUES('${id(1)}',true,'approved',null),('${id(2)}',true,'pending',null),('${id(3)}',false,'approved',null),('${id(4)}',true,'approved',now());
    INSERT INTO property_room_categories SELECT '${id(10)}', '${id(1)}','Deluxe','Deluxe',3000,1,2,true,0,'PRIVATE';
    INSERT INTO property_room_categories SELECT '${id(11)}', '${id(1)}','Inactive','Inactive',3000,1,2,false,0,'PRIVATE';
    INSERT INTO property_room_categories SELECT '${id(12)}', '${id(2)}','Pending','Pending',3000,1,2,true,0,'PRIVATE';
    INSERT INTO property_room_categories SELECT '${id(13)}', '${id(3)}','Inactive parent','Inactive parent',3000,1,2,true,0,'PRIVATE';
    INSERT INTO property_room_categories SELECT '${id(14)}', '${id(4)}','Deleted','Deleted',3000,1,2,true,0,'PRIVATE';
    INSERT INTO property_rate_plans VALUES('${id(20)}','${id(10)}','Flexible','Flexible','percent',0,true,3,null,null,null,true,'PRIVATE'),('${id(21)}','${id(10)}','Off','Off','percent',0,true,3,null,null,null,false,'PRIVATE'),('${id(22)}','${id(12)}','Pending','Pending','percent',0,true,3,null,null,null,true,'PRIVATE');
    INSERT INTO property_rate_seasons VALUES('${id(10)}','${id(1)}','2026-11-10','2026-11-30',4000,1,true,'THB','${id(99)}','PRIVATE'),('${id(10)}','${id(2)}','2026-11-10','2026-11-30',5000,1,true,'THB','${id(99)}','PRIVATE'),('${id(10)}','${id(1)}','2026-11-10','2026-11-30',6000,1,true,'USD','${id(99)}','PRIVATE'),('${id(10)}','${id(1)}','2026-11-10','2026-11-30',7000,1,false,'THB','${id(99)}','PRIVATE');
    INSERT INTO property_stay_restrictions VALUES('${id(1)}',null,'2026-11-10',null,2,false,false,true,'PRIVATE'),('${id(1)}','${id(10)}','2026-11-11',5000,1,false,false,false,'PRIVATE'),('${id(1)}','${id(12)}','2026-11-12',6000,1,false,false,false,'PRIVATE'),('${id(2)}',null,'2026-11-13',7000,1,false,false,false,'PRIVATE'),('${id(1)}','${id(11)}','2026-11-14',8000,1,false,false,false,'PRIVATE');
  `);
  await sql.unsafe(readFileSync('docs/convergence/resort-public-projection.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe('public resort contract',()=>{
 it('anon and signed-in stranger/team see only active categories of published parents',async()=>{
  for(const [role,actor] of [['anon',''],['authenticated','stranger'],['authenticated','uno_team']] as const){
   const rows=await as(role,actor,tx=>tx`SELECT id FROM public_room_category_catalog`);expect(rows.map(r=>r.id)).toEqual([id(10)]);
  }
 });
 it('plans and THB seasons bind to active category and same public property',async()=>{
  expect(await as('anon','',tx=>tx`SELECT id FROM public_room_rate_plan_catalog`)).toEqual([{id:id(20)}]);
  expect(await as('authenticated','stranger',tx=>tx`SELECT nightly_rate FROM public_room_rate_season_catalog`)).toEqual([{nightly_rate:'4000'}]);
 });
 it('only property-wide and same-property active-category rules are public',async()=>{
  const rows=await as('anon','',tx=>tx`SELECT date::text AS date,stop_sell FROM public_room_stay_rule_catalog ORDER BY date`);
  expect(rows).toEqual([{date:'2026-11-10',stop_sell:true},{date:'2026-11-11',stop_sell:false}]);
 });
 it('full projection responses cannot disclose private columns or mutate configuration',async()=>{
  for(const view of ['public_room_category_catalog','public_room_rate_plan_catalog','public_room_rate_season_catalog','public_room_stay_rule_catalog']){
   const rows=await as('anon','',tx=>tx.unsafe(`SELECT * FROM ${view}`));expect(rows.length).toBeGreaterThan(0);
   for(const row of rows)for(const column of ['owner_id','notes','private_note','created_at','updated_at','meal_plan'])expect(row).not.toHaveProperty(column);
   expect((await sql`SELECT has_table_privilege('authenticated',${view},'INSERT,UPDATE,DELETE') allowed`)[0].allowed).toBe(false);
  }
  await expect(as('authenticated','manager',tx=>tx`UPDATE public_room_category_catalog SET name_en='forged'`)).rejects.toThrow(/permission denied/);
 });
 it('base public rows stay private while legitimate manager reads/writes remain',async()=>{
  expect(await as('anon','',tx=>tx`SELECT * FROM property_rate_seasons`)).toEqual([]);
  expect(await as('authenticated','uno_team',tx=>tx`SELECT * FROM property_room_categories`)).toEqual([]);
  expect((await as('authenticated','manager',tx=>tx`SELECT private_note FROM property_room_categories`)).length).toBe(5);
  expect((await as('authenticated','manager',tx=>tx`UPDATE property_room_categories SET name_ru=name_ru WHERE id=${id(10)} RETURNING id`)).length).toBe(1);
 });
 it('public availability reveals aggregate only for public categories and rejects invalid dates',async()=>{
  expect((await as('anon','',tx=>tx`SELECT get_public_room_category_availability(${id(10)},'2026-11-10','2026-11-13') n`))[0].n).toBe(2);
  expect((await as('anon','',tx=>tx`SELECT get_public_room_category_availability(${id(12)},'2026-11-10','2026-11-13') n`))[0].n).toBeNull();
  await expect(as('anon','',tx=>tx`SELECT get_public_room_category_availability(${id(10)},'2026-11-13','2026-11-10')`)).rejects.toThrow(/Invalid stay dates/);
 });
});
