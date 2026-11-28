import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';

let directory:string, started=false;
let sql:ReturnType<typeof postgres>;
const root=process.getuid?.()===0;
const username=root?'nobody':process.env.USER||'agent';
const bin=process.env.POSTGRES_TEST_BIN_DIR||(()=>{try{return dirname(execFileSync('which',['postgres'],{encoding:'utf8'}).trim());}catch{return execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim();}})();
const port=55574;
function run(name:string,args:string[]){return root?execFileSync('runuser',['-u',username,'--',join(bin,name),...args],{encoding:'utf8'}):execFileSync(join(bin,name),args,{encoding:'utf8'});}
const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const owner=uuid(1), other=uuid(2), employee=uuid(3), admin=uuid(4), inactiveAdmin=uuid(5), provider=uuid(6);
const dir='docs/hardening/public-read-boundaries';
async function apply(path:string){const c=await sql.reserve();try{await c.unsafe(readFileSync(path,'utf8'));}catch(error){await c.unsafe('ROLLBACK');throw error;}finally{c.release();}}
async function actor<T>(role:'anon'|'authenticated',uid:string|null,fn:(c:postgres.TransactionSql)=>Promise<T>){
  return sql.begin(async c=>{await c.unsafe(`SET LOCAL ROLE ${role}`);await c`SELECT set_config('request.jwt.claim.sub',${uid||''},true)`;return fn(c);});
}
beforeAll(async()=>{
  directory=mkdtempSync(join(tmpdir(),'myuno-public-boundary-'));chmodSync(directory,0o700);if(root)chownSync(directory,65534,65534);
  const init=['-D',join(directory,'data'),'-A','trust','--no-locale'];if(process.env.POSTGRES_TEST_SHARE_DIR)init.push('-L',process.env.POSTGRES_TEST_SHARE_DIR);
  run('initdb',init);const lib=process.env.POSTGRES_TEST_LIB_DIR;
  run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p ${port} -c listen_addresses=''${lib?` -c dynamic_library_path=${lib}`:''}`,'-w','start']);
  started=true;sql=postgres({host:directory,port,username,database:'postgres',password:'',max:4});
  await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/public-read-boundaries-base.sql','utf8'));
  await sql`INSERT INTO fixture_roles VALUES(${employee},'uno_team',true),(${admin},'admin',true),(${inactiveAdmin},'admin',false)`;
  await sql`INSERT INTO providers VALUES(${provider},${owner})`;
  await sql`INSERT INTO gyms VALUES(${uuid(10)},${provider},true,'approved'),(${uuid(11)},${provider},true,'pending'),(${uuid(12)},${provider},false,'approved')`;
  await sql`INSERT INTO legal_services SELECT * FROM gyms`;
  await sql`INSERT INTO storage.objects(bucket_id,name,owner_id) SELECT id,'own.png',${owner} FROM storage.buckets`;
  await sql`INSERT INTO storage.objects(bucket_id,name,owner_id) SELECT id,'other.png',${other} FROM storage.buckets`;
  expect(await actor('anon',null,c=>c`SELECT id FROM gyms`)).toHaveLength(3);
  expect(await actor('anon',null,c=>c`SELECT name FROM storage.objects`)).toHaveLength(24);
  await apply(dir+'/catalogue-forward.sql');await apply(dir+'/storage-forward.sql');
},30000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe.sequential('review-only public read boundaries',()=>{
  it('guest and ordinary employee see only active approved catalogue records',async()=>{
    for(const [role,id] of [['anon',null],['authenticated',other],['authenticated',employee]] as const){
      expect(await actor(role,id,c=>c`SELECT id FROM gyms`)).toHaveLength(1);
      expect(await actor(role,id,c=>c`SELECT id FROM legal_services`)).toHaveLength(1);
    }
  });
  it('preserves provider own reads and active admin moderation without granting employment-only global reads',async()=>{
    expect(await actor('authenticated',owner,c=>c`SELECT id FROM gyms`)).toHaveLength(3);
    expect(await actor('authenticated',owner,c=>c`SELECT id FROM legal_services`)).toHaveLength(3);
    expect(await actor('authenticated',admin,c=>c`SELECT id FROM legal_services`)).toHaveLength(3);
    expect(await actor('authenticated',inactiveAdmin,c=>c`SELECT id FROM legal_services`)).toHaveLength(1);
  });
  it('anonymous API enumeration blocked for all twelve targeted buckets',async()=>{
    expect(await actor('anon',null,c=>c`SELECT name FROM storage.objects`)).toHaveLength(0);
  });
  it('owner reads own target files and private fixture policy remains intact',async()=>{
    const rows=await actor('authenticated',owner,c=>c`SELECT bucket_id,name FROM storage.objects`);
    expect(rows).toHaveLength(13);expect(rows.every(r=>r.name==='own.png')).toBe(true);
    expect(rows.some(r=>r.bucket_id==='fixture-private')).toBe(true);
    expect(rows.some(r=>r.bucket_id==='intake-uploads'||r.bucket_id==='property-care')).toBe(false);
  });
  it('employment-only and inactive admin cannot enumerate others; active admin sees target files only',async()=>{
    expect(await actor('authenticated',employee,c=>c`SELECT name FROM storage.objects`)).toHaveLength(0);
    expect(await actor('authenticated',inactiveAdmin,c=>c`SELECT name FROM storage.objects`)).toHaveLength(0);
    expect(await actor('authenticated',admin,c=>c`SELECT name FROM storage.objects`)).toHaveLength(24);
  });
  it('preserves admitted owner insert, upsert and delete but not another owner file',async()=>{
    await actor('authenticated',owner,async c=>{
      await c`INSERT INTO storage.objects VALUES('property-images','new.png',${owner})`;
      await c`INSERT INTO storage.objects VALUES('property-images','new.png',${owner}) ON CONFLICT(bucket_id,name) DO UPDATE SET owner_id=EXCLUDED.owner_id`;
      expect(await c`DELETE FROM storage.objects WHERE bucket_id='property-images' AND name='other.png' RETURNING name`).toHaveLength(0);
      expect(await c`DELETE FROM storage.objects WHERE bucket_id='property-images' AND name='new.png' RETURNING name`).toHaveLength(1);
    });
  });
  it('refuses stale repeat rather than overwriting drifted policies',async()=>{
    await expect(apply(dir+'/catalogue-forward.sql')).rejects.toThrow('policy drift');
    await expect(apply(dir+'/storage-forward.sql')).rejects.toThrow('policy/bucket drift');
  });
});
