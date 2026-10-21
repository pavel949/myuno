import { describe, expect, it, vi } from 'vitest';
import { vendorOutreachEligible } from '../../../supabase/functions/_shared/vendor-outreach-eligibility';
import type { createServiceClient } from '../../../supabase/functions/_shared/supabase';

function fixture(contact: unknown = {outreach_status:'contacted',email:'vendor@example.test',phone:'+66000'}, suppression: unknown = {data:null,error:null}, error: unknown = null) {
 const filters: unknown[][]=[];
 const chain={select:vi.fn().mockReturnThis(),eq:vi.fn((...args:unknown[])=>{filters.push(args);return chain;}),maybeSingle:vi.fn().mockResolvedValue({data:contact,error})};
 const blocked={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue(suppression)};
 const client={from:vi.fn((table:string)=>table==='crm_contacts'?chain:blocked)};
 return {client:client as unknown as ReturnType<typeof createServiceClient>,from:client.from,filters,blocked};
}
describe('vendor outreach current-state gate (no delivery/network)',()=>{
 it.each(['opted_out','responded','unsubscribed','converted','unknown',null])('halts non-sendable status %s',async status=>{
  const f=fixture({outreach_status:status,email:'vendor@example.test'});
  expect(await vendorOutreachEligible(f.client,'contact','house','email','vendor@example.test')).toBe(false);
  expect(f.blocked.maybeSingle).not.toHaveBeenCalled();
 });
 it.each([{data:{email:'vendor@example.test'},error:null},{data:null,error:new Error('unavailable')},{data:undefined,error:null}])('denies suppression or unknown evidence %#',async evidence=>{
  const f=fixture(undefined,evidence);
  expect(await vendorOutreachEligible(f.client,'contact','house','email','vendor@example.test')).toBe(false);
 });
 it('allows explicit absence of suppression with canonical company/type/id filters',async()=>{
  const f=fixture();
  expect(await vendorOutreachEligible(f.client,'contact','house','email','VENDOR@example.test')).toBe(true);
  expect(f.filters).toEqual([['id','contact'],['company_id','house'],['contact_type','vendor']]);
  expect(f.blocked.eq).toHaveBeenCalledWith('email','vendor@example.test');
 });
 it('denies changed delivery address rather than sending to stale recipient',async()=>{
  const f=fixture();
  expect(await vendorOutreachEligible(f.client,'contact','house','email','old@example.test')).toBe(false);
  expect(await vendorOutreachEligible(f.client,'contact','house','whatsapp','+other')).toBe(false);
 });
 it('allows current phone without querying email suppression',async()=>{
  const f=fixture();
  expect(await vendorOutreachEligible(f.client,'contact','house','whatsapp','+66000')).toBe(true);
  expect(f.blocked.maybeSingle).not.toHaveBeenCalled();
 });
 it.each([null,{}])('denies missing current contact %#',async row=>{
  const f=fixture(row);
  expect(await vendorOutreachEligible(f.client,'contact','house','email','vendor@example.test')).toBe(false);
 });
 it('denies lookup failure and missing scope before access',async()=>{
  const f=fixture(null,null,new Error('offline'));
  expect(await vendorOutreachEligible(f.client,'contact','house','email','vendor@example.test')).toBe(false);
  const g=fixture();
  expect(await vendorOutreachEligible(g.client,'contact','','email','vendor@example.test')).toBe(false);
  expect(g.from).not.toHaveBeenCalled();
 });
});

// Exercise the actual sender loop without loading Deno.serve or transport SDKs.
// Only the function declaration is compiled; every outbound dependency is a spy.
import fs from 'node:fs';
import ts from 'typescript';
const senderSource=fs.readFileSync('supabase/functions/vendor-outreach-agent/index.ts','utf8');
const ast=ts.createSourceFile('sender.ts',senderSource,ts.ScriptTarget.Latest,true);
const sender=ast.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='processOutreach');
if(!sender) throw new Error('Canonical sender loop missing');
const loopJs=ts.transpile((sender as ts.FunctionDeclaration).getText(ast),{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
const createLoop=(generate:unknown,send:unknown,eligible:unknown=vendorOutreachEligible)=>new Function('vendorOutreachEligible','generatePersonalizedMessage','sendWhatsApp','sendEmail','FOLLOW_UP_DELAYS_DAYS',`${loopJs}; return processOutreach;`)(eligible,generate,send,send,[3,7,14]);
it.each(['opted_out','responded','unsubscribed'])('actual sender skips %s before generation, sends or mutation',async status=>{
 const f=fixture({outreach_status:status,email:'vendor@example.test',phone:null});
 const generate=vi.fn(); const send=vi.fn();
 const run=createLoop(generate,send);
 expect(await run(f.client,[{id:'contact',email:'vendor@example.test',phone:null}],2,'house')).toEqual([]);
 expect(generate).not.toHaveBeenCalled();expect(send).not.toHaveBeenCalled();
 expect(f.from.mock.calls.map(c=>c[0])).toEqual(['crm_contacts']);
});
it('actual sender does not generate or send when suppression lookup fails',async()=>{
 const f=fixture(undefined,{data:null,error:new Error('offline')});
 const generate=vi.fn(); const send=vi.fn();
 expect(await createLoop(generate,send)(f.client,[{id:'contact',email:'vendor@example.test',phone:null}],2,'house')).toEqual([]);
 expect(generate).not.toHaveBeenCalled();expect(send).not.toHaveBeenCalled();
});
it('actual sender rechecks after slow generation and halts changed eligibility before delivery or mutation',async()=>{
 const f=fixture();
 const eligible=vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
 const generate=vi.fn().mockResolvedValue({body:'Synthetic message, never sent'});const send=vi.fn();
 expect(await createLoop(generate,send,eligible)(f.client,[{id:'contact',email:'vendor@example.test',phone:null}],2,'house')).toEqual([]);
 expect(eligible).toHaveBeenCalledTimes(2);expect(generate).toHaveBeenCalledOnce();
 expect(send).not.toHaveBeenCalled();expect(f.from).not.toHaveBeenCalled();
});
