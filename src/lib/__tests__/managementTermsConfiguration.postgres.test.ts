import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, chmodSync, chownSync, realpathSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const manager=id(1),foreign=id(2),property=id(3),legacy=id(4);
let baseline: unknown;
let directory: string; let sql: ReturnType<typeof postgres>; let started = false;
const asRoot = process.getuid?.() === 0;
const owner = asRoot ? 'nobody' : process.env.USER ?? '';
const pgRoot = dirname(dirname(realpathSync(execFileSync('which', ['postgres'], { encoding: 'utf8' }).trim())));
const libPath = existsSync(join(pgRoot, 'lib', 'dict_snowball.so')) ? join(pgRoot, 'lib') : null;
function run(bin: string, args: string[]) {
  const exe = existsSync(join(pgRoot, 'bin', bin)) ? join(pgRoot, 'bin', bin) : bin;
  return asRoot ? execFileSync('runuser', ['-u', owner, '--', exe, ...args], { encoding: 'utf8' }) : execFileSync(exe, args, { encoding: 'utf8' });
}
async function as<T>(user: string | null, fn: (tx: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe(`SET LOCAL ROLE ${user ? 'authenticated' : 'anon'}`);
    await tx`SELECT set_config('request.jwt.claim.sub', ${user ?? ''}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

// Captured canonical column/default contract with synthetic manager-only RLS.
// Assertions verify migration invariants, not hosted production policy parity.
const expenseKeys=['cleaning','electricity','water','internet','repairs_minor','repairs_major','cam_fees','insurance','marketing'];
const completeExpenses=Object.fromEntries(expenseKeys.map(key=>[key,'owner']));
const policyCatalog=()=>sql`SELECT c.relname,c.relrowsecurity,c.relacl::text,
 (SELECT jsonb_agg(jsonb_build_object('policyname',p.policyname,'cmd',p.cmd,'roles',p.roles,'qual',p.qual,'with_check',p.with_check) ORDER BY p.policyname) FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=c.relname) policies
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN ('property_management_terms','property_payout_rules') ORDER BY c.relname`;

beforeAll(async()=>{
 directory=mkdtempSync(join(tmpdir(),'myuno-terms-config-'));chmodSync(directory,0o700);if(asRoot)chownSync(directory,65534,65534);
 run('initdb',['-D',join(directory,'data'),'-A','trust','--no-locale',...(libPath?['-c',`dynamic_library_path=${libPath}`]:[])]);
 run('pg_ctl',['-D',join(directory,'data'),'-l',join(directory,'pg.log'),'-o',`-k ${directory} -p 55448 -c listen_addresses='' -c jit=off${libPath?` -c dynamic_library_path=${libPath}`:''}`,'-w','start']);started=true;
 sql=postgres({host:directory,port:55448,database:'postgres',username:owner,password:'',max:2,onnotice:()=>{}});
 await sql.unsafe(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
 CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth,public TO authenticated,anon; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon;
 CREATE TABLE properties(id uuid PRIMARY KEY,owner_id uuid NOT NULL);
 CREATE TABLE property_management_terms(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES properties(id),manager_user_id uuid NOT NULL,
  commission_rate numeric,commission_type text NOT NULL DEFAULT 'percent',commission_amount numeric,commission_base text NOT NULL DEFAULT 'gross',
  revenue_split_owner numeric,revenue_split_manager numeric,expense_responsibility jsonb NOT NULL DEFAULT '{}',payment_day integer,
  payment_currency text NOT NULL DEFAULT 'THB',valid_from date,valid_until date,notes text,owner_notification_defaults jsonb DEFAULT '{"monthly_report":true,"booking_created":true,"income_recorded":true,"expense_recorded":true,"inspection_completed":true,"service_request_created":true}',status text NOT NULL DEFAULT 'draft');
 CREATE TABLE property_payout_rules(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),property_id uuid NOT NULL REFERENCES properties(id),management_terms_id uuid REFERENCES property_management_terms(id),
  recipient_type text NOT NULL DEFAULT 'coagent',recipient_staff_id uuid,recipient_name text,
  commission_type text NOT NULL DEFAULT 'percent_net',commission_value numeric NOT NULL DEFAULT 0,
  deduct_before_owner boolean NOT NULL DEFAULT false,min_payout numeric,payout_frequency text NOT NULL DEFAULT 'monthly',notes text,is_active boolean NOT NULL DEFAULT true);
 GRANT SELECT ON properties TO authenticated;
 GRANT SELECT,INSERT,UPDATE,DELETE ON property_management_terms,property_payout_rules TO authenticated;
 ALTER TABLE property_management_terms ENABLE ROW LEVEL SECURITY;ALTER TABLE property_payout_rules ENABLE ROW LEVEL SECURITY;
 CREATE POLICY fixture_manager ON property_management_terms FOR ALL TO authenticated USING(manager_user_id=auth.uid()) WITH CHECK(manager_user_id=auth.uid());
 CREATE POLICY fixture_owner ON property_payout_rules FOR ALL TO authenticated USING(EXISTS(SELECT 1 FROM properties p WHERE p.id=property_id AND p.owner_id=auth.uid())) WITH CHECK(EXISTS(SELECT 1 FROM properties p WHERE p.id=property_id AND p.owner_id=auth.uid()));`);
 await sql`INSERT INTO properties VALUES (${property},${manager})`;
 await sql`INSERT INTO property_management_terms(id,property_id,manager_user_id,status,notes) VALUES (${legacy},${property},${manager},'active','Legacy incomplete')`;
 baseline=await policyCatalog();
 await sql.unsafe(readFileSync('drizzle/migrations/0038_management_terms_configuration.sql','utf8'));
},60000);
afterAll(async()=>{if(sql)await sql.end();if(started)run('pg_ctl',['-D',join(directory,'data'),'-m','immediate','stop']);if(directory)rmSync(directory,{recursive:true,force:true});});

