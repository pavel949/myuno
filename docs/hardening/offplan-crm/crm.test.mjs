import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { test } from 'node:test';
const { PGlite } = createRequire(import.meta.url)('@electric-sql/pglite');
const read = path => readFile(new URL(path,import.meta.url),'utf8');
const key = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const [actor, staff, outsider, company, otherCompany, space, otherSpace, project, physical, unit, request] = Array.from({length:11},(_,i)=>key(i+1));
test('scoped minimum-identity CRM workflow uses canonical lead, deals and activity', async t => {
  const db = new PGlite();
  try {
    await db.exec(await read('fixture.sql'));
    await db.exec(await read('forward.sql'));
    await db.query("INSERT INTO auth.users VALUES ($1),($2),($3)",[actor,staff,outsider]);
    await db.query("INSERT INTO user_roles VALUES($1,'admin'),($2,'uno_team'),($3,'admin')",[actor,staff,outsider]);
    await db.query("INSERT INTO management_companies VALUES($1,true,true),($2,true,true)",[company,otherCompany]);
    await db.query("INSERT INTO management_company_members VALUES($1,$2,true,'owner'),($1,$3,true,'owner'),($4,$5,true,'owner')",[company,actor,staff,otherCompany,outsider]);
    await db.query("INSERT INTO property_projects VALUES($1,true,true,true)",[project]);
    await db.query("INSERT INTO properties VALUES($1,$2,NULL,true,'approved',NULL,$3)",[physical,project,company]);
    await db.query("INSERT INTO project_units VALUES($1,$2,$3)",[unit,project,physical]);
    await db.query("INSERT INTO private.fixture_scope VALUES($1,$2,$3,$4,true),($5,$2,$3,$4,true)",[actor,company,space,physical,staff]);
    const metadata={schema_version:1,project_id:project,unit_id:unit,property_id:physical,offer_id:null,intent:'viewing',request_only:true};
    const create = (id, metadataValue=metadata, owner=actor, status='in_progress', verified=true) => db.query(
      "INSERT INTO consultation_requests(id,request_type,name,phone,email,notes,entry_point,vertical_id,development_project_id,vertical_metadata,assigned_to,status,offplan_actor_key,offplan_request_key,offplan_payload_hash) VALUES($1,'property_consultation','Synthetic person','123456789','buyer@example.test','Private synthetic note','offplan_buyer','properties',$2,$3,$4,$5,$6,$7,$8)",
      [id,project,metadataValue,owner,status,verified?'guest':null,verified?id:null,verified?'a'.repeat(64):null],
    );
    await create(request);
    const convert = (who=actor,dest=company,where=space,requestId=request) => db.transaction(async tx=>{
      await tx.exec(who ? 'SET LOCAL ROLE authenticated' : 'SET LOCAL ROLE anon');
      await tx.query("SELECT set_config('request.jwt.claim.sub',$1,true)",[who||'']);
      return (await tx.query('SELECT public.convert_checked_offplan_to_deal($1,$2,$3) AS id',[requestId,dest,where])).rows[0].id;
    });
    await t.test('rejects actor lacking admin, source assignment, company membership or exact enforced space', async()=>{
      await assert.rejects(convert(staff),/offplan_crm_not_authorized/);
      await assert.rejects(convert(outsider),/offplan_crm_not_authorized/);
      await assert.rejects(convert(null),/permission denied/);
      await assert.rejects(convert(actor,otherCompany),/offplan_crm_not_authorized/);
      await assert.rejects(convert(actor,company,otherSpace),/offplan_crm_scope_unverified/);
      await create(key(20),metadata,outsider);
      await assert.rejects(convert(actor,company,space,key(20)),/offplan_crm_not_authorized/);
    });
    await t.test('rejects unverified, project-only, documents-only, and not-qualified requests', async()=>{
      await create(key(21),metadata,actor,'in_progress',false);
      await assert.rejects(convert(actor,company,space,key(21)),/offplan_crm_not_authorized/);
      await create(key(22),{...metadata,unit_id:null,property_id:null});
      await assert.rejects(convert(actor,company,space,key(22)),/offplan_crm_context_unavailable/);
      await create(key(23),{...metadata,intent:'documents'});
      await assert.rejects(convert(actor,company,space,key(23)),/offplan_crm_context_unavailable/);
      await create(key(24),metadata,actor,'pending');
      await assert.rejects(convert(actor,company,space,key(24)),/offplan_crm_request_not_in_progress/);
      assert.equal((await db.query('SELECT id FROM agent_deals')).rows.length,0);
    });
    await t.test('failure writing deal activity cannot leave an orphan deal or change request', async()=>{
      await db.exec(`
        CREATE FUNCTION private.fixture_fail_activity() RETURNS trigger
        LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic_activity_unavailable'; END $$;
        CREATE TRIGGER fixture_fail_activity BEFORE INSERT ON public.agent_deal_activities
        FOR EACH ROW EXECUTE FUNCTION private.fixture_fail_activity();
      `);
      try {
        await assert.rejects(convert(),/synthetic_activity_unavailable/);
        assert.equal((await db.query('SELECT id FROM agent_deals')).rows.length,0);
        assert.equal((await db.query('SELECT converted_deal_id FROM consultation_requests WHERE id=$1',[request])).rows[0].converted_deal_id,null);
      } finally {
        await db.exec('DROP TRIGGER fixture_fail_activity ON public.agent_deal_activities');
      }
    });
    await t.test('inserts once, stamps link, and copies no contact details or private source notes', async()=>{
      const first=await convert();
      assert.equal(await convert(),first);
      const [deal]=(await db.query('SELECT * FROM agent_deals')).rows;
      assert.equal(deal.id,first);
      assert.equal(deal.client_name,'myUNO newbuild request');
      assert.equal(deal.client_email,null);
      assert.equal(deal.client_phone,null);
      assert.equal(deal.notes,null);
      assert.equal(deal.contact_id,null);
      assert.equal(deal.property_project_id,project);
      assert.equal(deal.property_id,physical);
      const lead=(await db.query('SELECT * FROM consultation_requests WHERE id=$1',[request])).rows[0];
      assert.equal(lead.converted_deal_id,first);
      assert.equal(lead.status,'in_progress');
      assert.equal(lead.conversion_order_id,null);
      assert.deepEqual(lead.vertical_metadata,metadata);
      assert.equal((await db.query('SELECT * FROM agent_deal_activities WHERE deal_id=$1',[first])).rows.length,1);
    });
    await t.test('same request after entitlement revocation exposes no linked deal; wrong-company link requires review', async()=>{
      await db.query('UPDATE private.fixture_scope SET is_active=false WHERE actor=$1',[actor]);
      await assert.rejects(convert(),/offplan_crm_scope_unverified/);
      await db.query('UPDATE private.fixture_scope SET is_active=true WHERE actor=$1',[actor]);
      await db.query('UPDATE agent_deals SET company_id=$1',[otherCompany]);
      await assert.rejects(convert(),/offplan_crm_existing_link_requires_review/);
      assert.equal((await db.query('SELECT id FROM agent_deals')).rows.length,1);
    });
    await t.test('rollback pauses only newly added endpoint and preserves existing links',async()=>{
      await db.exec(await read('rollback.sql'));
      await assert.rejects(convert(),/permission denied/);
      assert.equal((await db.query('SELECT id FROM agent_deals')).rows.length,1);
      assert.ok((await db.query('SELECT converted_deal_id FROM consultation_requests WHERE id=$1',[request])).rows[0].converted_deal_id);
      assert.ok((await db.query("SELECT to_regprocedure('public.submit_consultation_request(jsonb)') AS existing")).rows[0].existing);
    });
  } finally { await db.close(); }
});
