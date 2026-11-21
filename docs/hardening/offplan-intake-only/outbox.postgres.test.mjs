import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const sql = f => readFile(new URL(f, import.meta.url), 'utf8');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const project = id(1);
const payload = key => ({
  request_type:'property_consultation', vertical_id:'properties', entry_point:'offplan_buyer',
  name:'Synthetic buyer', phone:'+6600000000', intake_request_key:id(key),
  vertical_metadata:{schema_version:1,project_id:project,request_only:true,intent:'consultation'},
});
const call = (db, name, body) => db.query(`SELECT public.${name}($1::jsonb) AS id`, [JSON.stringify(body)]);
const count = async (db, table) => Number((await db.query(`SELECT count(*) AS n FROM ${table}`)).rows[0].n);

test('newbuild-only outbox composes with the exact checked writer', async t => {
  const db = new PGlite();
  try {
    await db.exec(await sql('fixture.sql'));
    await db.query('INSERT INTO property_projects VALUES($1,true,true,true)', [project]);
    await assert.rejects(db.exec(await sql('outbox-forward.sql')), /checked_offplan_intake_required/);
    await db.exec('ROLLBACK');
    await db.exec(await sql('forward.sql'));
    const prior = await call(db,'submit_offplan_consultation_request',payload(3));
    const legacyDefinition = (await db.query("SELECT pg_get_functiondef('public.submit_consultation_request(jsonb)'::regprocedure) AS body")).rows[0].body;
    await db.exec(await sql('outbox-forward.sql'));
    assert.equal((await db.query("SELECT pg_get_functiondef('public.submit_consultation_request(jsonb)'::regprocedure) AS body")).rows[0].body, legacyDefinition);
    await t.test('only new keyed offplan inserts queue one item per channel, without backfill or replay', async () => {
      assert.equal((await call(db,'submit_offplan_consultation_request',payload(3))).rows[0].id,prior.rows[0].id);
      await call(db,'submit_consultation_request',payload(4));
      assert.equal(await count(db,'private.consultation_notification_outbox'),0);
      const first = await call(db,'submit_offplan_consultation_request',payload(5));
      const retry = await call(db,'submit_offplan_consultation_request',payload(5));
      assert.equal(first.rows[0].id,retry.rows[0].id);
      const jobs = await db.query('SELECT request_id,channel,state FROM private.consultation_notification_outbox ORDER BY channel');
      assert.deepEqual(jobs.rows, ['email','whatsapp'].map(channel=>({ request_id:first.rows[0].id,channel,state:'pending' })));
    });
    await t.test('queue insertion failure rolls the request and in-transaction effects back', async () => {
      await db.exec(`ALTER TABLE private.consultation_notification_outbox ADD CONSTRAINT synthetic_fail CHECK (FALSE) NOT VALID`);
      const before = await count(db,'public.consultation_requests');
      await assert.rejects(call(db,'submit_offplan_consultation_request',payload(6)), /synthetic_fail/);
      assert.equal(await count(db,'public.consultation_requests'),before);
      assert.equal(await count(db,'private.consultation_notification_outbox'),2);
      await db.exec('ALTER TABLE private.consultation_notification_outbox DROP CONSTRAINT synthetic_fail');
    });
    await t.test('browser actors cannot read queue or claim; service worker claims both independently', async () => {
      for(const actor of ['anon','authenticated']){
        await db.exec(`SET ROLE ${actor}`);
        await assert.rejects(db.query('SELECT request_id FROM private.consultation_notification_outbox'), /permission denied/);
        await assert.rejects(db.query('SELECT job_id FROM public.claim_consultation_notifications()'), /permission denied/);
        await db.exec('RESET ROLE');
      }
      await db.exec('SET ROLE service_role');
      const jobs = (await db.query('SELECT * FROM public.claim_consultation_notifications() ORDER BY channel')).rows;
      assert.deepEqual(jobs.map(job=>job.channel),['email','whatsapp']);
      assert.equal(jobs[0].lead.vertical_metadata.project_id,project);
      await db.query("SELECT public.finish_consultation_notification($1,$2,'accepted','synthetic-provider-reference')",[jobs[0].job_id,jobs[0].token]);
      await db.query("SELECT public.finish_consultation_notification($1,$2,'uncertain')",[jobs[1].job_id,jobs[1].token]);
      assert.equal((await db.query('SELECT * FROM public.claim_consultation_notifications()')).rows.length,0);
      await db.exec('RESET ROLE');
      assert.deepEqual((await db.query('SELECT state FROM private.consultation_notification_outbox ORDER BY channel')).rows,[{state:'accepted'},{state:'uncertain'}]);
    });
  } finally { await db.close(); }
});
