import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import postgres from 'postgres';
let dir,sql,started=false;
const bin=process.env.POSTGRES_TEST_BIN_DIR || execFileSync('pg_config',['--bindir'],{encoding:'utf8'}).trim();
const run=(cmd,args)=>execFileSync(join(bin,cmd),args,{encoding:'utf8'});
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const project=uuid(1),other=uuid(2),hidden=uuid(3),property=uuid(4),unit=uuid(6),owner=uuid(7),stranger=uuid(8);
let nonce=100;
const payload=(patch={})=>({intake_request_key:uuid(nonce++),request_type:'property_consultation',name:'Synthetic',phone:'+66000000000',vertical_id:'properties',entry_point:'offplan_buyer',vertical_metadata:{project_id:project,unit_id:unit,property_id:property,intent:'consultation',request_only:true},...patch});
const actor=(role,uid,fn)=>sql.begin(async c=>{await c.unsafe(`SET LOCAL ROLE ${role}`);await c`SELECT set_config('request.jwt.claim.sub',${uid||''},true)`;return fn(c);});
const submit=(p,role='anon',uid=null)=>actor(role,uid,async c=>(await c`SELECT public.submit_consultation_request(${c.json(p)}) id`)[0].id);
const claim=()=>actor('service_role',null,c=>c`SELECT * FROM public.claim_consultation_notifications()`);
const finish=(j,outcome='accepted',token=j.token)=>actor('service_role',null,async c=>(await c`SELECT public.finish_consultation_notification(${j.job_id},${token},${outcome},${outcome==='accepted'?'synthetic-reference':null}) ok`)[0].ok);
const queue=id=>sql`SELECT * FROM private.consultation_notification_outbox WHERE request_id=${id} ORDER BY channel`;
let old,oldPayload;
before(async()=>{
 assert.notEqual(process.getuid(),0,'Run disposable database tests as unprivileged user');
 dir=mkdtempSync(join(tmpdir(),'myuno-outbox-'));
 const args = ['-D', join(dir, 'data'), '-A', 'trust', '--no-locale'];
 if (process.env.POSTGRES_TEST_SHARE_DIR) args.push('-L', process.env.POSTGRES_TEST_SHARE_DIR);
 run('initdb', args);
 const lib = process.env.POSTGRES_TEST_LIB_DIR;
 const databaseOptions = `-k ${dir} -p 55492 -c listen_addresses=''${lib ? ` -c dynamic_library_path=${lib}` : ''}`;
 run('pg_ctl', ['-D', join(dir, 'data'), '-l', join(dir, 'postgres.log'), '-o', databaseOptions, '-w', 'start']);
 started = true;
 sql=postgres({host:dir,port:55492,database:'postgres',username:process.env.USER,password:'',max:12});
 await sql.unsafe(readFileSync('src/lib/__tests__/fixtures/consultation-intake-base.sql','utf8'));
 const migrate=async path=>{const c=await sql.reserve();try{await c.unsafe(readFileSync(path,'utf8'));}catch(e){await c.unsafe('ROLLBACK');throw e;}finally{c.release();}};
 await migrate('docs/hardening/consultation-intake/forward.sql');
 await sql`INSERT INTO property_projects VALUES(${project},true,true,true),(${other},true,true,true),(${hidden},false,true,true)`;
 await sql`INSERT INTO properties VALUES(${property},${project},${owner},true,'approved',NULL)`;
 await sql`INSERT INTO project_units VALUES(${unit},${project},${property})`;
 await sql`INSERT INTO auth.users VALUES(${owner}),(${stranger})`;
 oldPayload=payload();old=await submit(oldPayload);
 await migrate('docs/hardening/lead-outbox-review/forward.sql');
});
after(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(dir,'data'),'-m','immediate','-w','stop']);if(dir)rmSync(dir,{recursive:true,force:true});});
test('old receipts do not backfill unverified prior delivery',async()=>{assert.equal(await submit(oldPayload),old);assert.equal((await queue(old)).length,0);});
test('guest request saves exactly two intents and returns only receipt',async()=>{const id=await submit(payload());assert.equal((await queue(id)).length,2);assert.equal((await actor('anon',null,c=>c`SELECT * FROM consultation_requests`)).length,0);});
test('anon and authenticated cannot query/mutate/truncate queue or call worker RPCs',async()=>{for(const role of ['anon','authenticated'])for(const query of ['SELECT * FROM private.consultation_notification_outbox','DELETE FROM private.consultation_notification_outbox',"INSERT INTO private.consultation_notification_outbox(request_id,channel) VALUES('00000000-0000-4000-8000-000000000099','email')","UPDATE private.consultation_notification_outbox SET state='accepted'",'TRUNCATE private.consultation_notification_outbox','SELECT * FROM public.claim_consultation_notifications()',`SELECT public.finish_consultation_notification('${uuid(99)}','${uuid(98)}','accepted','fake')`])await assert.rejects(actor(role,owner,c=>c.unsafe(query)),{code:'42501'});});
test('forged identity/workflow is stripped; actor hint cannot impersonate',async()=>{const id=await submit(payload({user_id:stranger,status:'completed'}),'authenticated',owner);const [r]=await sql`SELECT user_id,status FROM consultation_requests WHERE id=${id}`;assert.equal(r.user_id,owner);assert.equal(r.status,'pending');await assert.rejects(submit(payload({intake_actor_hint:owner})),{code:'42501'});});
test('hidden project and unrelated unit/property rejected without jobs',async()=>{for(const meta of [{project_id:hidden},{project_id:other,unit_id:unit},{project_id:project,unit_id:unit,property_id:uuid(99)}]){const [before]=await sql`SELECT count(*) n FROM private.consultation_notification_outbox`;await assert.rejects(submit(payload({vertical_metadata:meta})));const [after]=await sql`SELECT count(*) n FROM private.consultation_notification_outbox`;assert.equal(after.n,before.n);}});
test('six concurrent identical submits yield one request and two intents',async()=>{const p=payload();const ids=await Promise.all(Array.from({length:6},()=>submit(p)));assert.equal(new Set(ids).size,1);assert.equal((await queue(ids[0])).length,2);assert.equal(await submit(p),ids[0]);await assert.rejects(submit({...p,name:'Changed'}),{code:'23505'});});
test('different actors cannot recover another actor receipt',async()=>{const p=payload();const a=await submit(p,'authenticated',owner),b=await submit(p,'authenticated',stranger);assert.notEqual(a,b);});
test('failed enqueue atomically rolls back request and canonical effects',async()=>{await sql.unsafe(`CREATE FUNCTION private.synthetic_fail_queue() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic queue failure'; END $$; CREATE TRIGGER synthetic_fail_queue BEFORE INSERT ON private.consultation_notification_outbox FOR EACH ROW EXECUTE FUNCTION private.synthetic_fail_queue();`);const p=payload();try{await assert.rejects(submit(p));assert.equal((await sql`SELECT id FROM consultation_requests WHERE intake_request_key=${p.intake_request_key}`).length,0);}finally{await sql.unsafe('DROP TRIGGER synthetic_fail_queue ON private.consultation_notification_outbox; DROP FUNCTION private.synthetic_fail_queue();');}});
test('concurrent claims are disjoint and accepted rows never reappear',async()=>{const [a,b]=await Promise.all([claim(),claim()]);const jobs=[...a,...b];assert.equal(new Set(jobs.map(j=>j.job_id)).size,jobs.length);assert.ok(jobs.length>0);for(const j of jobs)assert.equal(await finish(j),true);assert.equal((await claim()).length,0);});
test('wrong/stale token fails; channel outcomes independent',async()=>{const id=await submit(payload());const jobs=await claim();assert.equal(jobs.length,2);assert.equal(await finish(jobs[0],'accepted',uuid(99)),false);assert.equal(await finish(jobs[0]),true);assert.equal(await finish(jobs[0]),false);assert.equal(await finish(jobs[1],'uncertain'),true);assert.deepEqual((await queue(id)).map(x=>x.state).sort(),['accepted','uncertain']);assert.equal((await claim()).length,0);});
test('expired lease becomes uncertain without replay',async()=>{const id=await submit(payload());const jobs=await claim();await sql`UPDATE private.consultation_notification_outbox SET lease_until=now()-interval '1 second' WHERE request_id=${id}`;assert.equal(await finish(jobs[0]),false);assert.equal((await claim()).length,0);assert.ok((await queue(id)).every(x=>x.state==='uncertain'));});
test('definite rejection backs off and fifth attempt becomes dead',async()=>{const id=await submit(payload());for(let i=1;i<=5;i++){const jobs=await claim();assert.equal(jobs.length,2);assert.ok(jobs.every(x=>x.attempt===i));for(const j of jobs)await finish(j,'rejected');assert.equal((await claim()).length,0);await sql`UPDATE private.consultation_notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE request_id=${id}`;}assert.ok((await queue(id)).every(x=>x.state==='dead'));assert.equal((await claim()).length,0);});

