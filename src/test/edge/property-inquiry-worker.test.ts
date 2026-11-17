import { describe, expect, it, vi } from 'vitest';
import { runPropertyInquiryWorker, type InquiryWorkerDependencies, type PersistedInquiry } from '../../../docs/launch/pilot/propertyInquiryWorker';
const id='00000000-0000-4000-8000-000000000001';
const inquiry: PersistedInquiry={id,property_id:id,user_id:id,status:'pending',name:'Stored guest',email:'guest@example.test',phone:'synthetic',message:'Stored message',check_in:'2026-12-01',check_out:'2026-12-03',guests:2};
function setup() {
  return {
    claim:vi.fn().mockResolvedValue({id,request_id:id,admitted_actor_id:id,claim_token:id,destination:'admin@example.test',source:'property_inquiries',channel:'email'}),
    loadInquiry:vi.fn().mockResolvedValue(inquiry),readAdminEmails:vi.fn().mockResolvedValue(['admin@example.test']),
    enqueueTransactionalEmail:vi.fn().mockResolvedValue({data:{success:true,queued:true},error:null}),complete:vi.fn().mockResolvedValue(true),
  } satisfies InquiryWorkerDependencies;
}
describe('review-only persisted inquiry worker',()=>{
  it('uses only persisted record, protected admin recipient, exact ID and stable event key',async()=>{
    const d=setup();expect(await runPropertyInquiryWorker(d)).toBe('queued');
    expect(d.loadInquiry).toHaveBeenCalledWith(id);
    expect(d.enqueueTransactionalEmail).toHaveBeenCalledWith({templateName:'property-inquiry-admin',recipientEmail:'admin@example.test',idempotencyKey:`myuno-property-inquiry-email:${id}`,templateData:{inquiry,adminUrl:`https://myuno.app/admin/inbox?source=property_inquiries&request=${id}`}});
    expect(d.complete).toHaveBeenCalledWith(id,id,'queued');
  });
  it('does nothing without a claim',async()=>{const d=setup();d.claim.mockResolvedValue(null);expect(await runPropertyInquiryWorker(d)).toBe('idle');expect(d.enqueueTransactionalEmail).not.toHaveBeenCalled();});
  it.each([null,{...inquiry,id:'other'},{...inquiry,status:'cancelled'},{...inquiry,property_id:'bad'},{...inquiry,user_id:'00000000-0000-4000-8000-000000000002'}])('suppresses missing/changed source %j',async record=>{const d=setup();d.loadInquiry.mockResolvedValue(record);expect(await runPropertyInquiryWorker(d)).toBe('suppressed');expect(d.enqueueTransactionalEmail).not.toHaveBeenCalled();});
  it('rechecks admin removal and never substitutes a vendor or fallback recipient',async()=>{const d=setup();d.readAdminEmails.mockResolvedValue(['replacement@example.test']);expect(await runPropertyInquiryWorker(d)).toBe('suppressed');expect(d.enqueueTransactionalEmail).not.toHaveBeenCalled();});
  it.each([null,[],{},['bad'],['admin@example.test',123]])('invalid config is retryable only before enqueue %j',async config=>{const d=setup();d.readAdminEmails.mockResolvedValue(config);expect(await runPropertyInquiryWorker(d)).toBe('failed');expect(d.enqueueTransactionalEmail).not.toHaveBeenCalled();});
  it('a pre-send read failure is safe to retry',async()=>{const d=setup();d.loadInquiry.mockRejectedValue(new Error('read'));expect(await runPropertyInquiryWorker(d)).toBe('failed');expect(d.enqueueTransactionalEmail).not.toHaveBeenCalled();});
  it.each([{data:null,error:null},{data:{success:true},error:null},{data:{success:false},error:null},{data:{success:true,queued:true},error:new Error('network')}])('ambiguous acknowledgments never become retryable failures %j',async result=>{const d=setup();d.enqueueTransactionalEmail.mockResolvedValue(result);expect(await runPropertyInquiryWorker(d)).toBe('uncertain');});
  it('a lost network response is uncertain, never safe automatic retry',async()=>{const d=setup();d.enqueueTransactionalEmail.mockRejectedValue(new Error('timeout'));expect(await runPropertyInquiryWorker(d)).toBe('uncertain');});
  it('respects sender suppression without claiming queue/delivery',async()=>{const d=setup();d.enqueueTransactionalEmail.mockResolvedValue({data:{success:false,reason:'email_suppressed'},error:null});expect(await runPropertyInquiryWorker(d)).toBe('suppressed');});
  it('a lost completion lease is uncertain even after queue acceptance',async()=>{const d=setup();d.complete.mockResolvedValue(false);expect(await runPropertyInquiryWorker(d)).toBe('uncertain');});
});
