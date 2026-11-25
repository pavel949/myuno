// Real local Supabase HTTP acceptance; intentionally refuses any non-disposable target.
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const statusFile = process.env.MYUNO_LOCAL_STATUS;
if (process.env.GITHUB_ACTIONS !== "true" || process.env.MYUNO_DISPOSABLE_STORAGE !== "yes" || !statusFile ||
    !process.env.RUNNER_TEMP || !realpathSync(statusFile).startsWith(realpathSync(process.env.RUNNER_TEMP)+"/")) {
  throw new Error("Refused: only a fresh CI-local Supabase stack is allowed");
}
const s = JSON.parse(readFileSync(statusFile,"utf8"));
const api = new URL(s.API_URL), db = new URL(s.DB_URL);
assert(api.protocol === "http:" && ["127.0.0.1","localhost"].includes(api.hostname) && api.port === "54321" && !api.username && !api.password);
assert(["postgresql:","postgres:"].includes(db.protocol) && ["127.0.0.1","localhost"].includes(db.hostname) && db.port === "54322" && db.pathname === "/postgres");
assert(typeof s.ANON_KEY === "string" && typeof s.SERVICE_ROLE_KEY === "string");
const anon = s.ANON_KEY, service = s.SERVICE_ROLE_KEY;
const buckets = [
  ["bouquet-images","Public read bouquet-images (no list)"],["company-assets","Public read company-assets (no list)"],
  ["company-logos","Public read company-logos (no list)"],["complex-media","complex_media_public_read"],
  ["experience-images","Public read experience-images (no list)"],["magnet-landings","Public read magnet-landings"],
  ["project-images","Public read project-images (no list)"],["property-care","Public read property-care (no list)"],
  ["property-images","Public read property-images (no list)"],["property-videos","property-videos public read"],
  ["tour-media","Public read tour-media (no list)"],["vendor-uploads","Public read vendor-uploads (no list)"],
  ["yacht-images","Public read yacht-images (no list)"],
];
function sql(input) {
  const r=spawnSync("psql",["-X","-q","-t","-A","-v","ON_ERROR_STOP=1","-d",db.href],
    {input,encoding:"utf8",timeout:30000,env:{...process.env,PGSSLMODE:"disable"}});
  if(r.status!==0) throw new Error("Isolated SQL failed: "+(r.stderr||r.error?.message||"unknown").slice(0,2000));
  return r.stdout.trim();
}
assert.equal(sql("SELECT CASE WHEN current_database()='postgres' AND to_regclass('public.user_roles') IS NULL AND to_regclass('public.ai_intake_sessions') IS NULL AND NOT EXISTS(SELECT 1 FROM storage.buckets) THEN 'fresh' ELSE 'refused' END;"),"fresh");
let count=0;
async function call(path,{method="GET",token=anon,body,headers={},publicRequest=false}={}) {
  const url=new URL(path,api);
  assert(url.origin===api.origin);
  const h={...headers};
  if(!publicRequest){h.apikey=token===service?service:anon;h.Authorization="Bearer "+token;}
  let payload=body;
  if(body!==undefined&&typeof body!=="string"&&!(body instanceof Uint8Array)){h["Content-Type"]="application/json";payload=JSON.stringify(body);}
  return fetch(url,{method,headers:h,body:payload,redirect:"error",signal:AbortSignal.timeout(15000)});
}
async function ok(label,promise) {
  const r=await promise; assert(r.ok,label+" HTTP "+r.status);count++;return r;
}
async function denied(label,promise) {
  const r=await promise;assert(!r.ok,label+" unexpectedly succeeded HTTP "+r.status);count++;return r;
}
async function user(role){
  const email="qa-"+randomUUID()+"@example.com", password="Synthetic!"+randomUUID();
  const created=await ok("create synthetic user",call("/auth/v1/admin/users",{method:"POST",token:service,body:{email,password,email_confirm:true}}));
  const account=await created.json();
  const u=await ok("sign in synthetic user",call("/auth/v1/token?grant_type=password",{method:"POST",body:{email,password}}));
  const session=await u.json();
  assert.match(account.id,/^[a-f0-9-]{36}$/);assert.equal(session.user.id,account.id);
  return {id:account.id,token:session.access_token,role};
}
const a=await user("admin"),b=await user("admin"),c=await user("user"),staff=await user("uno_team"),provider=await user("user");
const company=randomUUID();
sql("CREATE TYPE public.app_role AS ENUM ('admin','uno_team','user'); CREATE TABLE public.user_roles(user_id uuid NOT NULL,role public.app_role NOT NULL);"+
    "ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY; "+
    "CREATE FUNCTION public.has_role(uuid,public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=$1 AND role=$2) $$;"+
    "REVOKE ALL ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO authenticated,service_role;"+
    "CREATE TABLE public.ai_intake_sessions(id uuid PRIMARY KEY,admin_id uuid NOT NULL); ALTER TABLE public.ai_intake_sessions ENABLE ROW LEVEL SECURITY; "+
    "GRANT SELECT,INSERT,UPDATE,DELETE ON public.ai_intake_sessions TO authenticated; CREATE POLICY synthetic_sessions ON public.ai_intake_sessions FOR ALL TO authenticated USING(true) WITH CHECK(true);"+
    "CREATE TABLE public.synthetic_company_members(company_id uuid,user_id uuid); "+
    "GRANT SELECT ON public.synthetic_company_members TO authenticated; "+
    "INSERT INTO public.synthetic_company_members VALUES('"+company+"','"+c.id+"'),('"+company+"','"+provider.id+"');"+
    "INSERT INTO public.user_roles VALUES "+[a,b,c,staff,provider].map(u=>"('"+u.id+"','"+u.role+"')").join(",")+";");
