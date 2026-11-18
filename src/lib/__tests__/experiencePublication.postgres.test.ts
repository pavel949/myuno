import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { chmodSync, chownSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import postgres from 'postgres';

describe('experience publication boundaries — socket-only isolated PostgreSQL', () => {
  let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
  const root = process.getuid?.() === 0;
  const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
  const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
  const run = (bin: string, args: string[]) => root
    ? execFileSync('runuser', ['-u', 'nobody', '--', join(pgRoot, 'bin', bin), ...args])
    : execFileSync(join(pgRoot, 'bin', bin), args);
  const base = 'scripts/qa/fixtures/experience-security';
  const file = (name: string) => readFileSync(join(base,name),'utf8');
  const body = (name: string) => file(name).split('BEGIN;')[1].split('COMMIT;')[0];
  const uid = (n:number) => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  const as = (role:string, query:string, user='') => sql.begin(async tx => {
    await tx.unsafe(`SET LOCAL ROLE ${role}`);
    await tx`SELECT set_config('request.jwt.claim.sub',${user},true)`;
    return tx.unsafe(query);
  });
  let prepatchList:number, prepatchRPC:number;
  let prepatchAdminUpdateCode: string | undefined;
  let policiesBefore: unknown;
  beforeAll(async () => {
    directory=mkdtempSync(join(tmpdir(),'experience-security-pg-')); chmodSync(directory,0o700);
    if(root) chownSync(directory,65534,65534);
    run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
    run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'server.log'),'-o',`-k ${directory} -h '' -p 55448${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
    sql=postgres({host:directory,port:55448,database:'postgres',username:root?'nobody':process.env.USER,max:1});
    await sql.unsafe(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO anon,authenticated;
      CREATE TYPE app_role AS ENUM('admin');
      CREATE TABLE user_roles(user_id uuid,role app_role);
      CREATE TABLE providers(id uuid,user_id uuid);
      CREATE TABLE listings(id uuid PRIMARY KEY,vertical text NOT NULL,is_active boolean,approval_status text,attributes jsonb,provider_id uuid,is_verified boolean DEFAULT false, name_en text, name_ru text, price numeric, category text, slug text, is_featured boolean DEFAULT false, review_count integer DEFAULT 0, persona_tags text[], i18n jsonb, created_at timestamptz, updated_at timestamptz);
      CREATE TABLE life_situations(id uuid PRIMARY KEY,code text,is_active boolean);
      CREATE TABLE catalog_life_map(entity_type text,entity_id uuid,life_situation_id uuid,weight integer,role_scope text[],rules jsonb);
      GRANT SELECT ON providers TO authenticated;
      GRANT SELECT,INSERT,UPDATE,DELETE ON listings TO anon,authenticated;
      GRANT SELECT ON life_situations,catalog_life_map TO anon,authenticated;
      ALTER TABLE listings ENABLE ROW LEVEL SECURITY;`);
    for(const r of JSON.parse(file('listings-functions-snapshot.json')).rows) await sql.unsafe(r.definition);
    for(const p of JSON.parse(file('listings-policies-snapshot.json')).rows){
      const roles=p.roles.slice(1,-1);
      await sql.unsafe(`CREATE POLICY ${p.policyname} ON listings FOR ${p.cmd} TO ${roles}${p.qual?` USING (${p.qual})`:''}${p.with_check?` WITH CHECK (${p.with_check})`:''}`);
    }
    // Synthetic projection of fields used by exact live resolver. Invoker semantics match live view.
    await sql.unsafe(`CREATE VIEW life_os_catalog WITH(security_invoker=true) AS
      SELECT vertical AS entity_type,id::text AS entity_id,name_en AS title,name_en AS title_ru,price,'THB'::text AS currency,'synthetic'::text AS location,provider_id::text,'standard'::text AS trust_level FROM listings WHERE is_active=true;
      GRANT SELECT ON life_os_catalog TO anon,authenticated;`);
    for(const r of JSON.parse(file('listings-rpc-snapshot.json')).rows) await sql.unsafe(r.definition);
    await sql.unsafe(`INSERT INTO user_roles VALUES('${uid(900)}','admin'); INSERT INTO providers VALUES('${uid(800)}','${uid(901)}');
      INSERT INTO life_situations VALUES('${uid(700)}','family',true);`);
    const rows=[
      ['experience',true,'approved',{status:'published'},null],
      ['experience',true,'approved',{status:'draft'},uid(800)],
      ['experience',true,'approved',{status:'published',operating_status:' Temporarily_Closed '},null],
      ['experience',true,null,{status:'published'},null],
      ['experience',false,'approved',{status:'published'},null],
      ['experience',true,'approved',{status:'draft'},null],
      ['restaurant',true,null,{status:'draft',operating_status:'closed'},null],
      ['restaurant',true,'pending',{},null],
    ];
    for(let i=0;i<rows.length;i++){
      const [vertical,active,approval,attrs,provider]=rows[i];
      await sql`INSERT INTO listings(id,vertical,is_active,approval_status,attributes,provider_id,name_en,price) VALUES(${uid(i+1)},${vertical as string},${active as boolean},${approval as string|null},${sql.json(attrs as postgres.JSONValue)}::jsonb,${provider as string|null},${`synthetic${i+1}`},100)`;
      await sql`INSERT INTO catalog_life_map VALUES(${vertical as string},${uid(i+1)},${uid(700)},90,NULL,'{}')`;
    }
    prepatchList=(await as('anon',"SELECT id FROM listings WHERE vertical='experience'")).length;
    prepatchRPC=(await as('anon',"SELECT * FROM resolve_life_os_context('family') WHERE entity_type='experience'")).length;
    try { await as('authenticated',`UPDATE listings SET name_en=name_en WHERE id='${uid(6)}' RETURNING id`,uid(900)); } catch(error) { prepatchAdminUpdateCode=(error as {code?:string}).code; }
    policiesBefore=await sql`SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE tablename='listings' AND policyname NOT IN ('listings_public_read','listings_provider_update') ORDER BY policyname`;
    await sql.unsafe(body('experience-public-rls-proposal.sql'));
    await sql.unsafe(body('experience-rpc-public-proposal.sql'));
    await sql.unsafe(body('listings-provider-update-proposal.sql'));
  },30000);
  afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
  it('reproduces existing recursive UPDATE policy before any fix',()=>{expect(prepatchAdminUpdateCode).toBe('42P17');});
  it('reproduces pre-fix draft/closed leak in direct SELECT and definer RPC',()=>{expect(prepatchList).toBe(5);expect(prepatchRPC).toBe(5);});
  it.each([['anon',''],['authenticated',uid(902)]])('limits %s direct listings without changing other vertical public gate',async(role,user)=>{
    expect((await as(role,'SELECT id FROM listings ORDER BY id',user)).map(r=>r.id)).toEqual([uid(1),uid(7)]);
  });
  it('provider sees own draft but not another draft',async()=>{
    expect((await as('authenticated','SELECT id FROM listings ORDER BY id',uid(901))).map(r=>r.id)).toEqual([uid(1),uid(2),uid(7)]);
  });
  it('admin reads and edits draft; editor policies unchanged',async()=>{
    expect(await as('authenticated','SELECT id FROM listings',uid(900))).toHaveLength(8);
    expect(await as('authenticated',`UPDATE listings SET name_en=name_en WHERE id='${uid(6)}' RETURNING id`,uid(900))).toHaveLength(1);
    expect(await sql`SELECT policyname,roles,cmd,qual,with_check FROM pg_policies WHERE tablename='listings' AND policyname NOT IN ('listings_public_read','listings_provider_update') ORDER BY policyname`).toEqual(policiesBefore);
  });
  it.each([['anon',''],['authenticated',uid(902)],['authenticated',uid(901)],['authenticated',uid(900)]])('public discovery RPC applies same publication gate for %s',async(role,user)=>{
    const rows=await as(role,"SELECT * FROM resolve_life_os_context('family') ORDER BY entity_id",user);
    // Old definer behavior for restaurant (including pending) deliberately unchanged by narrow fix.
    expect(rows.map(r=>r.entity_id)).toEqual([uid(1),uid(7),uid(8)]);
    expect((await as(role,"SELECT * FROM count_life_os_context()",user))[0].item_count).toBe('3');
  });
  it('ordinary visitor cannot mutate listings',async()=>{expect(await as('authenticated','UPDATE listings SET name_en=name_en RETURNING id',uid(902))).toHaveLength(0);});
  it('provider can edit descriptive content of own draft without changing approval',async()=>{
    const result=await as('authenticated',`UPDATE listings SET name_en='Provider description',price=250,attributes=attributes || '{"highlights":["Recorded highlight"]}'::jsonb WHERE id='${uid(2)}' RETURNING id,approval_status`,uid(901));
    expect(result).toHaveLength(1);expect(result[0].approval_status).toBe('approved');
  });
  it.each([
    "is_verified=true", "approval_status='approved-new'", "provider_id=null", "id='00000000-0000-0000-0000-000000000099'",
    "vertical='restaurant'", "category='system-category'", "slug='new-slug'", "is_featured=true", "review_count=100", "is_active=false",
    "persona_tags=ARRAY['vip']", "i18n='{\"claim\":true}'::jsonb", "created_at=now()",
    "attributes=attributes || '{\"status\":\"published\"}'::jsonb", "attributes=attributes || '{\"operating_status\":\"open\"}'::jsonb",
    "attributes=attributes || '{\"booking_url\":\"https://unapproved.example\"}'::jsonb", "attributes=attributes || '{\"commission\":100}'::jsonb",
    "attributes=attributes || '{\"unknown_future_key\":true}'::jsonb", "attributes='[]'::jsonb", "attributes=null"
  ])('denies provider privilege/content escape: %s',async assignment=>{
    await expect(as('authenticated',`UPDATE listings SET ${assignment} WHERE id='${uid(2)}' RETURNING id`,uid(901))).rejects.toMatchObject({code:'42501'});
  });
  it('nonowner and anon cannot edit another listing',async()=>{
    expect(await as('authenticated',`UPDATE listings SET name_en='No' WHERE id='${uid(6)}' RETURNING id`,uid(901))).toHaveLength(0);
    expect(await as('anon',`UPDATE listings SET name_en='No' RETURNING id`)).toHaveLength(0);
  });
});
