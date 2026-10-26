import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildEmployeePublicationBundle, manifest, repositoryRoot, sqlStatementBoundaries, stripOuterTransaction } from '../../../scripts/source-bundles/employee-publication.mjs';

type Entry = { id: string; path: string; sha256: string; optional?: boolean };
type Statement = { start: number; end: number; words: string[] };
const directories: string[] = [];
const temp = () => { const directory = mkdtempSync(join(tmpdir(),'employee-bundle-')); directories.push(directory); return directory; };
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory,{recursive:true,force:true}); });

function transactionWords(sql: string) {
  return (sqlStatementBoundaries(sql) as Statement[]).map(statement=>statement.words[0]).filter(word=>['BEGIN','START','COMMIT','END','ROLLBACK','ABORT','SAVEPOINT','RELEASE','PREPARE'].includes(word));
}

describe('employee activation source assembly, never database execution',()=>{
 it('pins every candidate to exact checkpoint bytes and names the source commit',()=>{
  expect(manifest.sourceCommit).toBe('7e03ed765c121fc851f21bd3a1167ca696412db7');
  for(const entry of [...manifest.activation,...manifest.rollback] as Entry[]) {
   expect(createHash('sha256').update(readFileSync(resolve(repositoryRoot,entry.path))).digest('hex')).toBe(entry.sha256);
  }
 });
 it('orders restrictive ceilings before creator expansion and dependencies before consumers',()=>{
  expect((manifest.activation as Entry[]).map(entry=>entry.id)).toEqual([
   'task-ceiling','operational-ceiling','vendor-row-shape','property-publication','complex-publication','property-revisions','optional-admin-delegation',
  ]);
  const sql=buildEmployeePublicationBundle();
  expect(sql.indexOf('CREATE POLICY employee_task_view_ceiling')).toBeLessThan(sql.indexOf('CREATE OR REPLACE FUNCTION public.create_managed_property_checked'));
  expect(sql.indexOf('CREATE POLICY employee_select_capability_ceiling')).toBeLessThan(sql.indexOf('CREATE OR REPLACE FUNCTION public.create_managed_property_checked'));
  expect(sql.indexOf('public.managed_property_draft_fields()')).toBeLessThan(sql.indexOf('CREATE FUNCTION public.managed_property_revision_content'));
 });
 it.each([{}, {includeDelegation:true}, {rollback:true}])('wraps %j in exactly one outer transaction without internal commits',options=>{
  const sql=buildEmployeePublicationBundle(options);
  expect(transactionWords(sql)).toEqual(['BEGIN','COMMIT']);
  expect(sql).toContain('SET LOCAL standard_conforming_strings = on;');
  expect(sql).toContain('SOURCE CANDIDATE ONLY');
 });
 it('preserves every source byte other than the two transaction wrapper statements',()=>{
  const sql=buildEmployeePublicationBundle({includeDelegation:true});
  for(const entry of manifest.activation as Entry[]) {
   const source=readFileSync(resolve(repositoryRoot,entry.path),'utf8');
   expect(sql).toContain(stripOuterTransaction(source,entry.path));
  }
 });
 it('omits optional delegation unless explicitly selected and never seeds employee or company access',()=>{
  const core=buildEmployeePublicationBundle(),full=buildEmployeePublicationBundle({includeDelegation:true});
  expect(core).not.toContain('CREATE POLICY platform_admin_insert_authoring_permissions');
  expect(full).toContain('CREATE POLICY platform_admin_insert_authoring_permissions');
  expect(core).not.toMatch(/INSERT INTO public\.(?:auth|management_company_members|operating_spaces|operating_space_members|team_member_permissions)\b/);
  expect(core).not.toMatch(/SET operating_spaces_enforced\s*=|ALTER ROLE|CREATE ROLE/);
 });
 it('preserves quoted transaction text and PL/pgSQL BEGIN/END, including named dollar tags',()=>{
  const source="-- BEGIN; header\nBEGIN;\nCREATE FUNCTION example() RETURNS void LANGUAGE plpgsql AS $function$ BEGIN PERFORM 'COMMIT;'; END; $function$;\nSELECT 'BEGIN; it''s quoted', E'escaped\\'COMMIT;', \"COMMIT;\";\n/* outer /* COMMIT; */ BEGIN; */\nCOMMIT; -- retained footer\n";
  const body=stripOuterTransaction(source);
  expect(body).toContain("$function$ BEGIN PERFORM 'COMMIT;'; END; $function$");
  expect(body).toContain('/* outer /* COMMIT; */ BEGIN; */');
  expect(body).toContain('-- retained footer');
  expect(transactionWords(body)).toEqual([]);
 });
 it.each(['\r','\n','\r\n'])('ends SQL line comments at %j before detecting an internal COMMIT',newline=>{
  expect(()=>stripOuterTransaction(`BEGIN; SELECT 1; -- comment${newline}COMMIT;\nSELECT 2; COMMIT;`)).toThrow(/unexpected top-level transaction command COMMIT/);
 });
 it.each(['COMMIT','ROLLBACK','BEGIN','SAVEPOINT unsafe','RELEASE unsafe','START TRANSACTION','PREPARE TRANSACTION \'unsafe\''])('rejects unexpected top-level %s',command=>{
  expect(()=>stripOuterTransaction(`BEGIN; SELECT 1; ${command}; SELECT 2; COMMIT;`)).toThrow(/unexpected top-level transaction/);
 });
 it.each(['SELECT 1;','BEGIN; SELECT 1;','BEGIN; SELECT 1; COMMIT; SELECT 2;','BEGIN WORK; SELECT 1; COMMIT;','BEGIN 123; SELECT 1; COMMIT;',"BEGIN; SELECT 1; COMMIT 'extra';",'BEGIN; SELECT 1; ROLLBACK;'])('rejects wrong wrappers: %s',source=>{
  expect(()=>stripOuterTransaction(source)).toThrow();
 });
 it.each(["BEGIN; SELECT 'unterminated; COMMIT;",'BEGIN; DO $bad$ BEGIN END; COMMIT;','BEGIN; SELECT 1; /* unterminated COMMIT;','BEGIN; SELECT 1; COMMIT','BEGIN; \\i injected.sql\n SELECT 1; COMMIT;'])('rejects malformed or executable client input: %s',source=>{
  expect(()=>stripOuterTransaction(source)).toThrow(/Unsafe SQL assembly/);
 });
 it('rejects changed source before emitting any assembled SQL',()=>{
  const root=temp();
  for(const entry of manifest.activation as Entry[]) {
   const target=resolve(root,entry.path);mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,readFileSync(resolve(repositoryRoot,entry.path)));
  }
  const first=manifest.activation[0] as Entry;
  writeFileSync(resolve(root,first.path),readFileSync(resolve(root,first.path),'utf8')+'\n-- drift\n');
  expect(()=>buildEmployeePublicationBundle({rootDir:root})).toThrow(/source checksum changed/);
 });
 it('produces fail-closed rollback without removing data/guards or reverting vendor compatibility',()=>{
  const sql=buildEmployeePublicationBundle({rollback:true});
  expect(sql).toContain('REVOKE EXECUTE');
  expect(sql).toContain('DROP POLICY IF EXISTS platform_admin_insert_authoring_permissions');
  expect(sql).not.toMatch(/DROP (?:TABLE|COLUMN|TRIGGER)|DELETE FROM|UPDATE public\.|SET operating_spaces_enforced|GRANT EXECUTE ON FUNCTION public\.publish_property_to_marketplace/);
  expect(sql).not.toContain('CREATE OR REPLACE FUNCTION public.notify_vendor_on_content_status_change');
  expect(()=>buildEmployeePublicationBundle({rollback:true,includeDelegation:true})).toThrow(/do not combine flags/);
 });
 it('CLI writes only a new local artifact and refuses overwriting it',()=>{
  const output=join(temp(),'candidate.sql');
  const args=['scripts/source-bundles/employee-publication.mjs','--out',output];
  execFileSync(process.execPath,args,{cwd:repositoryRoot});
  expect(readFileSync(output,'utf8')).toBe(buildEmployeePublicationBundle());
  expect(()=>execFileSync(process.execPath,args,{cwd:repositoryRoot,stdio:'pipe'})).toThrow();
 });
});
