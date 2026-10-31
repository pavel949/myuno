// Shared isolated SQL harness. No inherited DATABASE_URL / Supabase credentials.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, chmodSync, chownSync, rmSync } from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { join } from 'node:path';
export function disposablePostgres() {
  const supplied=process.env.RENTAL_TEST_PG_SOCKET;
  if (supplied) {
    if (!supplied.startsWith('/tmp/')) throw new Error('Synthetic PostgreSQL socket must be under /tmp');
    return { connection:{host:supplied,username:'isolated_test',password:'',port:5432}, close(){} };
  }
  const directory=mkdtempSync(join(tmpdir(),'myuno-request-tests-'));
  chmodSync(directory,0o700);
  const root=process.getuid?.()===0;
  if(root)chownSync(directory,65534,65534);
  const username=root?'nobody':userInfo().username;
  let started=false;
  const run=(name,args)=>root?execFileSync('runuser',['-u',username,'--',name,...args],{stdio:'pipe'}):execFileSync(name,args,{stdio:'pipe'});
  try {
    run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale']);
    run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'postgres.log'),'-o',`-k ${directory} -p 55461 -c listen_addresses=''`,'-w','start']);
    started=true;
  } catch(error) {rmSync(directory,{recursive:true,force:true});throw error;}
  return {connection:{host:directory,username,password:'',port:55461},close(){try{if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','-w','stop']);}finally{rmSync(directory,{recursive:true,force:true});}}};
}