type Input={status?:string;type?:string;rate?:string|null;amount?:string|null;expenses?:unknown;policy?:unknown;day?:number|null;from?:string|null;until?:string|null;ownerSplit?:string|null;managerSplit?:string|null;base?:string};
async function insert(input:Input={}){
 return as(manager,async tx=>(await tx`INSERT INTO property_management_terms(property_id,manager_user_id,status,commission_type,commission_base,commission_rate,commission_amount,expense_responsibility,accounting_policy,payment_day,valid_from,valid_until,revenue_split_owner,revenue_split_manager)
 VALUES (${property},${manager},${input.status??'draft'},${input.type??'percent'},${input.base??'gross'},${input.rate??null}::numeric,${input.amount??null}::numeric,
 ${tx.json((input.expenses??{}) as never)},${input.policy===undefined?null:tx.json(input.policy as never)},${input.day??null},${input.from??null}::date,${input.until??null}::date,${input.ownerSplit??null}::numeric,${input.managerSplit??null}::numeric) RETURNING *`)[0]);
}

describe('canonical management terms configuration, isolated PostgreSQL',()=>{
 it('retains table ACLs, row security and policy expressions exactly',async()=>{
  expect(await policyCatalog()).toEqual(baseline);
  await expect(as(foreign,tx=>tx`INSERT INTO property_management_terms(property_id,manager_user_id) VALUES (${property},${manager})`)).rejects.toThrow(/row-level security/);
 });
 it('saves unconfigured draft without invented commission, expense or accounting values',async()=>{
  const row=await insert();
  expect(row.status).toBe('draft');expect(row.commission_rate).toBeNull();expect(row.commission_amount).toBeNull();
  expect(row.expense_responsibility).toEqual({});expect(row.accounting_policy).toBeNull();expect(row.payment_day).toBeNull();expect(row.owner_notification_defaults).toBeNull();
 });
 it('preserves empty policy and partial options without filling defaults',async()=>{
  expect((await insert({policy:{}})).accounting_policy).toEqual({});
  const policy={report_frequency:'on_demand',tax_withholding_percent:null};
  expect((await insert({policy})).accounting_policy).toEqual(policy);
 });
 it('preserves explicit zero commission and numeric policy zero',async()=>{
  const row=await insert({rate:'0',policy:{minimum_payout:0,payout_hold_days:0,owner_approval_required_above:0,tax_withholding_percent:0}});
  expect(Number(row.commission_rate)).toBe(0);expect(row.accounting_policy.minimum_payout).toBe(0);
 });
 it.each(['active','pending_approval'])('rejects incomplete %s insert and status-only activation',async status=>{
  await expect(insert({status,expenses:completeExpenses})).rejects.toThrow(/commission must be configured/);
  await expect(insert({status,rate:'0'})).rejects.toThrow(/expense responsibilities/);
  const draft=await insert({rate:'0'});
  await expect(as(manager,tx=>tx`UPDATE property_management_terms SET status=${status} WHERE id=${draft.id}`)).rejects.toThrow(/expense responsibilities/);
  expect((await as(manager,tx=>tx`SELECT status FROM property_management_terms WHERE id=${draft.id}`))[0].status).toBe('draft');
 });
 it('validates persisted complete configuration during status-only activation',async()=>{
  const draft=await insert({rate:'0',expenses:completeExpenses});
  await as(manager,tx=>tx`UPDATE property_management_terms SET status='active' WHERE id=${draft.id}`);
  const row=(await as(manager,tx=>tx`SELECT status,commission_rate FROM property_management_terms WHERE id=${draft.id}`))[0];
  expect(row.status).toBe('active');expect(Number(row.commission_rate)).toBe(0);
 });
 it('accepts explicit fixed money above 100 without treating it as percentage',async()=>{
  const row=await insert({status:'active',type:'fixed',amount:'12500',expenses:completeExpenses});expect(Number(row.commission_amount)).toBe(12500);
 });
 it.each(['-1','101','NaN','Infinity','-Infinity'])('rejects invalid commission percentage %s',async rate=>{
  await expect(insert({rate})).rejects.toThrow();
 });
 it('rejects nonfinite or negative fixed amounts and invalid revenue percentages',async()=>{
  for(const amount of ['-1','NaN','Infinity','-Infinity'])await expect(insert({type:'fixed',amount})).rejects.toThrow();
  await expect(insert({ownerSplit:'101'})).rejects.toThrow(/percentage/);await expect(insert({managerSplit:'-1'})).rejects.toThrow(/non-negative/);
 });
 it('rejects unsupported commission type/base/status instead of bypassing activation',async()=>{
  await expect(insert({status:'active',type:'unknown',expenses:completeExpenses})).rejects.toThrow();
  await expect(insert({base:'invented'})).rejects.toThrow();await expect(insert({status:'invented'})).rejects.toThrow();
 });
 it('rejects invalid payout day and reversed validity, permits equal date endpoints',async()=>{
  for(const day of [0,32,-1])await expect(insert({day})).rejects.toThrow(/payout day/);
  await expect(insert({from:'2026-11-02',until:'2026-11-01'})).rejects.toThrow(/validity period/);
  expect((await insert({day:31,from:'2026-11-01',until:'2026-11-01'})).payment_day).toBe(31);
 });
 it('rejects nonobject expenses, unknown categories and invalid responsibility types',async()=>{
  for(const expenses of [[],{unknown:'owner'},{cleaning:'everyone'},{water:3}])await expect(insert({expenses})).rejects.toThrow();
 });
 it('rejects accounting JSON shape, option types and numeric bounds',async()=>{
  for(const policy of [[],{unknown:true},{report_frequency:'weekly'},{report_format:4},{report_language:'not_a_language'},{include_pending_bookings:'yes'},{net_profit_deductions:'cleaning'},{net_profit_deductions:['unknown']},{minimum_payout:-1},{payout_hold_days:1.5},{payout_hold_days:9007199254740992},{tax_withholding_percent:101},{owner_approval_required_above:'0'}])await expect(insert({policy})).rejects.toThrow();
 });
 it('allows notes-only legacy active edits but validates actual configuration changes',async()=>{
  await as(manager,tx=>tx`UPDATE property_management_terms SET notes='Legacy notes changed' WHERE id=${legacy}`);
  expect((await as(manager,tx=>tx`SELECT notes FROM property_management_terms WHERE id=${legacy}`))[0].notes).toBe('Legacy notes changed');
  await expect(as(manager,tx=>tx`UPDATE property_management_terms SET commission_rate=0 WHERE id=${legacy}`)).rejects.toThrow(/expense responsibilities/);
 });
 it('requires explicit payout value after removing misleading database zero default',async()=>{
  const attr=(await sql`SELECT pg_get_expr(d.adbin,d.adrelid) default_value FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid='public.property_payout_rules'::regclass AND a.attname='commission_value'`)[0];expect(attr.default_value).toBeNull();
  await expect(as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id) VALUES (${property})`)).rejects.toThrow();
  await expect(as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_value) VALUES (${property},NULL)`)).rejects.toThrow();
  await expect(as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_value) VALUES (${property},''::numeric)`)).rejects.toThrow();
  const zero=await as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_value) VALUES (${property},0) RETURNING commission_value`);expect(Number(zero[0].commission_value)).toBe(0);
 });
 it('validates payout type-only edits using stored amount and retains fixed money',async()=>{
  const fixed=(await as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_type,commission_value) VALUES (${property},'fixed',12500) RETURNING id`))[0];
  await expect(as(manager,tx=>tx`UPDATE property_payout_rules SET commission_type='percent_net' WHERE id=${fixed.id}`)).rejects.toThrow();
  for(const value of ['-1','101','NaN','Infinity'])await expect(as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_type,commission_value) VALUES (${property},'percent_gross',${value}::numeric)`)).rejects.toThrow();
  await expect(as(manager,tx=>tx`INSERT INTO property_payout_rules(property_id,commission_type,commission_value) VALUES (${property},'invented',0)`)).rejects.toThrow();
 });
 it('rollback retains configuration and validation with unchanged ACL/policies',async()=>{
  const row=await insert({policy:{report_frequency:'quarterly'}});
  await sql.unsafe(readFileSync('docs/hardening/rollback/0038_management_terms_configuration.sql','utf8'));
  expect((await as(manager,tx=>tx`SELECT accounting_policy FROM property_management_terms WHERE id=${row.id}`))[0].accounting_policy).toEqual({report_frequency:'quarterly'});
  await expect(insert({rate:'101'})).rejects.toThrow();expect(await policyCatalog()).toEqual(baseline);
 });
});


