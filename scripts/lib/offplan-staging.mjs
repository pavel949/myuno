import { createHash } from 'node:crypto';
export const SOURCE_TYPES = ['price_availability', 'media', 'floorplans', 'brochure', 'construction_update'];
export function validateSource(source) {
  const errors = [];
  for (const key of ['sourceId', 'developerId', 'projectId', 'fileId', 'revision', 'effectiveDate', 'parserVersion']) if (!source?.[key]) errors.push(`missing_${key}`);
  if (!SOURCE_TYPES.includes(source?.type)) errors.push('invalid_type');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source?.effectiveDate || '') || !Number.isFinite(Date.parse(source.effectiveDate))) errors.push('invalid_effective_date');
  if (source?.publicationRights !== 'approved') errors.push('publication_rights_pending');
  return errors;
}
const canonical = value => JSON.stringify(value, Object.keys(value).sort());
export function stageImport({ source, rows, current = [], previousBatch, now = new Date().toISOString() }) {
  // Adapter boundary: download/parser errors must not be converted into an empty inventory.
  if (!Array.isArray(rows)) throw new Error('Parser must return rows; retain last-known-good');
  const hash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  const batchKey = `${source?.sourceId}:${source?.fileId}:${source?.revision}:${hash}`;
  const errors = validateSource(source);
  if (source?.validUntil && source.validUntil < now.slice(0, 10)) errors.push('expired_source');
  if (source?.effectiveDate > now.slice(0, 10)) errors.push('future_effective_date');
  if (source?.coverage !== 'complete') errors.push('partial_or_unknown_coverage');
  const result = { batchKey, hash, source, importedAt: now, effectiveDate: source?.effectiveDate, status: errors.length ? 'review' : 'staged', errors, changes: [], review: [], missing: [], lastKnownGoodRetained: true, publicationEnabled: false };
  if (previousBatch?.batchKey === batchKey) return { ...result, status: 'duplicate' };
  const existing = new Map(current.map(row => [`${row.projectId}:${row.unitCode}`, row]));
  const codes = new Set();
  const duplicateCodes = new Set();
  for (const row of rows) { const code = `${row.projectId}:${row.unitCode}`; if (codes.has(code)) duplicateCodes.add(code); codes.add(code); }
  for (const row of rows) {
    const key = `${row.projectId}:${row.unitCode}`;
    const reasons = [...errors];
    if (typeof row.unitCode !== 'string' || !row.unitCode || row.unitCode !== row.unitCode.trim() || row.projectId !== source.projectId) reasons.push('unmatched_unit');
    if (duplicateCodes.has(key)) reasons.push('duplicate_unit_code');
    if (!Number.isFinite(row.amount) || row.amount <= 0 || !['THB', 'USD', 'EUR'].includes(row.currency) || row.priceUnit !== 'total') reasons.push('invalid_price_units');
    if (!['available', 'reserved', 'sold', 'unavailable', 'unknown'].includes(row.availability)) reasons.push('unknown_availability');
    const before = existing.get(key);
    // Automatic updates only match known stable physical identities. New inventory needs review.
    if (!before?.id) reasons.push('new_or_unmatched_unit');
    if (current.filter(candidate => `${candidate.projectId}:${candidate.unitCode}` === key).length > 1) reasons.push('ambiguous_existing_unit');
    if (before && before.currency !== row.currency) reasons.push('currency_changed');
    if (before?.amount > 0 && Math.abs(row.amount / before.amount - 1) > 0.25) reasons.push('large_price_change');
    const after = { id: before?.id, projectId: row.projectId, unitCode: row.unitCode, amount: row.amount, currency: row.currency, priceUnit: row.priceUnit, availability: row.availability };
    if (reasons.length) { result.review.push({ key, reasons: [...new Set(reasons)], row }); continue; }
    const beforeComparable = Object.fromEntries(Object.keys(after).map(k => [k, before[k]]));
    if (canonical(after) !== canonical(beforeComparable)) result.changes.push({ key, before, after, expectedVersion: before.version, sourceEffectiveDate: source.effectiveDate });
  }
  result.missing = current.filter(row => row.projectId === source.projectId && !codes.has(`${row.projectId}:${row.unitCode}`)).map(row => row.id);
  if (result.review.length) result.status = 'review';
  return result;
}
export function undoBatch(batch, current) {
  // Offline rollback plan only. Concurrent edits block undo, including replays.
  return batch.changes.map(change => {
    const row = current.find(r => r.id === change.after.id);
    if (!row || row.version !== change.expectedVersion + 1) throw new Error(`Concurrent version or missing unit: ${change.key}`);
    for (const key of Object.keys(change.after)) if (row[key] !== change.after[key]) throw new Error(`Concurrent content: ${change.key}`);
    return { id: row.id, expectedVersion: row.version, restore: change.before };
  });
}
export function refreshFailure(lastGood, error, now = new Date().toISOString()) {
  return { lastGood, health: 'stale', checkedAt: now, error: String(error), changes: [] };
}

export function stageLegacyProjects(rows) {
  if (!Array.isArray(rows)) throw new Error('Expected project array');
  const seen = new Set();
  return rows.map(row => {
    const reasons = [];
    if (!row.id || seen.has(row.id)) reasons.push('missing_or_duplicate_stable_key');
    seen.add(row.id);
    if (!row.n) reasons.push('missing_name');
    if (!row.src) reasons.push('missing_source');
    // pN and pT have no authoritative unit contract: do not infer 10.1M from display text.
    if (row.pN != null || row.pT != null) reasons.push('unverified_price_unit');
    return { stableKey: row.id, source: row.src ?? null, raw: row, status: 'review', reasons: [...new Set([...reasons, 'publication_rights_pending'])], publicationEnabled: false };
  });
}

/** Parser adapter contract. Mapping must be reviewed/versioned for each source. */
export function mapPriceRows(records, mapping) {
  if (!Array.isArray(records) || !mapping?.version || !['base', 'million'].includes(mapping.priceScale)) throw new Error('Unverified parser mapping');
  return records.map(record => ({
    projectId: mapping.projectId,
    unitCode: record[mapping.unitCodeColumn], // Deliberately never Number(): leading zeroes are identity.
    amount: typeof record[mapping.amountColumn] === 'number' ? record[mapping.amountColumn] * (mapping.priceScale === 'million' ? 1000000 : 1) : null,
    currency: mapping.currency,
    priceUnit: mapping.priceUnit,
    availability: mapping.statusMap?.[record[mapping.statusColumn]] ?? 'unknown',
  }));
}
