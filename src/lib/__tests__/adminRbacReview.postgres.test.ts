import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const A=id(1), B=id(2), T=id(3), U=id(4), S=id(5);
let directory:string, sql:ReturnType<typeof postgres>, started=false;
const asRoot=process.getuid?.()===0, owner=asRoot?'nobody':process.env.USER??'';
const pgRoot=dirname(dirname(realpathSync(execFileSync('which',['postgres'],{encoding:'utf8'}).trim())));
function run(bin:string,args:string[]){const exe=existsSync(join(pgRoot,'bin',bin))?join(pgRoot,'bin',bin):bin;return asRoot?execFileSync('runuser',['-u',owner,'--',exe,...args],{encoding:'utf8'}):execFileSync(exe,args,{encoding:'utf8'});}
async function as<T>(user:string|null,fn:(tx:postgres.TransactionSql)=>Promise<T>):Promise<T>{
 return sql.begin(async tx=>{await tx.unsafe(`SET LOCAL ROLE ${user?'authenticated':'anon'}`);await tx`SELECT set_config('request.jwt.claim.sub',${user??''},true)`;return fn(tx);}) as Promise<T>;
}
beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-admin-rbac-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55453 -c listen_addresses='' -c jit=off`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55453,database:'postgres',username:owner,password:'',max:1,onnotice:()=>{}});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/admin-rbac-review-base.sql','utf8'));
 await sql`INSERT INTO profiles(id,status) VALUES(${A},'active'),(${B},'active'),(${T},'active'),(${U},'active'),(${S},'suspended')`;
 await sql`INSERT INTO user_roles(user_id,role) VALUES(${A},'admin'),(${B},'admin'),(${T},'uno_team'),(${U},'user'),(${S},'admin')`;
 await sql.unsafe(readFileSync('docs/hardening/admin-rbac-328/rls.candidate.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});
describe('isolated administrative RLS candidate',()=>{
 it.each([A,B])('blocks direct protected insert/delete/convert for admin %s',async actor=>{
  await expect(as(actor,tx=>tx`INSERT INTO user_roles(user_id,role) VALUES(${U},'admin')`)).rejects.toMatchObject({code:'42501'});
  expect(await as(actor,tx=>tx`DELETE FROM user_roles WHERE user_id=${B} AND role='admin' RETURNING role`)).toHaveLength(0);
  expect(await as(actor,tx=>tx`UPDATE user_roles SET role='owner' WHERE user_id=${T} AND role='uno_team' RETURNING role`)).toHaveLength(0);
  await expect(as(actor,tx=>tx`UPDATE user_roles SET role='uno_team' WHERE user_id=${U} AND role='user'`)).rejects.toMatchObject({code:'42501'});
 });
 it.each([null,T,U,S])('denies checked membership and generic role grants for %s',async actor=>{
  await expect(as(actor,tx=>tx`SELECT manage_uno_team_membership_checked(${U},true)`)).rejects.toMatchObject({code:'42501'});
  await expect(as(actor,tx=>tx`SELECT manage_nonplatform_role_checked(${U},'owner',true)`)).rejects.toMatchObject({code:'42501'});
 });
 it('blocks inactive administrators from direct ordinary role writes',async()=>{
  await expect(as(S,tx=>tx`INSERT INTO user_roles(user_id,role) VALUES(${U},'vendor')`)).rejects.toMatchObject({code:'42501'});
  expect(await as(S,tx=>tx`DELETE FROM user_roles WHERE user_id=${U} AND role='user' RETURNING role`)).toHaveLength(0);
 });
 it('denies self/peer team change and protected generic role grants',async()=>{
  for(const target of [A,B])await expect(as(A,tx=>tx`SELECT manage_uno_team_membership_checked(${target},true)`)).rejects.toMatchObject({code:'42501'});
  for(const role of ['admin','uno_team'])await expect(as(A,tx=>tx`SELECT manage_nonplatform_role_checked(${U},${role}::app_role,true)`)).rejects.toMatchObject({code:'42501'});
 });
 it('grants and revokes team with permission cleanup and audit',async()=>{
  const [g]=await as(A,tx=>tx`SELECT manage_uno_team_membership_checked(${U},true) AS receipt`);expect(g.receipt).toMatchObject({success:true,uno_team:true});
  await sql`INSERT INTO uno_team_permissions(user_id) VALUES(${U})`;
  const [d]=await as(B,tx=>tx`SELECT manage_uno_team_membership_checked(${U},false) AS receipt`);expect(d.receipt).toMatchObject({success:true,uno_team:false});
  expect(await sql`SELECT 1 FROM uno_team_permissions WHERE user_id=${U}`).toHaveLength(0);
  expect(await sql`SELECT 1 FROM user_roles WHERE user_id=${U} AND role='uno_team'`).toHaveLength(0);
  expect(await sql`SELECT 1 FROM admin_audit_logs WHERE entity_id=${U} AND action IN ('user.team_granted','user.team_revoked')`).toHaveLength(2);
 });
 it('generic role operation records audit and cannot forge identity event',async()=>{
  const [g]=await as(A,tx=>tx`SELECT manage_nonplatform_role_checked(${U},'owner',true) AS receipt`);expect(g.receipt).toMatchObject({success:true,role_added:'owner'});
  await expect(as(A,tx=>tx`INSERT INTO admin_audit_logs(admin_id,action) VALUES(${A},'user.role_added')`)).rejects.toMatchObject({code:'42501'});
  await expect(as(A,tx=>tx`DELETE FROM admin_audit_logs`)).rejects.toMatchObject({code:'42501'});
  await expect(as(A,tx=>tx`UPDATE admin_audit_logs SET action='fake'`)).rejects.toMatchObject({code:'42501'});
 });
 it('rejects direct lifecycle mutation but preserves ordinary profile updates',async()=>{
  for(const actor of [A,U])await expect(as(actor,tx=>tx`UPDATE profiles SET status='suspended' WHERE id=${U}`)).rejects.toMatchObject({code:'42501'});
  expect(await as(U,tx=>tx`UPDATE profiles SET full_name='Synthetic' WHERE id=${U} RETURNING id`)).toHaveLength(1);
 });
 it('rolls back role grant if audit fails',async()=>{
  await sql.unsafe("ALTER TABLE admin_audit_logs ADD CONSTRAINT synthetic_audit_failure CHECK(action <> 'user.team_granted') NOT VALID");
  try {await expect(as(A,tx=>tx`SELECT manage_uno_team_membership_checked(${U},true)`)).rejects.toMatchObject({code:'23514'});expect(await sql`SELECT 1 FROM user_roles WHERE user_id=${U} AND role='uno_team'`).toHaveLength(0);}
  finally{await sql.unsafe('ALTER TABLE admin_audit_logs DROP CONSTRAINT synthetic_audit_failure');}
 });
});
