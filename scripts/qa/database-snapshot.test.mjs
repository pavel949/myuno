import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';
import { disposablePostgres } from './disposable-postgres.mjs';
import { exportDatabase,restoreDatabase } from '../database-snapshot.mjs';

test('native archive restores exact synthetic schema, rows, FK relations and RLS; errors fail closed',async()=>{
 const environment=disposablePostgres();const suffix=Date.now();
 const sourceName=`snapshot_source_${suffix}`,targetName=`snapshot_target_${suffix}`,brokenName=`snapshot_broken_${suffix}`;
 const admin=postgres({...environment.connection,database:'postgres',max:1,onnotice:()=>{}});
 const limitedRole=`snapshot_limited_${suffix}`;
 const directory=mkdtempSync(join(tmpdir(),'myuno-snapshot-proof-'));
 const connection=database=>({...environment.connection,database});
 let source,target;
 try {
  for(const name of [sourceName,targetName,brokenName])await admin.unsafe(`CREATE DATABASE ${name}`);
  source=postgres({...connection(sourceName),max:1,onnotice:()=>{}});
  target=postgres({...connection(targetName),max:1,onnotice:()=>{}});
  await source.unsafe(`CREATE TYPE request_state AS ENUM('pending','accepted','cancelled');
   CREATE TABLE properties(id integer PRIMARY KEY,title text NOT NULL);
   CREATE SEQUENCE synthetic_receipt_seq START 21;
   SELECT nextval('synthetic_receipt_seq');
   CREATE TABLE requests(id integer PRIMARY KEY,property_id integer NOT NULL REFERENCES properties(id),state request_state NOT NULL,payload jsonb NOT NULL);
   CREATE INDEX requests_property ON requests(property_id);
   CREATE SCHEMA operations;
   CREATE TABLE operations.tasks(id integer PRIMARY KEY,request_id integer NOT NULL REFERENCES public.requests(id));
   CREATE FUNCTION property_title(n integer) RETURNS text LANGUAGE sql STABLE AS $$ SELECT title FROM properties WHERE id=n $$;
   CREATE VIEW request_properties AS SELECT r.id,p.title FROM requests r JOIN properties p ON p.id=r.property_id;
   ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
   CREATE POLICY synthetic_private ON requests FOR SELECT USING(false);
   INSERT INTO properties VALUES(1,'Exact updated title'),(2,'Empty relation parent');
   INSERT INTO requests VALUES(3,1,'pending','{"guests":2,"unicode":"Пхукет","null":null}'),(4,1,'accepted','{"guests":1}');
   INSERT INTO operations.tasks VALUES(5,3);`);
  await exportDatabase({connection:connection(sourceName),directory,schemas:['public','operations']});
  const proof=await restoreDatabase({connection:connection(targetName),directory,confirmation:'fresh-isolated-database'});
  assert.equal(proof.rows.find(r=>r.table==='requests').count,2);
  assert.equal((await target`SELECT nextval('synthetic_receipt_seq')::int value`)[0].value,22);
  assert.equal((await target`SELECT title FROM properties WHERE id=1`)[0].title,'Exact updated title');
  assert.equal((await target`SELECT count(*)::int n FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE p.id IS NULL`)[0].n,0);
  assert.equal((await target`SELECT count(*)::int n FROM operations.tasks t JOIN requests r ON r.id=t.request_id`)[0].n,1);
  await assert.rejects(target`INSERT INTO requests VALUES(5,999,'pending','{}')`,/foreign key/);
  assert.equal((await target`SELECT count(*)::int n FROM pg_policies WHERE tablename='requests'`)[0].n,1);
  await assert.rejects(restoreDatabase({connection:connection(targetName),directory,confirmation:'fresh-isolated-database'}),/not an empty/);
  await assert.rejects(restoreDatabase({connection:connection(brokenName),directory,confirmation:''}),/explicit/);
  const archive=readFileSync(join(directory,'database.dump'));
  writeFileSync(join(directory,'database.dump'),Buffer.concat([archive,Buffer.from('corrupt')]));
  await assert.rejects(restoreDatabase({connection:connection(brokenName),directory,confirmation:'fresh-isolated-database'}),/checksum/);
  writeFileSync(join(directory,'database.dump'),archive);
  const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
  manifest.rows.find(r=>r.table==='properties').sha256='0'.repeat(64);
  writeFileSync(join(directory,'manifest.json'),JSON.stringify(manifest));
  await assert.rejects(restoreDatabase({connection:connection(brokenName),directory,confirmation:'fresh-isolated-database'}),/content\/schema verification failed/);
  assert.equal(existsSync(join(directory,'restore-verification.json')),false,'failed verification must not leave a success receipt');
  await source.unsafe(`CREATE ROLE ${limitedRole} LOGIN; GRANT USAGE ON SCHEMA public TO ${limitedRole}; GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${limitedRole}`);
  const partialDirectory=join(directory,'partial');
  await assert.rejects(exportDatabase({connection:{...connection(sourceName),username:limitedRole,password:''},directory:partialDirectory}),/privileges/);
  assert.equal(existsSync(join(partialDirectory,'manifest.json')),false);
  const missingDirectory=join(directory,'missing');
  await assert.rejects(exportDatabase({connection:connection(sourceName),directory:missingDirectory,schemas:['missing_schema']}),/pg_dump failed/);
  assert.equal(existsSync(join(missingDirectory,'manifest.json')),false);
  // Sequence state is outside MVCC. Independent backend activity between dump
  // capture and manifest capture must fail export before a success manifest.
  const churn=postgres({...connection(sourceName),max:1,onnotice:()=>{}});
  let activity;
  try {
    activity=Promise.resolve(churn.unsafe(`DO $$ BEGIN FOR n IN 1..1500 LOOP PERFORM nextval('synthetic_receipt_seq'); PERFORM pg_sleep(0.001); END LOOP; END $$`));
    await source`SELECT pg_sleep(0.02)`;
    const racedDirectory=join(directory,'sequence-race');
    await assert.rejects(exportDatabase({connection:connection(sourceName),directory:racedDirectory,schemas:['public','operations']}),/sequence_state_changed_during_export/);
    assert.equal(existsSync(join(racedDirectory,'manifest.json')),false);
  } finally {if(activity)await activity;await churn.end();}
  // Proof is bounded to this explicit schema/data; no Auth users or Storage files.
  assert.match(manifest.scope,/no Auth service/);
 } finally {
  if(source)await source.end();if(target)await target.end();
  for(const name of [sourceName,targetName,brokenName])await admin.unsafe(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.unsafe(`DROP ROLE IF EXISTS ${limitedRole}`);
  await admin.end();environment.close();rmSync(directory,{recursive:true,force:true});
 }
});
