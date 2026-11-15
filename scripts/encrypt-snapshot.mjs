#!/usr/bin/env node
import { createCipheriv, randomBytes } from 'node:crypto';
import { appendFile, mkdir, rm, open } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import { verifySnapshot } from './lib/data-snapshot.mjs';

export function snapshotEncryptionKey(encoded) {
  if (typeof encoded!=='string' || !/^[A-Za-z0-9+/]{43}=$/.test(encoded)) throw new Error('BACKUP_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  const key=Buffer.from(encoded,'base64');
  if (key.length!==32) throw new Error('Invalid backup encryption key');
  return key;
}

/** Format: MYUNOBK1, 12-byte IV, AES-256-GCM ciphertext, 16-byte authentication tag. */
export async function encryptSnapshotArchive(inputDirectory, outputFile, encodedKey) {
  const key=snapshotEncryptionKey(encodedKey);
  const summary=JSON.parse(await readFile(resolve(inputDirectory,'_summary.json'),'utf8'));
  // Verify all table bytes before creating a shareable artifact.
  const texts=new Map();
  for (const entry of summary.tables??[]) {
    if (!/^[a-z][a-z0-9_]*$/.test(entry.table)) throw new Error('Invalid manifest');
    texts.set(entry.table,await readFile(resolve(inputDirectory,`${entry.table}.json`),'utf8'));
  }
  verifySnapshot(summary,table=>texts.get(table));
  texts.clear();
  await mkdir(dirname(outputFile),{recursive:true,mode:0o700});
  const file=await open(outputFile,'wx',0o600);
  const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',key,iv);
  const archive=spawn('tar',['-czf','-','-C',resolve(inputDirectory),'.'],{stdio:['ignore','pipe','ignore']});
  const exit=new Promise((resolveExit,reject)=>{
    archive.on('error',reject);
    archive.on('close',code=>code===0?resolveExit():reject(new Error('Archive creation failed')));
  });
  const output=file.createWriteStream();
  output.write(Buffer.concat([Buffer.from('MYUNOBK1'),iv]));
  try {
    await Promise.all([pipeline(archive.stdout,cipher,output),exit]);
    await appendFile(outputFile,cipher.getAuthTag());
  }catch(error){
    archive.kill();await rm(outputFile,{force:true});throw error;
  }finally{key.fill(0);}
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  encryptSnapshotArchive('tmp/export','tmp/encrypted/snapshot.bin',process.env.BACKUP_ENCRYPTION_KEY)
    .catch(()=>{console.error('Snapshot encryption failed; no artifact may be uploaded');process.exitCode=1;});
}
