import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stageImport, mapPriceRows, refreshFailure, stageLegacyProjects, undoBatch } from './offplan-staging.mjs';
const source = { sourceId: 'synthetic-source', developerId: 'd', projectId: 'p', fileId: 'file', revision: 'v1', effectiveDate: '2026-10-24', parserVersion: 'test-v1', coverage: 'complete', type: 'price_availability', publicationRights: 'approved', modifiedAt: '2026-10-25T01:00:00Z' };
const current = [{ id: 'catalogue-row-uuid', propertyId: 'canonical-property-uuid', propertyProjectId: 'p', projectId: 'p', unitCode: 'A-1', amount: 10000000, currency: 'THB', priceUnit: 'total', availability: 'available', version: 4 }];
const rows = [{ ...current[0], amount: 11000000, availability: 'reserved' }];
test('stages exact physical match with before-image, provenance and no publication', () => { const b = stageImport({ source, rows, current }); assert.equal(b.changes.length, 1); assert.equal(b.changes[0].after.id, 'catalogue-row-uuid'); assert.equal(b.changes[0].sourceEffectiveDate, source.effectiveDate); assert.equal(b.publicationEnabled, false); assert.equal(b.changes[0].before.amount, 10000000); });
test('deduplicates repeated revision/hash', () => { const b = stageImport({ source, rows, current }); assert.equal(stageImport({ source, rows, current, previousBatch: b }).status, 'duplicate'); });
test('missing rows never imply sold or deletion', () => { const b = stageImport({ source, rows: [], current }); assert.equal(b.changes.length, 0); assert.deepEqual(b.missing, ['catalogue-row-uuid']); });
test('quarantines uncertain units, currency, units and large changes', () => { for (const patch of [{ unitCode: 'other' }, { amount: 1 }, { currency: 'USD' }, { priceUnit: 'million' }, { availability: 'nonsense' }]) { const b = stageImport({ source, rows: [{ ...rows[0], ...patch }], current }); assert.equal(b.changes.length, 0); assert.equal(b.review.length, 1); } });
test('duplicate codes never create automatic changes', () => { const b = stageImport({ source, rows: [rows[0], rows[0]], current }); assert.equal(b.changes.length, 0); assert.equal(b.review.length, 2); });
test('technical folder access does not grant publication', () => { const b = stageImport({ source: { ...source, publicationRights: 'pending' }, rows, current }); assert.equal(b.changes.length, 0); assert.ok(b.errors.includes('publication_rights_pending')); });
test('parse failure preserves last-good and records stale health', () => { assert.throws(() => stageImport({ source, rows: null })); const f = refreshFailure(current, 'parse failed'); assert.equal(f.lastGood, current); assert.equal(f.health, 'stale'); assert.deepEqual(f.changes, []); });
test('undo produces version-checked before-image plan and blocks concurrent edits', () => { const b = stageImport({ source, rows, current }); assert.equal(undoBatch(b, [{ ...b.changes[0].after, version: 5 }])[0].restore.amount, 10000000); assert.throws(() => undoBatch(b, [{ ...b.changes[0].after, version: 6 }])); assert.throws(() => undoBatch(b, [{ ...b.changes[0].after, amount: 12000000, version: 5 }])); });
test('legacy pN=10.1 is quarantined, raw p.src retained', () => { const [r] = stageLegacyProjects([{ id: 'legacy', n: 'Synthetic', pN: 10.1, pT: '฿10.1M', src: 'source' }]); assert.ok(r.reasons.includes('unverified_price_unit')); assert.equal(r.raw.pN, 10.1); assert.equal(r.source, 'source'); assert.equal(r.publicationEnabled, false); });

test('unconfirmed source expiry, future dates and unknown coverage require review', () => { for (const patch of [{validUntil:'2026-02-28'}, {effectiveDate:'2099-01-01'}, {coverage:'unknown'}]) { const b=stageImport({source:{...source,...patch},rows,current}); assert.equal(b.changes.length,0); assert.equal(b.status,'review'); } });
test('mapping preserves leading zeroes and scales only explicit reviewed units', () => { const mapping={version:'v1',projectId:'p',unitCodeColumn:'code',amountColumn:'price',statusColumn:'state',priceScale:'million',priceUnit:'total',currency:'THB',statusMap:{'Open':'available'}}; const [row]=mapPriceRows([{code:'020701',price:3.102,state:'Open'}],mapping); assert.equal(row.unitCode,'020701'); assert.equal(row.amount,3102000); assert.throws(()=>mapPriceRows([], {...mapping,priceScale:undefined})); });
test('ambiguous existing key and numeric unit code require review', () => { assert.equal(stageImport({source,rows,current:[...current,...current]}).changes.length,0); assert.equal(stageImport({source,rows:[{...rows[0],unitCode:20701}],current}).changes.length,0); });

