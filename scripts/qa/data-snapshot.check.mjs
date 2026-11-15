import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDecipheriv, randomBytes } from 'node:crypto';
import { requirePrivilegedKey, readSnapshotTable, snapshotHash, verifySnapshot } from '../lib/data-snapshot.mjs';
import { encryptSnapshotArchive, snapshotEncryptionKey } from '../encrypt-snapshot.mjs';

function client(rows,{cap=200,failOffset=-1,countMissing=false,truncated=false,changing=false}={}) {
 return {from(){let offset=0,end=0;const q={select(_columns,options){assert.equal(options.count,'exact');return q;},range(a,b){offset=a;end=b;return q;},order(){return q;},then(resolve,reject){
  return Promise.resolve(offset===failOffset?{error:{code:'42501'}}:{data:truncated?[]:rows.slice(offset,Math.min(end+1,offset+cap)),count:countMissing?null:rows.length+(changing&&offset>0?1:0),error:null}).then(resolve,reject);
 }};return q;}};
}
test('anonymous/publishable/missing keys cannot certify an export',()=>{
 for(const key of [undefined,'','sb_publishable_synthetic',`x.${Buffer.from('{"role":"anon"}').toString('base64url')}.x`])assert.throws(()=>requirePrivilegedKey(key));
 assert.equal(requirePrivilegedKey('sb_secret_synthetic'),'sb_secret_synthetic');
 assert.equal(snapshotEncryptionKey(Buffer.alloc(32,7).toString('base64')).length,32);
 for(const bad of [undefined,'','a'.repeat(32)])assert.throws(()=>snapshotEncryptionKey(bad));
});
test('collects all pages when server cap is lower than requested page size',async()=>{
 for(const n of [0,1,200,201,501,1001]){
  const rows=Array.from({length:n},(_,id)=>({id}));assert.deepEqual(await readSnapshotTable(client(rows),'rows'),rows);
 }
});
test('fails on a later query error rather than exporting partial success',async()=>{
 await assert.rejects(readSnapshotTable(client(Array.from({length:501},(_,id)=>({id})),{failOffset:200}),'rows'),/42501/);
});
test('missing counts, truncation, count changes and duplicate pages fail closed',async()=>{
 for(const options of [{countMissing:true},{truncated:true},{changing:true}])await assert.rejects(readSnapshotTable(client(Array.from({length:501},(_,id)=>({id})),options),'rows'));
 await assert.rejects(readSnapshotTable(client([{id:1},{id:1}]),'rows'),/Duplicate/);
});
test('manifest verifies exact bytes and counts and rejects stale/partial data',()=>{
 const text='[{"id":1}]',entry={table:'rows',count:1,sha256:snapshotHash(text)};
 const summary={version:1,source:'https://synthetic.invalid',complete:true,tablesWithErrors:0,tables:[entry]};
 assert.deepEqual(verifySnapshot(summary,()=>text),[{table:'rows',rows:[{id:1}]}]);
 for(const bad of [{...summary,complete:false},{...summary,tablesWithErrors:1},{...summary,tables:[{...entry,table:'../secret'}]},{...summary,tables:[entry,entry]},{...summary,tables:[{...entry,count:2}]}])assert.throws(()=>verifySnapshot(bad,()=>text));
 assert.throws(()=>verifySnapshot(summary,()=>text+' '),/checksum/);
});
test('encrypted artifact decrypts with authentication; corruption/wrong key are rejected',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'myuno-backup-fixture-'));
 try{
  const text='[{"id":"synthetic","private":"not-visible-in-artifact"}]';
  await writeFile(join(directory,'rows.json'),text);
  await writeFile(join(directory,'_summary.json'),JSON.stringify({version:1,complete:true,source:'synthetic',tablesWithErrors:0,tables:[{table:'rows',count:1,sha256:snapshotHash(text)}]}));
  const key=randomBytes(32),output=join(directory,'..',`${directory.split('/').at(-1)}.bin`);
  try{
   await encryptSnapshotArchive(directory,output,key.toString('base64'));
   const payload=await readFile(output);
   assert.equal(payload.subarray(0,8).toString(),'MYUNOBK1');assert.equal(payload.includes(Buffer.from('not-visible-in-artifact')),false);
   const decrypt=(bytes,k)=>{const decipher=createDecipheriv('aes-256-gcm',k,bytes.subarray(8,20));decipher.setAuthTag(bytes.subarray(-16));return Buffer.concat([decipher.update(bytes.subarray(20,-16)),decipher.final()]);};
   const archive=decrypt(payload,key);assert.equal(archive[0],0x1f);assert.equal(archive[1],0x8b);
   assert.throws(()=>decrypt(payload,randomBytes(32)));
   const corrupted=Buffer.from(payload);corrupted[25]^=1;assert.throws(()=>decrypt(corrupted,key));
   await assert.rejects(encryptSnapshotArchive(directory,output,key.toString('base64')),/EEXIST/);
   assert.deepEqual(await readFile(output),payload,'refusing overwrite must preserve the existing backup');
  }finally{await rm(output,{force:true});}
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('uses ordered composite keys and rejects duplicate or missing non-id identities',async()=>{
 const orders=[];const rows=[{source_table:'a',source_id:'1'},{source_table:'a',source_id:'2'}];
 const fixture=client(rows);const from=fixture.from;fixture.from=(...args)=>{const q=from(...args);q.order=key=>{orders.push(key);return q;};return q;};
 assert.deepEqual(await readSnapshotTable(fixture,'links',1000,['source_table','source_id']),rows);assert.deepEqual(orders,['source_table','source_id']);
 await assert.rejects(readSnapshotTable(client([rows[0],rows[0]]),'links',1000,['source_table','source_id']),/Duplicate/);
 await assert.rejects(readSnapshotTable(client([{source_table:'a'}]),'links',1000,['source_table','source_id']),/Missing primary key/);
 await assert.rejects(readSnapshotTable(client(rows),'links',1000,[]),/verified primary key/);
});
