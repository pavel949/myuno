import postgres from 'postgres';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const hash = value => createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value);
export function connectionFromEnvironment(prefix) {
  const value = process.env[`${prefix}_DATABASE_URL`];
  if (!value) throw new Error(`${prefix}_DATABASE_URL is required; REST/anonymous exports are not database backups`);
  const url = new URL(value);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Expected a PostgreSQL connection URL');
  const sslmode = url.searchParams.get('sslmode');
  if (sslmode && !['disable', 'require', 'verify-full'].includes(sslmode)) throw new Error('Unsupported sslmode');
  return { host: url.searchParams.get('host') || url.hostname, port: Number(url.port || 5432), database: decodeURIComponent(url.pathname.slice(1)), username: decodeURIComponent(url.username), password: decodeURIComponent(url.password), ssl: sslmode === 'verify-full' ? 'verify-full' : sslmode === 'require' ? 'require' : false };
}
function client(connection) {
  if (!connection.database || !connection.username || !connection.host) throw new Error('Explicit database/actor/host required');
  return postgres({ ...connection, max: 1, onnotice: () => {} });
}
function pg(command, args, connection) {
  // Password is never in argv, errors, manifests or repository files.
  const result = spawnSync(command, args, { encoding: 'utf8', env: {
    ...process.env, PGHOST: connection.host, PGPORT: String(connection.port || 5432),
    PGDATABASE: connection.database, PGUSER: connection.username, PGPASSWORD: connection.password || '',
    PGSSLMODE: typeof connection.ssl === 'string' ? connection.ssl : connection.ssl ? 'verify-full' : 'disable', PGOPTIONS: '-c row_security=off',
  }, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`${command} failed; snapshot/restore is not accepted`);
  return result.stdout;
}
function archivedSequenceStatements(archive, connection) {
  const directory=mkdtempSync(join(tmpdir(),'myuno-sequence-proof-'));
  try {
    const entries=pg('pg_restore',['--list',archive],connection).split('\n').filter(line=>/^\d+; \d+ \d+ SEQUENCE SET /.test(line)).join('\n');
    const list=join(directory,'sequences.list');writeFileSync(list,entries,{mode:0o600});
    // Generate sequence SET SQL only; never connect pg_restore to the source.
    return pg('pg_restore',['--use-list',list,'--file','-',archive],connection).split('\n').filter(line=>line.startsWith('SELECT pg_catalog.setval(')).sort();
  } finally {rmSync(directory,{recursive:true,force:true});}
}
async function dumpSelection(tx,schemas) {
  const extensions=await tx`SELECT e.extname name,e.extversion version,n.nspname schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE n.nspname IN ${tx(schemas)} ORDER BY e.extname`;
  // Explicit extension selection can include configuration relations. Never
  // silently expand the approved data boundary into another schema.
  const outside=await tx`SELECT e.extname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace CROSS JOIN LATERAL unnest(e.extconfig) config(oid) JOIN pg_class c ON c.oid=config.oid JOIN pg_namespace cn ON cn.oid=c.relnamespace WHERE n.nspname IN ${tx(schemas)} AND cn.nspname NOT IN ${tx(schemas)}`;
  if(outside.length)throw new Error('Extension configuration requires an explicitly reviewed additional schema');
  if(extensions.some(e=>!/^[a-z_][a-z0-9_]*$/.test(e.name)))throw new Error('Extension name requires explicit supported selection');
  return {extensions,args:[...schemas.flatMap(s=>['--schema',s]),...extensions.flatMap(e=>['--extension',e.name])]};
}
async function evidence(tx, schemas, connection) {
  const [{snapshot}]=await tx`SELECT pg_export_snapshot() snapshot`;
  const selection=await dumpSelection(tx,schemas);
  const schemaSql=pg('pg_dump',['--schema-only','--no-owner','--snapshot',snapshot,...selection.args],connection)
    .split('\n').filter(line=>!line.startsWith('--') && !line.startsWith('\\restrict ') && !line.startsWith('\\unrestrict ') && line.trim()).join('\n');
  const tables = await tx`SELECT n.nspname schema,c.relname name,c.relkind kind,c.relrowsecurity rls,c.relforcerowsecurity force_rls
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ${tx(schemas)} AND c.relkind IN ('r','p') ORDER BY 1,2`;
  const rows=[];
  for (const table of tables) {
    // Stable canonical JSON in database order, streamed per row. Duplicates matter.
    const digest=createHash('sha256'); let count=0;
    for await (const batch of tx`SELECT to_jsonb(t)::text value FROM ${tx(`${table.schema}.${table.name}`)} t ORDER BY to_jsonb(t)::text`.cursor(500)) {
      for (const row of batch) { digest.update(row.value); digest.update('\n'); count++; }
    }
    rows.push({ schema:table.schema, table:table.name, count, sha256:digest.digest('hex') });
  }
  const columns = await tx`SELECT n.nspname schema,c.relname relation,a.attname name,format_type(a.atttypid,a.atttypmod) type,a.attnotnull required,pg_get_expr(d.adbin,d.adrelid) default_value,a.attidentity identity,a.attgenerated generated
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    WHERE n.nspname IN ${tx(schemas)} AND c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped ORDER BY 1,2,a.attnum`;
  const constraints=await tx`SELECT n.nspname schema,c.relname relation,k.conname name,k.contype type,k.convalidated validated,pg_get_constraintdef(k.oid) definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ${tx(schemas)} ORDER BY 1,2,3`;
  const views=await tx`SELECT schemaname schema,viewname name,definition FROM pg_views WHERE schemaname IN ${tx(schemas)} ORDER BY 1,2`;
  const indexes=await tx`SELECT schemaname schema,tablename relation,indexname name,indexdef definition FROM pg_indexes WHERE schemaname IN ${tx(schemas)} ORDER BY 1,2,3`;
  const functions=await tx`SELECT n.nspname schema,p.proname name,pg_get_function_identity_arguments(p.oid) arguments,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ${tx(schemas)} AND p.prokind IN ('f','p') ORDER BY 1,2,3`;
  const triggers=await tx`SELECT n.nspname schema,c.relname relation,t.tgname name,pg_get_triggerdef(t.oid) definition,t.tgenabled enabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ${tx(schemas)} AND NOT t.tgisinternal ORDER BY 1,2,3`;
  const policies=await tx`SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname IN ${tx(schemas)} ORDER BY 1,2,3`;
  const enums=await tx`SELECT n.nspname schema,t.typname name,e.enumsortorder position,e.enumlabel value FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ${tx(schemas)} ORDER BY 1,2,3`;
  const relationPrivileges=await tx`SELECT n.nspname schema,c.relname name,c.relacl::text privileges FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ${tx(schemas)} ORDER BY 1,2`;
  const functionPrivileges=await tx`SELECT n.nspname schema,p.proname name,pg_get_function_identity_arguments(p.oid) arguments,p.proacl::text privileges FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ${tx(schemas)} ORDER BY 1,2,3`;
  const sequenceDefinitions=await tx`SELECT schemaname schema,sequencename name,format('%I.%I',schemaname,sequencename) qualified,data_type,start_value,min_value,max_value,increment_by,cycle,cache_size FROM pg_sequences WHERE schemaname IN ${tx(schemas)} ORDER BY 1,2`;
  const sequences=[];
  for (const sequence of sequenceDefinitions) {
    const [state]=await tx`SELECT last_value::text,is_called FROM ${tx(`${sequence.schema}.${sequence.name}`)}`;
    sequences.push({...sequence,...state});
  }
  const schema={extensions:selection.extensions,tables,columns,constraints,views,indexes,functions,triggers,policies,enums,relationPrivileges,functionPrivileges,sequences};
  return { rows, schema, schemaSha256:hash(canonical(schema)), schemaSqlSha256:hash(schemaSql) };
}
async function privileged(tx) {
  const [role]=await tx`SELECT rolsuper OR rolbypassrls allowed FROM pg_roles WHERE rolname=current_user`;
  if (!role?.allowed) throw new Error('Backup verification requires explicit database privileges bypassing RLS; partial reads are rejected');
  await tx.unsafe('SET LOCAL row_security=off');
}
export async function exportDatabase({connection,directory,schemas=['public']}) {
  if (!schemas.length || schemas.some(s=>!s || !/^[a-z_][a-z0-9_]*$/.test(s))) throw new Error('Explicit schema allowlist required');
  mkdirSync(directory,{recursive:true,mode:0o700});
  const archive=join(directory,'database.dump');
  if (existsSync(archive) || existsSync(join(directory,'manifest.json'))) throw new Error('Use a new empty snapshot directory');
  const sql=client(connection);
  try {
    await sql.begin('ISOLATION LEVEL REPEATABLE READ READ ONLY',async tx=>{
      await privileged(tx);
      const [{ snapshot }]=await tx`SELECT pg_export_snapshot() snapshot`;
      const selection=await dumpSelection(tx,schemas);
      pg('pg_dump',['--format=custom','--strict-names','--snapshot',snapshot,...selection.args,'--file',`${archive}.partial`],connection);
      const archivedSequences=archivedSequenceStatements(`${archive}.partial`,connection);
      const proof=await evidence(tx,schemas,connection);
      const currentSequences=proof.schema.sequences.map(sequence=>`SELECT pg_catalog.setval('${sequence.qualified.replace(/'/g,"''")}', ${sequence.last_value}, ${sequence.is_called});`).sort();
      if(canonical(archivedSequences)!==canonical(currentSequences))throw new Error('sequence_state_changed_during_export; retry a quiescent snapshot');
      const manifest={version:2,createdAt:new Date().toISOString(),schemas,scope:'PostgreSQL schema/data only; no Auth service, Storage objects, Edge deployment, credentials, globals or PITR',archiveSha256:hash(readFileSync(`${archive}.partial`)),...proof};
      writeFileSync(join(directory,'manifest.json.partial'),JSON.stringify(manifest,null,2),{mode:0o600});
      renameSync(`${archive}.partial`,archive);
      renameSync(join(directory,'manifest.json.partial'),join(directory,'manifest.json'));
    });
  } finally { await sql.end(); }
}
export async function restoreDatabase({connection,directory,confirmation}) {
  if (confirmation!=='fresh-isolated-database') throw new Error('Restore requires explicit fresh-isolated-database confirmation');
  rmSync(join(directory,'restore-verification.json'),{force:true});
  const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
  if (manifest.version!==2 || !Array.isArray(manifest.schema?.extensions) || !Array.isArray(manifest.schemas) || !manifest.schemas.length || manifest.schemas.some(s=>!s || !/^[a-z_][a-z0-9_]*$/.test(s))) throw new Error('Invalid snapshot manifest');
  const archive=resolve(directory,'database.dump');
  if (hash(readFileSync(archive))!==manifest.archiveSha256 || hash(canonical(manifest.schema))!==manifest.schemaSha256) throw new Error('Snapshot checksum mismatch');
  const sql=client(connection);
  try {
    await sql.begin(async tx=>{
      await privileged(tx);
      // Reject all user objects in any schema, not just rows or selected tables.
      const [{ count }]=await tx`SELECT count(*)::int count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND n.nspname NOT LIKE 'pg_temp%'`;
      const [{ functions }]=await tx`SELECT count(*)::int functions FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema')`;
      const [{ types }]=await tx`SELECT count(*)::int types FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'`;
      if (count || functions || types) throw new Error('Restore target is not an empty fresh database');

    });
    const listDirectory=mkdtempSync(join(tmpdir(),'myuno-restore-list-'));
    try {
      // Keep PostgreSQL's fresh built-in public schema and its initprivs. A
      // drop/recreate would change its default USAGE privileges. Omit only its
      // CREATE SCHEMA TOC entry; all actual ACL/policy/object entries stay.
      const list=pg('pg_restore',['--list',archive],connection).split('\n').filter(line=>!/^\d+; \d+ \d+ SCHEMA - public /.test(line)).join('\n');
      const listPath=join(listDirectory,'restore.list');
      writeFileSync(listPath,list,{mode:0o600});
      pg('pg_restore',['--exit-on-error','--single-transaction','--no-owner','--use-list',listPath,'--dbname',connection.database,archive],connection);
    } finally {rmSync(listDirectory,{recursive:true,force:true});}
    const proof=await sql.begin('ISOLATION LEVEL REPEATABLE READ READ ONLY',async tx=>{await privileged(tx);return evidence(tx,manifest.schemas,connection);});
    if (proof.schemaSha256!==manifest.schemaSha256 || proof.schemaSqlSha256!==manifest.schemaSqlSha256 || canonical(proof.rows)!==canonical(manifest.rows)) throw new Error('Restore content/schema verification failed; target is not accepted');
    writeFileSync(join(directory,'restore-verification.json'),JSON.stringify({verifiedAt:new Date().toISOString(),targetDatabase:connection.database,archiveSha256:manifest.archiveSha256,schemaSha256:proof.schemaSha256,rows:proof.rows,scope:manifest.scope},null,2),{mode:0o600});
    return proof;
  } finally {await sql.end();}
}
