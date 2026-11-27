import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const [repo,migrationPath,runtimeRoot]=process.argv.slice(2);
if(!repo||!migrationPath||!runtimeRoot)throw Error('Usage: node check-admin-integrity.mjs REPO MIGRATION PGLITE_ROOT');
const require=createRequire(path.join(path.resolve(runtimeRoot),'package.json'));
const {PGlite}=require('@electric-sql/pglite');
const db=new PGlite();
let checks=0;
const check=(name,fn)=>Promise.resolve().then(fn).then(()=>{checks++;console.log('PASS '+name);});
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const tableFixture=await readFile(path.join(repo,'src/lib/__tests__/fixtures/uno-team-live-catalog.sql'),'utf8');
await db.exec(tableFixture.split('\n').filter(l=>l.startsWith('CREATE TYPE ')).join('\n'));
await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
for(const table of ['providers','categories','services','salons','project_units']){
 const line=tableFixture.split('\n').find(l=>l.startsWith('CREATE TABLE "public"."'+table+'" '));
 assert.ok(line,'Source schema for '+table);await db.exec(line);
}
await db.exec(`ALTER TABLE project_units ADD CHECK(status IN('available','reserved','sold','held','unknown'));
ALTER TABLE project_units ADD CHECK(unit_status IN('available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale','unknown'));
ALTER TABLE project_units ALTER COLUMN status SET DEFAULT 'available';
ALTER TABLE project_units ALTER COLUMN unit_status SET DEFAULT 'available';
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
INSERT INTO providers(id,name,is_active,approval_status,is_demo,phone,email) VALUES
('${id(1)}','Real',true,'approved',false,'private-phone','private-email'),
('${id(2)}','Demo',true,'approved',true,null,null),
('${id(3)}','Pending',true,'pending',false,null,null),
('${id(4)}','Inactive',false,'approved',false,null,null);
INSERT INTO categories(id,name_en,name_ru,slug,is_active) VALUES
('${id(10)}','Active','Активная','active',true),('${id(11)}','Hidden','Скрытая','hidden',false);
INSERT INTO services(id,provider_id,category_id,name_en,name_ru,is_active,approval_status,pricing_model) VALUES
('${id(20)}','${id(1)}','${id(10)}','Quote','По запросу',true,'approved','quote'),
('${id(21)}','${id(2)}','${id(10)}','Demo','Демо',true,'approved','quote'),
('${id(22)}','${id(3)}','${id(10)}','Pending provider','Ожидание',true,'approved','quote'),
('${id(23)}','${id(1)}','${id(11)}','Hidden category','Скрытая',true,'approved','quote'),
('${id(24)}','${id(1)}',null,'No category','Без категории',true,'approved','quote');
`);
for(const [n,state] of ['sold','soft_hold','reserved','spa_signed','blocked','not_for_sale'].entries())
 await db.query('INSERT INTO project_units(id,status,unit_status,status_version) VALUES($1,$2,$3,7)',[id(50+n),'available',state]);
const source=(await readFile(path.join(repo,'drizzle/migrations/0032_catalog_notification_private_boundaries.sql'),'utf8')).split('-- Restrict the proved public full-row leaks')[0];
await db.exec(source);
await db.exec('GRANT ALL ON public_provider_catalog,public_service_catalog,public_salon_catalog TO anon,authenticated,service_role;');
await check('reproduces the previous anonymous catalogue write path in the disposable fixture',async()=>{
 await db.exec('BEGIN;SET LOCAL ROLE anon;');
 try{await db.query('UPDATE public_provider_catalog SET name=$1 WHERE id=$2',['untrusted',id(1)]);}
 finally{await db.exec('ROLLBACK');}
});
const before=(await db.query('SELECT id,unit_status,status_version FROM project_units ORDER BY id')).rows;
const migration=await readFile(migrationPath,'utf8');await db.exec(migration);
await check('repair preserves recorded rich states and optimistic revisions',async()=>{
 assert.deepEqual((await db.query('SELECT id,unit_status,status_version FROM project_units ORDER BY id')).rows,before);
 const rows=(await db.query('SELECT status,unit_status FROM project_units')).rows;
 assert.equal(rows.find(r=>r.unit_status==='soft_hold').status,'held');
 assert.equal(rows.find(r=>r.unit_status==='sold').status,'sold');
 assert.equal(rows.find(r=>r.unit_status==='spa_signed').status,'reserved');
});
for(const role of ['anon','authenticated','service_role']){
 await check(role+' can read but cannot mutate catalogue views',async()=>{
  const row=(await db.query("SELECT has_table_privilege($1,'public_provider_catalog','SELECT') AS read,has_table_privilege($1,'public_provider_catalog','UPDATE') AS write",[role])).rows[0];
  assert.equal(row.read,true);assert.equal(row.write,false);
  await db.exec('BEGIN;SET LOCAL ROLE '+role+';');
  try{await assert.rejects(()=>db.query('UPDATE public_provider_catalog SET name=$1 WHERE id=$2',['bad',id(1)]),e=>e.code==='42501');}
  finally{await db.exec('ROLLBACK');}
 });
}
await check('public reads exclude demo, pending suppliers and missing or hidden categories',async()=>{
 await db.exec('BEGIN;SET LOCAL ROLE anon;');
 try{
  assert.deepEqual((await db.query('SELECT id,phone,email FROM public_provider_catalog ORDER BY id')).rows,[{id:id(1),phone:null,email:null}]);
  assert.deepEqual((await db.query('SELECT id,price,pricing_model FROM public_service_catalog ORDER BY id')).rows,[{id:id(20),price:null,pricing_model:'quote'}]);
 }finally{await db.exec('ROLLBACK');}
});
await check('unclassified new units start unknown instead of available',async()=>{
 assert.deepEqual((await db.query('INSERT INTO project_units(id) VALUES($1) RETURNING status,unit_status',[id(100)])).rows,[{status:'unknown',unit_status:'unknown'}]);
});
await check('legacy hold input maps to a full hold state',async()=>{
 assert.deepEqual((await db.query('INSERT INTO project_units(id,status) VALUES($1,$2) RETURNING status,unit_status',[id(101),'held'])).rows,[{status:'held',unit_status:'soft_hold'}]);
});
await check('rich state transitions remain compatible with both CHECK constraints',async()=>{
 for(const [state,summary] of [['available','available'],['soft_hold','held'],['reserved','reserved'],['spa_signed','reserved'],['sold','sold'],['blocked','unknown'],['not_for_sale','unknown'],['unknown','unknown']]){
  assert.deepEqual((await db.query('UPDATE project_units SET unit_status=$1 WHERE id=$2 RETURNING status,unit_status',[state,id(100)])).rows,[{status:summary,unit_status:state}]);
 }
});
await check('conflicting dual writes are rejected atomically',async()=>{
 await assert.rejects(()=>db.query('UPDATE project_units SET status=$1,unit_status=$2 WHERE id=$3',['sold','reserved',id(100)]),e=>e.code==='22023');
 assert.equal((await db.query('SELECT unit_status FROM project_units WHERE id=$1',[id(100)])).rows[0].unit_status,'unknown');
});
await check('repair can be replayed without changing complete state or losing rows',async()=>{
 const snapshot=(await db.query('SELECT * FROM project_units ORDER BY id')).rows;
 await db.exec(migration);assert.deepEqual((await db.query('SELECT * FROM project_units ORDER BY id')).rows,snapshot);
});
await db.close();console.log(JSON.stringify({checks,result:'passed'}));
