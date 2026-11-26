import {describe,expect,it} from 'vitest';
import {resolveSalesUnitStatus,summarizeSalesUnitStatus} from './unitStatus';
describe('sales unit state across old and current readers',()=>{
  it.each(['sold','reserved','soft_hold','spa_signed','blocked','not_for_sale','unknown'])('does not turn %s into available because of a legacy default',unit_status=>{
    expect(resolveSalesUnitStatus({status:'available',unit_status})).toBe(unit_status);
    expect(summarizeSalesUnitStatus({status:'available',unit_status})).not.toBe('available');
  });
  it('does not infer availability from missing or unrecognised state',()=>{
    expect(resolveSalesUnitStatus({status:null,unit_status:null})).toBe('unknown');
    expect(resolveSalesUnitStatus({status:'available',unit_status:'future_state'})).toBe('unknown');
  });
  it('supports recorded legacy holds and recorded legacy availability',()=>{
    expect(resolveSalesUnitStatus({status:'held'})).toBe('soft_hold');
    expect(resolveSalesUnitStatus({status:'available'})).toBe('available');
  });
  it('uses honest public labels for holds and unsellable units',()=>{
    expect(summarizeSalesUnitStatus({unit_status:'soft_hold'})).toBe('holding');
    expect(summarizeSalesUnitStatus({unit_status:'blocked'})).toBe('unavailable');
    expect(summarizeSalesUnitStatus({unit_status:'not_for_sale'})).toBe('unavailable');
  });
});