test('general newbuild requests enqueue, while existing consultation paths keep their current dispatch', async () => {
  const general = await submit(payload({
    entry_point: '/property/offplan',
    vertical_metadata: { marketplace: 'newbuilds', buyer_intent: 'property_consultation' },
  }));
  assert.equal((await queue(general)).length, 2);
  const legacy = await submit(payload({
    entry_point: 'offplan_project_legacy',
    vertical_metadata: {},
  }));
  assert.equal((await queue(legacy)).length, 0);
});

test('legacy public lead stays internal and generates an exact Inbox notification', async () => {
  const developer = uuid(30), admin = uuid(31), lead = uuid(32);
  await sql.unsafe(`
    CREATE TABLE public.developers (id uuid PRIMARY KEY, user_id uuid NOT NULL);
    CREATE TABLE public.nb_leads (
      id uuid PRIMARY KEY, developer_id uuid, phone text NOT NULL,
      transferred_to_developer boolean DEFAULT false, transferred_at timestamptz
    );
    CREATE TABLE public.notifications (user_id uuid, title text, body text, type text, data jsonb);
    CREATE TABLE public.synthetic_external_dispatch (lead_id uuid);
    CREATE FUNCTION public.synthetic_legacy_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN INSERT INTO public.synthetic_external_dispatch VALUES (NEW.id); RETURN NEW; END;
    $$;
    CREATE TRIGGER trg_nb_lead_notify AFTER INSERT ON public.nb_leads FOR EACH ROW
      EXECUTE FUNCTION public.synthetic_legacy_dispatch();
    ALTER TABLE public.nb_leads ENABLE ROW LEVEL SECURITY;
    GRANT INSERT, SELECT, UPDATE ON public.nb_leads TO anon, authenticated;
    GRANT SELECT ON public.developers TO authenticated;
    CREATE POLICY "Developer read own nb_leads" ON public.nb_leads FOR SELECT TO authenticated
      USING (developer_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()));
    CREATE POLICY legacy_public_insert ON public.nb_leads FOR INSERT TO anon, authenticated
      WITH CHECK (phone <> '');
    CREATE POLICY legacy_admin ON public.nb_leads FOR ALL TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  `);
  await sql`INSERT INTO public.developers VALUES (${developer}, ${owner})`;
  await sql`INSERT INTO public.user_roles VALUES (${admin}, 'admin')`;
  const migration = await sql.reserve();
  try {
    await migration.unsafe(readFileSync('docs/hardening/lead-outbox-review/legacy-newbuild-privacy.sql', 'utf8'));
  } catch (error) {
    await migration.unsafe('ROLLBACK');
    throw error;
  } finally {
    migration.release();
  }

  await actor('anon', null, c => c`INSERT INTO public.nb_leads (id, developer_id, phone)
    VALUES (${lead}, ${developer}, '+66000000000')`);
  assert.equal((await actor('authenticated', owner, c => c`SELECT id FROM public.nb_leads`)).length, 0);
  assert.equal((await actor('authenticated', admin, c => c`SELECT id FROM public.nb_leads`))[0].id, lead);
  assert.equal((await sql`SELECT lead_id FROM public.synthetic_external_dispatch`).length, 0);
  const [notice] = await sql`SELECT user_id, data, body FROM public.notifications`;
  assert.equal(notice.user_id, admin);
  assert.deepEqual(notice.data, { lead_id: lead, action_url: '/admin/inbox?source=nb_leads&request=' + lead });
  assert.doesNotMatch(notice.body, /66000000000/);

  await assert.rejects(actor('authenticated', owner, c => c`INSERT INTO public.nb_leads
    (id, developer_id, phone, transferred_to_developer, transferred_at)
    VALUES (${uuid(33)}, ${developer}, '+66000000000', TRUE, now())`), { code: '42501' });
  await actor('authenticated', admin, c => c`UPDATE public.nb_leads
    SET transferred_to_developer = TRUE, transferred_at = now() WHERE id = ${lead}`);
  assert.equal((await actor('authenticated', owner, c => c`SELECT id FROM public.nb_leads`))[0].id, lead);
  assert.equal((await actor('authenticated', stranger, c => c`SELECT id FROM public.nb_leads`)).length, 0);
});
