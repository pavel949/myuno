import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const driver = require('postgres');
const postgres = driver.default ?? driver;
const dir = process.env.POSTGRES_TEST_BIN_DIR;
if (!dir) throw Error('Set POSTGRES_TEST_BIN_DIR to a trusted native PostgreSQL binary directory');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const read = name => readFile(new URL(name, import.meta.url), 'utf8');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [project, physical, unit, nonce] = [1,2,3,100].map(id);

test('six native PostgreSQL backends return one receipt under observed unique-index contention', { timeout: 30_000 }, async () => {
  const socket = await mkdtemp(join(tmpdir(),'ofpc-'));
  const data = join(socket,'data');
  const env = { ...process.env };
  if (env.POSTGRES_TEST_LIB_DIR) env.LD_LIBRARY_PATH = env.POSTGRES_TEST_LIB_DIR;
  const invoke = (bin, args) => {
    const res = spawnSync(join(dir,bin),args,{ env, encoding:'utf8' });
    if (res.status !== 0) throw Error(`${bin} failed: ${res.error || ''} ${res.stdout} ${res.stderr}`);
    return res.stdout;
  };
  const sessions = [];
  let started = false;
  let finishWinner = () => {};
  let jobs = [];
  const connect = () => {
    const client = postgres({ host:'127.0.0.1', username:'postgres', database:'postgres', password:'', port:55492, max:1, idle_timeout:10 });
    sessions.push(client);
    return client;
  };
  try {
    invoke('initdb', ['-A','trust','-U','postgres','--no-locale','-D',data,
      ...(env.POSTGRES_TEST_SHARE_DIR ? ['-L',env.POSTGRES_TEST_SHARE_DIR] : [])]);
    invoke('pg_ctl', ['-D',data,'-l',join(socket,'server.log'),'-o',`-p 55492 -c listen_addresses=127.0.0.1 -c unix_socket_directories='' -c statement_timeout=15000`,'-w','start']);
    started = true;
    const observer = connect();
    const forward = await read('forward.sql');
    const fingerprint = createHash('sha256').update(forward).digest('hex');
    assert.equal(fingerprint,'8fc87467390f1640027ba3e4eaba77a187a036c101ff824ea4e3206fb9414d17');
    await observer.unsafe(await read('fixture.sql'));
    await observer.unsafe(forward);
    await observer`INSERT INTO property_projects VALUES(${project},true,true,true)`;
    await observer`INSERT INTO properties VALUES(${physical},${project},NULL,true,'approved',NULL)`;
    await observer`INSERT INTO project_units VALUES(${unit},${project},${physical})`;
    const payload = {
      intake_request_key:nonce, intake_actor_hint:'guest', request_type:'property_consultation', vertical_id:'properties', entry_point:'offplan_buyer',
      name:'Concurrent synthetic buyer', phone:'+6600000000',
      vertical_metadata:{ schema_version:1, project_id:project, unit_id:unit, property_id:physical, offer_id:null, intent:'viewing', request_only:true },
    };
    const [winner,...contenders] = Array.from({ length:6 },connect);
    const pids = await Promise.all([winner,...contenders].map(async client => (await client`SELECT pg_backend_pid() AS pid`)[0].pid));
    assert.equal(new Set(pids).size,6);
    let announceWinner;
    const winnerHasRow = new Promise(resolve => { announceWinner=resolve; });
    const hold = new Promise(resolve => { finishWinner=resolve; });
    const run = (client, first=false) => client.begin(async tx => {
      await tx.unsafe('SET LOCAL ROLE anon');
      const [row] = await tx`SELECT public.submit_offplan_consultation_request(${tx.json(payload)}) AS receipt`;
      if (first) { announceWinner(); await hold; }
      return row.receipt;
    });
    jobs.push(run(winner,true));
    await Promise.race([winnerHasRow,jobs[0]]);
    jobs.push(...contenders.map(client => run(client)));
    const deadline = Date.now()+5_000;
    let waiting=[];
    while (Date.now()<deadline) {
      waiting = await observer`SELECT pid,wait_event_type,wait_event FROM pg_stat_activity
        WHERE pid=ANY(${pids.slice(1)}::int[]) AND wait_event_type='Lock' AND wait_event='transactionid'`;
      if (waiting.length===5) break;
      await sleep(25);
    }
    assert.equal(waiting.length,5,'all five contenders must enter native transaction-ID lock contention before releasing winner');
    finishWinner();
    const receipts=await Promise.all(jobs);
    assert.equal(new Set(receipts).size,1);
    const rows=await observer`SELECT id FROM consultation_requests WHERE offplan_request_key=${nonce}`;
    assert.equal(rows.length,1);
    assert.equal(rows[0].id,receipts[0]);
    const effects=await observer`SELECT kind FROM intake_test_events WHERE lead_id=${receipts[0]} ORDER BY kind`;
    assert.deepEqual(effects.map(row=>row.kind),['crm','notification']);
    const [v] = await observer`SHOW server_version`;
    console.log(JSON.stringify({ serverVersion:v.server_version, uniqueBackends:pids.length, observedWaiters:waiting.length,
      receiptCount:new Set(receipts).size, persistedRequests:rows.length, inertEffects:effects.map(row=>row.kind), forwardSha256:fingerprint }));
  } finally {
    finishWinner();
    await Promise.allSettled(jobs);
    await Promise.allSettled(sessions.map(client => client.end({ timeout:2 })));
    if (started) invoke('pg_ctl',['-D',data,'-m','immediate','-w','stop']);
    if (!started) console.error(await readFile(join(socket,'server.log'),'utf8').catch(() => 'No PostgreSQL log'));
    await rm(socket,{recursive:true,force:true});
  }
});
