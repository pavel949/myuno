import { createHash } from 'node:crypto';

export function requirePrivilegedKey(key) {
  if (typeof key !== 'string' || !key.trim()) throw new Error('SOURCE_SERVICE_ROLE_KEY is required; anonymous export is not a backup');
  if (key.startsWith('sb_secret_')) return key;
  try {
    const claims=JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    if (claims.role==='service_role') return key;
  } catch { /* Fail closed without logging credentials. */ }
  throw new Error('A server-only service role key is required for a complete row export');
}

export const snapshotHash = text => createHash('sha256').update(text).digest('hex');

/** Server count governs pagination, including when the API cap is below pageSize. */
export async function readSnapshotTable(client, table, pageSize=1000, primaryKey=['id']) {
  const rows=[];
  if (!Array.isArray(primaryKey) || !primaryKey.length || primaryKey.some(key => !/^[a-z][a-z0-9_]*$/.test(key))) throw new Error('A verified primary key is required');
  let count=null;
  while (count===null || rows.length<count) {
    let query=client.from(table).select('*',{count:'exact'}).range(rows.length,rows.length+pageSize-1);
    for (const key of primaryKey) query=query.order(key,{ascending:true,nullsFirst:false});
    const result=await query;
    if (result.error) {
      throw new Error(`Export failed for ${table}: ${result.error.code || 'query_error'}`);
    }
    if (!Number.isSafeInteger(result.count) || result.count<0 || !Array.isArray(result.data)) {
      throw new Error(`Missing verified row count for ${table}`);
    }
    if (count!==null && count!==result.count) throw new Error(`Row count changed during export of ${table}`);
    count=result.count;
    if (result.data.length===0 && rows.length<count) throw new Error(`Truncated export of ${table}`);
    rows.push(...result.data);
    if (rows.length>count) throw new Error(`Unexpected extra rows in ${table}`);
    if (count===0) break;
  }
  const ids=rows.map(row=>{
    if (primaryKey.some(key=>row[key]===undefined || row[key]===null)) throw new Error(`Missing primary key in ${table}`);
    return JSON.stringify(primaryKey.map(key=>row[key]));
  });
  if (new Set(ids).size!==ids.length) throw new Error(`Duplicate row identities in ${table}`);
  return rows;
}

export function verifySnapshot(summary, readText) {
  if (summary?.version!==1 || summary.complete!==true || !summary.source || !Array.isArray(summary.tables)
      || summary.tables.length===0 || summary.tablesWithErrors!==0) throw new Error('Incomplete or unsupported snapshot');
  const seen=new Set();
  return summary.tables.map(entry=>{
    if (!/^[a-z][a-z0-9_]*$/.test(entry.table) || seen.has(entry.table)) throw new Error('Invalid snapshot table manifest');
    seen.add(entry.table);
    const text=readText(entry.table);
    if (snapshotHash(text)!==entry.sha256) throw new Error(`Snapshot checksum mismatch: ${entry.table}`);
    const rows=JSON.parse(text);
    if (!Array.isArray(rows) || rows.length!==entry.count) throw new Error(`Snapshot row-count mismatch: ${entry.table}`);
    return {table:entry.table,rows};
  });
}