test('owner confirmation permits base prices in old partial working sources, never expired promotions', () => { const working={...source,effectiveDate:'2026-02-02',validUntil:'2026-02-28',promoValidUntil:'2026-02-28',ownerConfirmedCurrentAt:'2026-10-25',ownerConfirmationProvenance:'owner message 2026-10-25 03:10 UTC',coverage:'partial'}; assert.equal(stageImport({source:working,rows:[{...rows[0],priceKind:'base'}],current}).changes.length,1); for(const priceKind of ['promotion','promotional_total']) { const b=stageImport({source:working,rows:[{...rows[0],priceKind}],current});assert.equal(b.changes.length,0);assert.equal(b.review.length,1); } });
test('Telegram message identity is accepted without inventing a Drive file ID',()=>{const telegram={...source,fileId:undefined,messageId:'synthetic-channel:42',provider:'telegram'};assert.equal(stageImport({source:telegram,rows,current}).changes.length,1);});

test('owner confirmation is distinct from an unknown effective date',()=>{const confirmed={...source,effectiveDate:null,ownerConfirmedCurrentAt:'2026-10-25',ownerConfirmationProvenance:'owner message'};const b=stageImport({source:confirmed,rows,current});assert.equal(b.changes.length,1);assert.equal(b.effectiveDate,null);assert.equal(stageImport({source:{...confirmed,ownerConfirmationProvenance:null},rows,current}).changes.length,0);});

test('same canonical physical UUID survives offplan, resale, rental and management with repeat import dedup',()=>{
  const property={id:'canonical-property-uuid',complexId:'canonical-complex-uuid'};
  const assets=new Map([[property.id,property]]);
  const buildingContainment={property_id:property.id,building_property_id:'existing-building-property-uuid'}; const documents=[{property_id:property.id,document_id:'existing-document'}]; const history=[{property_id:property.id,event_id:'historical-offer-event'}];
  const booking={property_id:property.id}; const managementTerms={property_id:property.id}; const ownership={property_id:property.id};
  let inventory=[{...current[0],propertyId:property.id}];
  for(const [index,lifecycle] of ['offplan','completed','resale','rental','PMS'].entries()){
    const input=[{...rows[0],amount:11000000+index*100000,propertyId:'spoofed-replacement',id:'do-not-create-asset'}];
    const batch=stageImport({source:{...source,revision:lifecycle},rows:input,current:inventory});
    assert.equal(batch.changes.length,1);
    const change=batch.changes[0];assert.equal(change.after.propertyId,property.id);assert.equal(change.after.id,current[0].id);
    inventory=[{...inventory[0],...change.after,version:inventory[0].version+1}];
    const replay=stageImport({source:{...source,revision:lifecycle},rows:input,current:inventory});assert.equal(replay.changes.length,0);
    for(const relation of [booking,managementTerms,ownership,buildingContainment,...documents,...history])assert.equal(relation.property_id,property.id);
    assert.equal(buildingContainment.building_property_id,'existing-building-property-uuid');assert.equal(documents.length,1);assert.equal(history[0].event_id,'historical-offer-event');assert.equal(assets.size,1);assert.equal(assets.get(property.id).complexId,'canonical-complex-uuid');
  }
});
test('unlinked project catalogue rows cannot become a second physical registry',()=>{const batch=stageImport({source,rows,current:[{...current[0],propertyId:null}]});assert.equal(batch.changes.length,0);assert.ok(batch.review[0].reasons.includes('unmapped_canonical_property'));});

test('conflicting canonical project link cannot be silently overwritten',()=>{const b=stageImport({source,rows,current:[{...current[0],propertyProjectId:'another-project'}]});assert.equal(b.changes.length,0);assert.ok(b.review[0].reasons.includes('canonical_project_mismatch'));});
