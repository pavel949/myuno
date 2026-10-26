// Local-only acceptance adapter. No production client, URL, credentials or data.
import postgres from 'postgres';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import path from 'node:path';
import { quotePropertyStay } from '../../../supabase/functions/_shared/property-quote.ts';
import { quoteHotelStay, mergeRestrictions } from '../../../supabase/functions/_shared/hotel-quote.ts';
export const ids = {
  owner:'00000000-0000-0000-0000-000000000002', foreign:'00000000-0000-0000-0000-000000000005',
  unit:'00000000-0000-0000-0000-000000000001', other:'00000000-0000-0000-0000-000000000006',
  hotel:'00000000-0000-0000-0000-000000000007', category:'00000000-0000-0000-0000-000000000003',
  otherCategory:'00000000-0000-0000-0000-000000000008', booking:'00000000-0000-0000-0000-000000000004',
};
export async function startFixture(root, output) {
  // Fixed loopback target; a URL/env override cannot redirect this harness to live DB.
  const settings={host:'127.0.0.1',port:15439,user:'postgres',prepare:false,max:4};
  const admin=postgres({...settings,database:'postgres',max:1});
  const database='pricing_acceptance_test_'+randomBytes(6).toString('hex');
  await admin.unsafe(`CREATE DATABASE ${database}`);
  const sql=postgres({...settings,database});
  const calls=[]; let failNext=false;
  try {
    let schema=(await readFile(path.join(root,'scripts/qa/calendar-pricing.sql'),'utf8')).split('INSERT INTO properties VALUES')[0].replace(/^\\set.*$/gm,'');
    for(const name of ['20261021062539_canonical_pricing_calendar','20261021063811_canonical_pricing_calendar_read']) {
      const migration=await readFile(path.join(root,`supabase/migrations/${name}.sql`),'utf8');
      schema=schema.replace(`\\ir ../../supabase/migrations/${name}.sql`,()=>migration);
    }
    await sql.unsafe(schema);
    await sql.unsafe(`
      ALTER TABLE properties ADD price_per_night numeric, ADD price numeric, ADD price_period text DEFAULT 'night',
        ADD extra_cleaning_price numeric DEFAULT 0, ADD is_active boolean DEFAULT true, ADD status text DEFAULT 'verified',
        ADD max_guests integer DEFAULT 4, ADD min_stay_nights integer DEFAULT 1;
      ALTER TABLE property_room_categories ADD base_price_per_night numeric, ADD min_stay_nights integer DEFAULT 1,
        ADD max_guests integer DEFAULT 4, ADD is_active boolean DEFAULT true;
      CREATE TABLE property_rate_seasons(property_id uuid,category_id uuid,start_date date,end_date date,nightly_rate numeric,is_active boolean DEFAULT true);
      CREATE TABLE property_rate_plans(id uuid,category_id uuid,adjustment_type text,adjustment_value numeric,min_stay_nights integer,max_stay_nights integer,min_advance_days integer,is_active boolean DEFAULT true);
    `);
    for(const [id,base] of [[ids.unit,1000],[ids.other,1100],[ids.hotel,2000]]) await sql`INSERT INTO properties(id,owner_id,currency,price_per_night) VALUES(${id},${ids.owner},'THB',${base})`;
    for(const [id,base] of [[ids.category,2200],[ids.otherCategory,1200]]) {
      await sql`INSERT INTO property_room_categories(id,property_id,base_price_per_night) VALUES(${id},${ids.hotel},${base})`;
      await sql`INSERT INTO property_rate_plans(id,category_id,adjustment_type,adjustment_value) VALUES(${id},${id},'percent',${id===ids.category?10:0})`;
    }
    for(const [property,category,oldPrice,newPrice] of [[ids.unit,null,1500,2000],[ids.hotel,ids.category,2500,3000]]) {
      await sql`INSERT INTO property_rate_seasons VALUES(${property},${category},'2026-11-10','2026-11-15',${oldPrice},true),(${property},${category},'2026-11-11','2026-11-15',${newPrice},true)`;
    }
    await sql`INSERT INTO property_availability VALUES(${ids.unit},'2026-11-09',100,'blocked',${ids.booking},3)`;
    await sql`INSERT INTO property_stay_restrictions(property_id,category_id,date,price_override,stop_sell,min_stay_nights,closed_to_arrival) VALUES(${ids.hotel},${ids.category},'2026-11-09',500,true,3,true)`;
    const rpc=async (name,args,actor=ids.owner,scopeDenied=false) => sql.begin(async tx=>{
      await tx.unsafe('SET LOCAL ROLE authenticated');
      await tx`SELECT set_config('test.actor',${actor},true)`;
      await tx`SELECT set_config('test.scope_denied',${scopeDenied?'true':'false'},true)`;
      let rows;
      if(name==='get_property_calendar_prices') rows=await tx`SELECT public.get_property_calendar_prices(${args.p_property_id}::uuid,${args.p_category_id}::uuid,${args.p_from}::date,${args.p_to}::date) AS result`;
      else if(name==='set_property_calendar_price') rows=await tx`SELECT public.set_property_calendar_price(${args.p_property_id}::uuid,${args.p_category_id}::uuid,${args.p_from}::date,${args.p_to}::date,${args.p_price}::numeric,${args.p_currency},${tx.json(args.p_expected)}) AS result`;
      else throw new Error('Unsupported fixture RPC');
      return rows[0].result;
    });
    const quote=async ({property,category=null,from,to,total},actor=ids.owner)=>{
      const overrides=await rpc('get_property_calendar_prices',{p_property_id:property,p_category_id:category,p_from:from,p_to:to},actor);
      const seasons=await sql`SELECT start_date::text,end_date::text,nightly_rate::float8,is_active FROM property_rate_seasons WHERE property_id=${property} AND category_id IS NOT DISTINCT FROM ${category}::uuid`;
      if(category){
        const [cat]=await sql`SELECT id,base_price_per_night::float8,min_stay_nights,max_guests,is_active FROM property_room_categories WHERE id=${category} AND property_id=${property}`;
        const [plan]=await sql`SELECT * FROM property_rate_plans WHERE category_id=${category}`;
        return quoteHotelStay({category:cat,plan:plan?{...plan,adjustment_value:Number(plan.adjustment_value)}:null,seasons,restrictions:mergeRestrictions(overrides.map(r=>({...r,category_id:category}))),check_in:from,check_out:to,guests:2,today:'2026-10-01'});
      }
      const [p]=await sql`SELECT *,price_per_night::float8,price::float8,extra_cleaning_price::float8 FROM properties WHERE id=${property}`;
      return quotePropertyStay({...p,weekly_discount:null,monthly_discount:null,early_booking_discount:null,last_minute_discount:null,custom_length_discounts:null},
        {check_in:from,check_out:to,nights:(Date.parse(to)-Date.parse(from))/86400000,guests:2,total_amount:total,cleaning_fee:0,today:'2026-10-01',seasons,dateOverrides:Object.fromEntries(overrides.filter(r=>r.price_override!=null).map(r=>[r.date,r.price_override]))});
    };
    const state=async()=>({prices:await sql`SELECT property_id,date::text,price_override::float8,status,booking_id,min_nights_override FROM property_availability ORDER BY property_id,date`,restrictions:await sql`SELECT property_id,category_id,date::text,price_override::float8,stop_sell,min_stay_nights,closed_to_arrival,closed_to_departure FROM property_stay_restrictions ORDER BY category_id,date`,audit:await sql`SELECT * FROM property_activity_log`});
    const server=createServer(async(req,res)=>{
      const send=(code,value)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
      try {
        if(req.method==='POST'&&['/rpc','/quote','/control'].includes(req.url)){
          let raw=''; for await(const chunk of req){raw+=chunk;if(raw.length>20000)throw new Error('Fixture body too large');}
          const body=JSON.parse(raw); const actor=req.headers['x-fixture-actor']==='foreign'?ids.foreign:ids.owner;
          if(req.url==='/control'){failNext=body.failNext===true;return send(200,{ok:true});}
          if(req.url==='/quote'){calls.push({name:'quote',args:body,actor});return send(200,await quote(body,actor));}
          calls.push({name:body.name,args:body.args,actor});
          if(body.name==='set_property_calendar_price'&&failNext){failNext=false;return send(503,{data:null,error:{code:'fixture_unavailable',message:'Synthetic save failure'}});}
          return send(200,{data:await rpc(body.name,body.args,actor),error:null});
        }
        if(req.method==='GET'&&req.url==='/state')return send(200,await state());
        const pathname=new URL(req.url,'http://127.0.0.1').pathname;
        const file=pathname==='/fixture.js'?'fixture.js':pathname==='/fixture.css'?'fixture.css':'index.html';
        res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html'});res.end(await readFile(path.join(output,file)));
      }catch(e){send(e.code==='42501'?403:409,{data:null,error:{code:e.code||'fixture_error',message:e.message}});}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    return {url:`http://127.0.0.1:${server.address().port}`,rpc,quote,state,calls,sql,database,close:async()=>{await new Promise(resolve=>server.close(resolve));await sql.end();await admin.unsafe(`DROP DATABASE ${database}`);await admin.end();}};
  }catch(e){await sql.end();await admin.unsafe(`DROP DATABASE ${database}`);await admin.end();throw e;}
}
