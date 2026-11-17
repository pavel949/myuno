import {describe,expect,it,vi} from 'vitest';
import {runPropertyInquiryWorker,type InquiryWorkerDependencies} from '../../../docs/launch/pilot/propertyInquiryWorker';
const id='00000000-0000-4000-8000-000000000001';
function setup(){return {claim:vi.fn().mockResolvedValue({id,request_id:id,admitted_actor_id:id,claim_token:id,destination:'admin@example.test',source:'property_inquiries',channel:'email'}),enqueueFenced:vi.fn().mockResolvedValue({data:{outcome:'queued'},error:null}),complete:vi.fn().mockResolvedValue(true)} satisfies InquiryWorkerDependencies;}
describe('fenced review-only worker',()=>{
 it('passes only event identity plus live claim token, never recipient/content to enqueue',async()=>{const d=setup();expect(await runPropertyInquiryWorker(d)).toBe('queued');expect(d.enqueueFenced).toHaveBeenCalledExactlyOnceWith({dispatchId:id,claimToken:id});expect(d.complete).not.toHaveBeenCalled();});
 it('does nothing without a claim',async()=>{const d=setup();d.claim.mockResolvedValue(null);expect(await runPropertyInquiryWorker(d)).toBe('idle');expect(d.enqueueFenced).not.toHaveBeenCalled();});
 it.each(['suppressed','uncertain'])('respects authoritative %s outcome',async outcome=>{const d=setup();d.enqueueFenced.mockResolvedValue({data:{outcome},error:null});expect(await runPropertyInquiryWorker(d)).toBe(outcome);});
 it('only trusts retryable failure after authoritative transactional rollback',async()=>{const d=setup();d.enqueueFenced.mockResolvedValue({data:{outcome:'failed',retry_safe:true},error:null});expect(await runPropertyInquiryWorker(d)).toBe('failed');});
 it.each([null,{}, {outcome:'failed'},{outcome:'delivered'},{success:true,queued:true}])('unknown/unfenced response %j remains uncertain',async data=>{const d=setup();d.enqueueFenced.mockResolvedValue({data,error:null});expect(await runPropertyInquiryWorker(d)).toBe('uncertain');expect(d.complete).toHaveBeenCalledWith(id,id,'uncertain');});
 it('transport failure cannot automatically retry a possibly committed queue transaction',async()=>{const d=setup();d.enqueueFenced.mockRejectedValue(new Error('timeout'));d.complete.mockResolvedValue(false);expect(await runPropertyInquiryWorker(d)).toBe('uncertain');});
});