for(const [bucket,policy] of buckets){
  await ok("create "+bucket,call("/storage/v1/bucket",{method:"POST",token:service,body:{id:bucket,name:bucket,public:true}}));
  if(bucket!=="property-care")sql('CREATE POLICY "'+policy+'" ON storage.objects FOR SELECT USING(bucket_id='+"'"+bucket+"');");
}
await ok("create intake public fixture",call("/storage/v1/bucket",{method:"POST",token:service,body:{id:"intake-uploads",name:"intake-uploads",public:true}}));
await ok("create unrelated private fixture",call("/storage/v1/bucket",{method:"POST",token:service,body:{id:"unrelated-private",name:"unrelated-private",public:false}}));
sql("CREATE POLICY synthetic_broad_read ON storage.objects FOR SELECT TO public USING(true);"+
  "CREATE POLICY synthetic_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK((storage.foldername(name))[1]=auth.uid()::text OR (bucket_id='company-assets' AND EXISTS(SELECT 1 FROM public.synthetic_company_members m WHERE m.company_id::text=(storage.foldername(name))[1] AND m.user_id=auth.uid())));"+
  "CREATE POLICY synthetic_update ON storage.objects FOR UPDATE TO authenticated USING(owner_id=auth.uid()::text OR (bucket_id='company-assets' AND EXISTS(SELECT 1 FROM public.synthetic_company_members m WHERE m.company_id::text=(storage.foldername(name))[1] AND m.user_id=auth.uid()))) WITH CHECK(owner_id=auth.uid()::text OR (bucket_id='company-assets' AND EXISTS(SELECT 1 FROM public.synthetic_company_members m WHERE m.company_id::text=(storage.foldername(name))[1] AND m.user_id=auth.uid())));"+
  "CREATE POLICY synthetic_delete ON storage.objects FOR DELETE TO authenticated USING(owner_id=auth.uid()::text);");
