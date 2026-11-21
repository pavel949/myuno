import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const sql = name => readFile(new URL(name, import.meta.url), 'utf8');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [project, other, hidden, physical, unit, member, staff, employee] = [1,2,3,4,5,6,7,8].map(id);
const make = (n, extra={}) => ({
  intake_request_key:id(n), request_type:'property_consultation', vertical_id:'properties', entry_point:'offplan_buyer',
  name:'Synthetic buyer', phone:'+6600000000', preferred_language:'en',
  vertical_metadata:{schema_version:1,project_id:project,unit_id:unit,property_id:physical,offer_id:null,intent:'viewing',request_only:true},
  ...extra,
});
test('checked offplan activation and isolated rollback on existing consultation table', async t => {
  const db = new PGlite();
  try {
    await db.exec(await sql('fixture.sql'));
    for(const [x,enabled] of [[project,true],[other,true],[hidden,false]]) await db.query('INSERT INTO property_projects VALUES ($1,true,true,$2)',[x,enabled]);
    await db.query('INSERT INTO properties VALUES($1,$2,NULL,true,\'approved\',NULL)',[physical,project]);
    await db.query('INSERT INTO project_units VALUES($1,$2,$3),($4,$2,NULL),($5,$6,NULL)',[unit,project,physical,id(750),id(751),hidden]);
    for(const x of [member,staff,employee]) await db.query('INSERT INTO auth.users VALUES($1)',[x]);
    await db.query("INSERT INTO user_roles VALUES($1,'admin'),($2,'uno_team')",[staff,employee]);
    // Isolated trigger contract: production tour effects are gated by request_type, not
    // a viewing intent. This fixture fails if the new function creates a tour row.
    await db.exec(`
      CREATE TABLE public.intake_synthetic_tours(consultation_id uuid);
      CREATE FUNCTION public.fixture_tour_type_gate() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NEW.request_type = 'property_tour' THEN INSERT INTO public.intake_synthetic_tours VALUES(NEW.id); END IF;
        RETURN NEW;
      END; $$;
      CREATE TRIGGER fixture_tour_type_gate AFTER INSERT ON public.consultation_requests FOR EACH ROW EXECUTE FUNCTION public.fixture_tour_type_gate();
    `);
    const original = await db.query("SELECT pg_get_functiondef('public.submit_consultation_request(jsonb)'::regprocedure) AS definition");
    const forward = await sql('forward.sql');
    await t.test('pre-existing reserved objects abort without changing legacy function', async () => {
      await db.exec('ALTER TABLE public.consultation_requests ADD COLUMN offplan_request_key text');
      await assert.rejects(db.exec(forward), error => error.code === '42701');
      await db.exec('ROLLBACK');
      const current = await db.query("SELECT pg_get_functiondef('public.submit_consultation_request(jsonb)'::regprocedure) AS definition");
      assert.equal(current.rows[0].definition, original.rows[0].definition);
      assert.equal((await db.query("SELECT to_regprocedure('public.submit_offplan_consultation_request(jsonb)') AS id")).rows[0].id,null);
      await db.exec('ALTER TABLE public.consultation_requests DROP COLUMN offplan_request_key');
    });
    await db.exec(forward);
    const changed = await db.query("SELECT pg_get_functiondef('public.submit_consultation_request(jsonb)'::regprocedure) AS definition");
    assert.equal(changed.rows[0].definition, original.rows[0].definition.replace(
      '  clean := clean || jsonb_build_object(',
      "  clean := (clean - 'offplan_request_key' - 'offplan_actor_key' - 'offplan_payload_hash') || jsonb_build_object(",
    ));
    const role = (actor, f) => db.transaction(async tx => {
      await tx.exec(actor ? 'SET LOCAL ROLE authenticated' : 'SET LOCAL ROLE anon');
      await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[actor ?? '']);
      return f(tx);
    });
    const submit = async (payload, actor=null, name='submit_offplan_consultation_request') => {
      const res = await role(actor, tx => tx.query(`SELECT public.${name}($1::jsonb) AS id`,[JSON.stringify(payload)]));
      return res.rows[0].id;
    };
    await t.test('one canonical receipt, recovery after unpublishing, one pair of side effects, no tour',async () => {
      const data = make(100);
      const saved = await submit(data);
      await role(staff, tx => tx.query("UPDATE consultation_requests SET status='contacted' WHERE id=$1",[saved]));
      await db.query('UPDATE property_projects SET public_listing_enabled=false WHERE id=$1',[project]);
      assert.equal(await submit(data),saved);
      await assert.rejects(submit(make(101)),/project_not_public/);
      await db.query('UPDATE property_projects SET public_listing_enabled=true WHERE id=$1',[project]);
      const row = (await db.query('SELECT * FROM consultation_requests WHERE id=$1',[saved])).rows[0];
      assert.equal(row.status,'contacted');
      assert.equal(row.development_project_id,project);
      assert.equal(row.vertical_metadata.property_id,physical);
      assert.equal((await db.query('SELECT * FROM intake_test_events WHERE lead_id=$1',[saved])).rows.length,2);
      assert.equal((await db.query('SELECT * FROM intake_synthetic_tours')).rows.length,0);
    });
    await t.test('same key with changed payload rejects, auth-owned key scope distinct',async () => {
      const data = make(105);
      const guest = await submit(data);
      await assert.rejects(submit({...data,notes:'Changed'}),/intake_key_conflict/);
      const auth = await submit(data,member);
      assert.notEqual(auth,guest);
      assert.equal((await role(member, tx => tx.query('SELECT id FROM consultation_requests WHERE id IN ($1,$2)',[guest,auth]))).rows.length,1);
      assert.equal((await role(employee, tx => tx.query('SELECT id FROM consultation_requests WHERE id IN ($1,$2)',[guest,auth]))).rows.length,0);
      await assert.rejects(submit({...data,intake_actor_hint:'guest'},member),/intake_actor_changed/);
    });
    await t.test('accepts project-only documents and checks canonical unit/offer constraints',async () => {
      const data=make(110);
      const m=data.vertical_metadata;
      const valid={...m,intent:'documents',unit_id:null,property_id:null};
      assert.ok(await submit({...data,vertical_metadata:valid}));
      for (const bad of [{...m,project_id:other},{...m,project_id:hidden},{...m,property_id:id(777)},{...m,offer_id:id(777)},{...m,intent:'documents'}, {...m,request_only:false}]) {
        await assert.rejects(submit({...make(111),vertical_metadata:bad}),/offplan_(?:unit_)?context_invalid|project_not_public/);
      }
      await assert.rejects(submit({...make(113),intake_request_key:null}),/intake_key_required/);
      await assert.rejects(submit({...make(114),vertical_metadata:{...m,property_id:null}}),/offplan_context_invalid/);
      await assert.rejects(submit({...make(115),vertical_metadata:{...m,unit_id:id(750)}}),/offplan_unit_context_invalid/);
      await assert.rejects(submit({...make(116),vertical_metadata:{...m,unit_id:id(751)}}),/offplan_unit_context_invalid/);
    });
    await t.test('legacy RPC & direct unkeyed intake remain unchanged; new dedupe columns are reserved',async () => {
      const legacyPayload={name:'Synthetic legacy',phone:'123456789',request_type:'property_tour'};
      const legacy = await submit({
        ...legacyPayload, offplan_request_key: id(998), offplan_actor_key:'guest', offplan_payload_hash:'a'.repeat(64),
      },null,'submit_consultation_request');
      assert.equal((await db.query('SELECT * FROM intake_synthetic_tours WHERE consultation_id=$1',[legacy])).rows.length,1);
      assert.deepEqual((await db.query('SELECT offplan_request_key,offplan_actor_key,offplan_payload_hash FROM consultation_requests WHERE id=$1',[legacy])).rows[0], {
        offplan_request_key:null, offplan_actor_key:null, offplan_payload_hash:null,
      });
      await role(null, tx => tx.exec("INSERT INTO consultation_requests(request_type,name,phone) VALUES('property_consultation','Synthetic direct','1234567')"));
      await assert.rejects(role(member,tx=>tx.query("UPDATE consultation_requests SET offplan_request_key=$1 WHERE id=(SELECT id FROM consultation_requests WHERE user_id=$2 LIMIT 1)",[id(999),member])),/offplan_key_immutable/);
    });
    await t.test('rollback pauses only offplan RPC and still preserves existing rows',async () => {
      await db.exec(await sql('rollback.sql'));
      await assert.rejects(submit(make(120)),/offplan_consultation_temporarily_unavailable/);
      assert.ok(await submit({name:'Legacy after rollback',phone:'123456789',request_type:'property_consultation'},null,'submit_consultation_request'));
      assert.ok((await db.query('SELECT id FROM consultation_requests WHERE offplan_request_key IS NOT NULL')).rows.length>0);
    });
  } finally {
    await db.close();
  }
});
