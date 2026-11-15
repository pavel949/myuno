import { before,after,beforeEach,test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import postgres from 'postgres';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,provider=id(1),ids=Array.from({length:24},(_,i)=>id(100+i));
let directory,sql,started=false;
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8'});
const source=readFileSync('docs/hardening/production-readiness/configure-ignatev-recipients.sql','utf8');
const closure=readFileSync('supabase/migrations/20261115102726_restrict_unchecked_payment_recipient_mutations.sql','utf8');
async function configure(scope=ids,role=null){return sql.begin(async tx=>{
 if(role)await tx.unsafe(`SET LOCAL ROLE ${role}`);
 await tx`SELECT set_config('myuno.approved_recipient_property_ids',${'{'+scope.join(',')+'}'},true),set_config('myuno.approved_recipient_provider_id',${provider},true)`;
 await tx.unsafe(source);
});}
before(async()=>{
 directory=mkdtempSync(path.join(tmpdir(),'myuno-recipient-config-'));
 run('initdb',['-D',path.join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',path.join(directory,'data'),'-l',path.join(directory,'log'),'-o',`-k ${directory} -p 55523 -c listen_addresses=''`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55523,database:'postgres',username:process.env.USER||'agent',max:1,onnotice:()=>{}});
 await sql.unsafe(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;
 CREATE TABLE providers(id uuid PRIMARY KEY,name text,is_demo boolean,approval_status text);
 CREATE TABLE orgs(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,org_type text,is_active boolean,is_verified boolean,metadata jsonb);
 CREATE TABLE properties(id uuid PRIMARY KEY,provider_id uuid REFERENCES providers(id),is_active boolean,management_company_id uuid,owner_id uuid);
 CREATE TABLE provider_org_links(provider_id uuid UNIQUE REFERENCES providers(id),org_id uuid REFERENCES orgs(id));
 CREATE VIEW public_property_catalog AS SELECT id FROM properties WHERE is_active;
 CREATE TABLE orders(id uuid PRIMARY KEY,total_amount numeric,status text);
 GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON provider_org_links TO authenticated`);
 const helper=readFileSync('docs/hardening/production-readiness/managed-booking.sql','utf8').split('CREATE OR REPLACE FUNCTION public.create_managed_property_booking_checked')[0];
 await sql.unsafe(helper+'\nCOMMIT;');await sql.unsafe(closure);
}, {timeout:30000});
after(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',path.join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
beforeEach(async()=>{
 await sql.unsafe('TRUNCATE properties,provider_org_links,orgs,providers,orders CASCADE');
 await sql`INSERT INTO providers VALUES(${provider},'Ignatev Estate',false,'pending')`;
 for(const property of ids)await sql`INSERT INTO properties VALUES(${property},NULL,true,${id(10)},${id(11)})`;
 await sql`INSERT INTO orders VALUES(${id(900)},9500,'pending')`;
});
test('one private recipient, one binding and 24 properties; replay preserves history and publication',async()=>{
 await configure();await configure();
 const orgs=await sql`SELECT name,is_verified FROM orgs`;assert.deepEqual([...orgs],[{name:'Ignatev Estate Co., LTD',is_verified:false}]);
 assert.equal((await sql`SELECT id FROM properties WHERE private_property_payment_recipient(id) IS NOT NULL`).length,24);
 assert.equal((await sql`SELECT * FROM provider_org_links`).length,1);
 assert.equal((await sql`SELECT * FROM properties WHERE management_company_id=${id(10)} AND owner_id=${id(11)}`).length,24);
 assert.deepEqual([...(await sql`SELECT status,total_amount FROM orders`)],[{status:'pending',total_amount:'9500'}]);
 assert.deepEqual([...(await sql`SELECT approval_status FROM providers`)],[{approval_status:'pending'}]);
});
test('incomplete manifest cannot configure a subset silently',async()=>{await assert.rejects(configure(ids.slice(1)),/manifest_required/);assert.equal((await sql`SELECT id FROM orgs`).length,0);});
test('duplicate IDs cannot masquerade as 24 approved properties',async()=>{await assert.rejects(configure([...ids.slice(1),ids[1]]),/manifest_required/);});
test('existing foreign property recipient is preserved for review',async()=>{
 await sql`INSERT INTO providers VALUES(${id(2)},'Other',false,'pending')`;await sql`UPDATE properties SET provider_id=${id(2)} WHERE id=${ids[0]}`;
 await assert.rejects(configure(),/context_changed/);assert.equal((await sql`SELECT id FROM orgs`).length,0);
});
test('existing different provider-org binding is never overwritten',async()=>{
 await sql`INSERT INTO orgs(id,name,is_active) VALUES(${id(3)},'Other',true)`;await sql`INSERT INTO provider_org_links VALUES(${provider},${id(3)})`;
 await assert.rejects(configure(),/binding_requires_review/);assert.deepEqual([...(await sql`SELECT org_id FROM provider_org_links`)],[{org_id:id(3)}]);
});
test('broad staff writes must be contained before creating a trusted binding',async()=>{
 await sql.unsafe('GRANT UPDATE ON provider_org_links TO authenticated');
 try{await assert.rejects(configure(),/containment_required/);assert.equal((await sql`SELECT id FROM orgs`).length,0);}finally{await sql.unsafe(closure);}
});
test('a catalogue visibility change rolls the complete configuration back',async()=>{
 await sql.unsafe('CREATE OR REPLACE VIEW public_property_catalog AS SELECT id FROM properties WHERE is_active AND provider_id IS NULL');
 try{await assert.rejects(configure(),/visibility_changed/);assert.equal((await sql`SELECT id FROM orgs`).length,0);assert.equal((await sql`SELECT id FROM properties WHERE provider_id IS NOT NULL`).length,0);}
 finally{await sql.unsafe('CREATE OR REPLACE VIEW public_property_catalog AS SELECT id FROM properties WHERE is_active');}
});
test('binding cannot silently affect a property outside the approved manifest',async()=>{
 await sql`INSERT INTO properties(id,provider_id,is_active) VALUES(${id(999)},${provider},false)`;await assert.rejects(configure(),/unapproved_properties/);
});
test('an authenticated browser role cannot execute the operator configuration',async()=>{await assert.rejects(configure(ids,'authenticated'),/operator_connection_required/);assert.equal((await sql`SELECT id FROM orgs`).length,0);});
