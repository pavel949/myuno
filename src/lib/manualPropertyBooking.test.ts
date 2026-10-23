import { webcrypto } from 'node:crypto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ManualBookingRequestIdentity, createManualBooking, executePropertyBookingChange } from './manualPropertyBooking';
const input = { property_id: 'home', check_in: '2030-01-10', check_out: '2030-01-12', guest_name: 'Private guest', total_amount: 0 };
const orderId = '00000000-0000-4000-8000-000000000010';
const version = '2030-01-01T00:00:00.000Z';
const reply = (id = orderId, status = 'confirmed') => ({ success: true, replayed: false, order: { id, status, start_at: '2030-01-10T07:00:00Z', end_at: '2030-01-12T05:00:00Z', updated_at: version }, order_items: [{ item_type: 'property', resource_id: 'home' }], order_participants: [{ role: 'guest', name: 'Private guest', phone: null, email: null }] });
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); localStorage.clear(); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('durable property command identity', () => {
  it('retains unknown outcome across new instances and reordered input, without plaintext guest data', async () => {
    const id = await new ManualBookingRequestIdentity().forIntent('actor', input);
    const next = await new ManualBookingRequestIdentity().forIntent('actor', { total_amount: 0, guest_name: input.guest_name, check_out: input.check_out, check_in: input.check_in, property_id: 'home' });
    expect(next).toBe(id);
    expect(JSON.stringify(localStorage)).not.toContain('Private guest');
    expect(JSON.stringify(localStorage)).not.toContain(input.check_in);
  });
  it('scopes actor and intent independently and preserves another unresolved intent', async () => {
    const identity = new ManualBookingRequestIdentity();
    const a = await identity.forIntent('a', input);
    const b = await identity.forIntent('b', input);
    const other = await identity.forIntent('a', { ...input, notes: 'different' });
    expect(new Set([a,b,other]).size).toBe(3);
    identity.acknowledge(other);
    expect(await new ManualBookingRequestIdentity().forIntent('a', input)).toBe(a);
  });
  it('same-tab simultaneous same-intent calls retain one request', async () => {
    const ids = await Promise.all(Array.from({length:4}, () => new ManualBookingRequestIdentity().forIntent('actor', input)));
    expect(new Set(ids).size).toBe(1);
  });
  it.each(['getItem', 'setItem'] as const)('fails closed when durable %s is unavailable', async method => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('storage denied'); });
    await expect(new ManualBookingRequestIdentity().forIntent('actor', input)).rejects.toThrow('storage denied');
  });
  it('fails closed when storage silently discards writes', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    await expect(new ManualBookingRequestIdentity().forIntent('actor', input)).rejects.toThrow('could not be retained');
  });
  it('does not replace corrupt retained request data', async () => {
    await new ManualBookingRequestIdentity().forIntent('actor', input);
    const key = localStorage.key(0)!;
    localStorage.setItem(key, '{}');
    await expect(new ManualBookingRequestIdentity().forIntent('actor', input)).rejects.toThrow('Stored booking request is invalid');
    expect(localStorage.getItem(key)).toBe('{}');
  });
  it('cleanup failure does not turn acknowledged creation into a new request', async () => {
    const identity = new ManualBookingRequestIdentity(); const id = await identity.forIntent('actor', input);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('cleanup unavailable'); });
    expect(() => identity.acknowledge(id)).not.toThrow();
    expect(await new ManualBookingRequestIdentity().forIntent('actor', input)).toBe(id);
  });
});
describe('checked booking command acknowledgements', () => {
  it.each(['pending','confirmed','cancelled'])('creation replay accepts the current persisted %s status of the same order', async status => {
    const rpc = vi.fn().mockResolvedValue({data:{...reply(orderId,status),replayed:true},error:null});
    expect(await createManualBooking({rpc}, orderId, input)).toMatchObject({replayed:true,order:{id:orderId,status}});
    expect(rpc).toHaveBeenCalledExactlyOnceWith('create_manual_property_booking',{p_request_id:orderId,p_property_id:'home',p_input:{check_in:input.check_in,check_out:input.check_out,guest_name:input.guest_name,total_amount:0}});
  });
  it.each([null, {success:true}, {...reply(),order:{...reply().order,id:'foreign'}}, {...reply(),order_items:[]}, {...reply(),order_participants:[]}, {...reply(),order:{...reply().order,status:'paid'}}])('rejects incomplete or misleading reply %j', async data => {
    await expect(createManualBooking({rpc:vi.fn().mockResolvedValue({data,error:null})},orderId,input)).rejects.toThrow('acknowledgement is incomplete');
  });
  it('retains original request and revision after a lost response and a later status change', async () => {
    const rpc = vi.fn().mockResolvedValueOnce({data:reply(),error:null}).mockRejectedValueOnce(new Error('lost response'));
    await expect(executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'})).rejects.toThrow('lost response');
    const command = rpc.mock.calls[1][1];
    const refreshed = await import('./manualPropertyBooking');
    rpc.mockResolvedValue({data:{...reply(orderId,'cancelled'),replayed:true},error:null});
    await expect(refreshed.executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'},'2030-02-01T00:00:00Z')).resolves.toMatchObject({order:{status:'cancelled'},replayed:true});
    expect(rpc.mock.calls[2]).toEqual(['change_property_booking',command]);
    expect(localStorage.length).toBe(0);
  });
  it('uses provided CAS version without read and singleflights simultaneous same-order changes', async () => {
    const rpc = vi.fn().mockResolvedValue({data:reply(),error:null});
    await Promise.all([executePropertyBookingChange({rpc},'actor',orderId,{status:'confirmed'},version), executePropertyBookingChange({rpc},'actor',orderId,{status:'confirmed'},version)]);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[0][1]).toMatchObject({p_order_id:orderId,p_expected_updated_at:version,p_patch:{status:'confirmed'}});
  });
  it('does not submit a transition if checked read or storage fails', async () => {
    const rpc = vi.fn().mockResolvedValue({data:null,error:new Error('not authorized')});
    await expect(executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'})).rejects.toThrow('not authorized');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('read_property_reservation_checked',{p_order_id:orderId});
    rpc.mockClear();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('storage denied');});
    await expect(executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'},version)).rejects.toThrow('storage denied');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('a definitive stale rejection is reconciled with a fresh version and a new explicit intent',async()=>{
    const rpc=vi.fn().mockResolvedValueOnce({data:null,error:{code:'40001',message:'stale_reservation'}});
    await expect(executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'},version)).rejects.toMatchObject({message:'stale_reservation'});
    const rejected=rpc.mock.calls[0][1];expect(localStorage.length).toBe(0);
    rpc.mockResolvedValue({data:reply(orderId,'cancelled'),error:null});
    await executePropertyBookingChange({rpc},'actor',orderId,{status:'cancelled'},'2030-02-01T00:00:00Z');
    expect(rpc.mock.calls[1][1].p_request_id).not.toBe(rejected.p_request_id);expect(rpc.mock.calls[1][1].p_expected_updated_at).toBe('2030-02-01T00:00:00Z');
  });

});