const storage="/storage/v1";
function upload(bucket,key,token,content="synthetic original",upsert=false){
  return call(storage+"/object/"+bucket+"/"+key,{method:"POST",token,body:content,headers:{"Content-Type":"text/plain","x-upsert":String(upsert)}});
}
function pub(bucket,key,method="GET"){
  return call(storage+"/object/public/"+bucket+"/"+key,{method,publicRequest:true});
}
function authenticated(bucket,key,token,method="GET"){
  return call(storage+"/object/authenticated/"+bucket+"/"+key,{method,token});
}
async function list(bucket,prefix,token) {
  const r=await ok("list "+bucket,call(storage+"/object/list/"+bucket,{method:"POST",token,body:{prefix,limit:100,offset:0,sortBy:{column:"name",order:"asc"}}}));
  const rows=await r.json();assert(Array.isArray(rows));return rows;
}
for(const [bucket] of buckets) {
  await ok("seed owner "+bucket,upload(bucket,c.id+"/own.txt",c.token));
  await ok("seed other "+bucket,upload(bucket,provider.id+"/other.txt",provider.token));
  await ok("seed ownerless "+bucket,upload(bucket,"legacy/ownerless.txt",service));
}
const legacy="intake/legacy.txt";
await ok("seed historical public intake",upload("intake-uploads",legacy,service,"synthetic legacy"));
await ok("historical intake is public before cutover",pub("intake-uploads",legacy));
await ok("seed unaffected private bucket",upload("unrelated-private",c.id+"/own.txt",c.token));
sql(readFileSync(resolve(here,"../../../drizzle/migrations/0044_restrict_public_bucket_listing.sql"),"utf8"));
for(const [bucket] of buckets) {
  assert.equal((await list(bucket,c.id,anon)).length,0,"anon listing "+bucket);
  assert.equal((await list(bucket,c.id,staff.token)).length,0,"staff listing "+bucket);
  assert.equal((await list(bucket,c.id,provider.token)).length,0,"foreign listing "+bucket);
  assert((await list(bucket,c.id,c.token)).some(x=>x.name==="own.txt"),"owner listing "+bucket);
  assert((await list(bucket,"legacy",a.token)).some(x=>x.name==="ownerless.txt"),"admin legacy listing "+bucket);
  assert.equal(await (await ok("public GET ownerless "+bucket,pub(bucket,"legacy/ownerless.txt"))).text(),"synthetic original");
  await ok("public HEAD "+bucket,pub(bucket,c.id+"/own.txt","HEAD"));
  await ok("owner upsert "+bucket,upload(bucket,c.id+"/own.txt",c.token,"synthetic revised",true));
  await denied("foreign upsert "+bucket,upload(bucket,c.id+"/own.txt",provider.token,"denied",true));
  assert.equal(await (await ok("public unchanged "+bucket,pub(bucket,c.id+"/own.txt"))).text(),"synthetic revised");
  const key=c.id+"/fresh.txt";
  await ok("fresh owner upload "+bucket,upload(bucket,key,c.token));
  await ok("owner delete "+bucket,call(storage+"/object/"+bucket,{method:"DELETE",token:c.token,body:{prefixes:[key]}}));
  await denied("deleted object unavailable "+bucket,pub(bucket,key));
}
const shared=company+"/mc-logos/first.txt";
await ok("company member fresh upload",upload("company-assets",shared,c.token));
await denied("second member cannot replace first object",upload("company-assets",shared,provider.token,"denied",true));
await ok("second member new key",upload("company-assets",company+"/mc-logos/second.txt",provider.token));
assert((await list("unrelated-private",c.id,c.token)).some(x=>x.name==="own.txt"),"unrelated bucket unchanged");
sql(readFileSync(join(here,"intake-cutover-hold.STAGED-NOT-IN-JOURNAL.sql"),"utf8"));
const own=a.id+"/"+randomUUID()+".txt",foreign=b.id+"/"+randomUUID()+".txt";
await denied("hold blocks upload",upload("intake-uploads",own,a.token));
await ok("local Storage API private flip",call(storage+"/bucket/intake-uploads",{method:"PUT",token:service,body:{public:false}}));
sql(readFileSync(join(here,"intake-private.STAGED-NOT-IN-JOURNAL.sql"),"utf8"));
sql('DROP POLICY "myuno intake cutover hold insert" ON storage.objects; DROP POLICY "myuno intake cutover hold update" ON storage.objects; DROP POLICY "myuno intake cutover hold delete" ON storage.objects;');
await denied("old public URL denied",pub("intake-uploads",legacy));
await denied("old public HEAD denied",pub("intake-uploads",legacy,"HEAD"));
await ok("admin private new upload",upload("intake-uploads",own,a.token));
await denied("private public URL denied",pub("intake-uploads",own));
await denied("private public HEAD denied",pub("intake-uploads",own,"HEAD"));
await denied("other admin download denied",authenticated("intake-uploads",own,b.token));
await denied("nonadmin download denied",authenticated("intake-uploads",own,c.token));
await denied("anon authenticated route denied",authenticated("intake-uploads",own,anon));
assert.equal(await (await ok("own private download",authenticated("intake-uploads",own,a.token))).text(),"synthetic original");
await ok("service role legacy read",authenticated("intake-uploads",legacy,service));
await denied("cross actor prefix",upload("intake-uploads",foreign,a.token));
await denied("ordinary actor private upload",upload("intake-uploads",c.id+"/"+randomUUID()+".txt",c.token));
await denied("legacy upload path",upload("intake-uploads","intake/old.txt",a.token));
await denied("unsupported executable suffix",upload("intake-uploads",a.id+"/"+randomUUID()+".exe",a.token));
await denied("own immutable private upsert",upload("intake-uploads",own,a.token,"denied",true));
assert.equal((await list("intake-uploads",a.id,b.token)).length,0);
assert((await list("intake-uploads",a.id,a.token)).length===1);
await denied("other admin cannot sign",call(storage+"/object/sign/intake-uploads/"+own,{method:"POST",token:b.token,body:{expiresIn:30}}));
const signed=await (await ok("owner can sign",call(storage+"/object/sign/intake-uploads/"+own,{method:"POST",token:a.token,body:{expiresIn:30}}))).json();
assert(typeof signed.signedURL==="string"&&signed.signedURL.startsWith("/object/sign/"));
await ok("signed synthetic GET",call(storage+signed.signedURL,{publicRequest:true}));
await denied("private move forbidden",call(storage+"/object/move",{method:"POST",token:a.token,body:{bucketId:"intake-uploads",sourceKey:own,destinationKey:a.id+"/"+randomUUID()+".txt"}}));
await ok("owner private remove",call(storage+"/object/intake-uploads",{method:"DELETE",token:a.token,body:{prefixes:[own]}}));
await denied("private removed",authenticated("intake-uploads",own,a.token));
console.log("Real local Storage HTTP assertions: "+count+" HTTP outcomes plus content/list checks; synthetic fixture only.");
