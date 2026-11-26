/** Canonical recorded sales state; legacy defaults must never override a richer state. */
export type SalesUnitStatus = 'available'|'soft_hold'|'reserved'|'spa_signed'|'sold'|'blocked'|'not_for_sale'|'unknown';
const known = new Set<string>(['available','soft_hold','reserved','spa_signed','sold','blocked','not_for_sale','unknown']);
export function resolveSalesUnitStatus(row:{unit_status?:string|null;status?:string|null}):SalesUnitStatus {
  const recorded=row.unit_status ?? row.status;
  if(recorded==='held'||recorded==='holding')return 'soft_hold';
  return recorded&&known.has(recorded)?recorded as SalesUnitStatus:'unknown';
}
export function summarizeSalesUnitStatus(row:{unit_status?:string|null;status?:string|null}):'available'|'reserved'|'sold'|'holding'|'unavailable'|'unknown' {
  const state=resolveSalesUnitStatus(row);
  if(state==='soft_hold')return 'holding';
  if(state==='spa_signed')return 'reserved';
  if(state==='blocked'||state==='not_for_sale')return 'unavailable';
  return state;
}
