import { createHash } from 'node:crypto';
export const SOURCE_TYPES = ['price_availability', 'media', 'floorplans', 'brochure', 'construction_update'];
/** Exact reviewed format only; invalid/ambiguous cells never become dates by guessing. */
export function normalizeSourceDate(raw, format = 'YYYY-MM-DD') {
  if (raw === null || raw === undefined || raw === '') return { value: null, status: 'missing' };
  if (typeof raw !== 'string') return { value: null, status: 'invalid' };
  const value = raw.trim();
  const parts = format === 'YYYY-MM-DD' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!parts || !['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'].includes(format)) return { value: null, status: 'invalid' };
  const [year, month, day] = format === 'YYYY-MM-DD' ? [parts[1], parts[2], parts[3]] : format === 'DD/MM/YYYY' ? [parts[3], parts[2], parts[1]] : [parts[3], parts[1], parts[2]];
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return { value: null, status: 'invalid' };
  return { value: iso, status: 'valid' };
}

export function validateSource(source) {
  const errors = [];
  for (const key of ['sourceId', 'developerId', 'projectId', 'revision', 'parserVersion']) if (!source?.[key]) errors.push(`missing_${key}`);
  if (!source?.fileId && !source?.messageId && !source?.url) errors.push('missing_resource_identity');
  if (!SOURCE_TYPES.includes(source?.type)) errors.push('invalid_type');
  if (source?.effectiveDate) {
    if (normalizeSourceDate(source.effectiveDate).status !== 'valid') errors.push('invalid_effective_date');
  } else if (!source?.ownerConfirmedCurrentAt || !source?.ownerConfirmationProvenance) errors.push('effective_date_or_owner_confirmation_required');
  if (source?.publicationRights !== 'approved') errors.push('publication_rights_pending');
  return errors;
}
const canonical = value => JSON.stringify(value, Object.keys(value).sort());
const stableJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? '[' + value.map(stableJson).join(',') + ']' : '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
export function stageImport({ source, rows, current = [], previousBatch, now = new Date().toISOString() }) {
  // Adapter boundary: download/parser errors must not be converted into an empty inventory.
  if (!Array.isArray(rows)) throw new Error('Parser must return rows; retain last-known-good');
  const hash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
  const batchKey = `${source?.sourceId}:${source?.fileId || source?.messageId || source?.url}:${source?.revision}:${hash}`;
  const errors = validateSource(source);
  const ownerConfirmed = !!source?.ownerConfirmedCurrentAt && !!source?.ownerConfirmationProvenance;
  if (source?.validUntil && !ownerConfirmed) {
    const validity = normalizeSourceDate(source.validUntil);
    if (validity.status !== 'valid') errors.push('invalid_source_validity');
    else if (validity.value < now.slice(0, 10)) errors.push('expired_source');
  }
  if (source?.effectiveDate > now.slice(0, 10)) errors.push('future_effective_date');
  if (!['complete', 'partial'].includes(source?.coverage)) errors.push('unknown_coverage');
  const validationFingerprint = createHash('sha256').update(stableJson({ source, current, validationDate: now.slice(0, 10) })).digest('hex');
  const result = { batchKey, hash, validationFingerprint, source, importedAt: now, effectiveDate: source?.effectiveDate, status: errors.length ? 'review' : 'staged', errors, changes: [], review: [], missing: [], lastKnownGoodRetained: true, publicationEnabled: false };
  // Quarantined/failed/staged plans are always re-evaluated. Only a confirmed applied
  // receipt with identical validation context can be terminally deduplicated.
  if (!errors.length && previousBatch?.status === 'applied' && typeof previousBatch.appliedReceipt === 'string' && previousBatch.appliedReceipt.trim() && previousBatch.batchKey === batchKey && previousBatch.validationFingerprint === validationFingerprint) return { ...result, status: 'duplicate' };
  const existing = new Map(current.map(row => [`${row.projectId}:${row.unitCode}`, row]));
  const codes = new Set();
  const duplicateCodes = new Set();
  for (const row of rows) { const code = `${row.projectId}:${row.unitCode}`; if (codes.has(code)) duplicateCodes.add(code); codes.add(code); }
  for (const row of rows) {
    const key = `${row.projectId}:${row.unitCode}`;
    const reasons = [...errors];
    if (!['base', 'promotion', 'promotional_total'].includes(row.priceKind)) reasons.push('unknown_price_kind');
    if (row.priceKind === 'promotional_total') reasons.push('base_price_unseparated');
    if (row.priceKind === 'promotion') {
      const validity = normalizeSourceDate(row.promoValidUntil ?? source?.promoValidUntil ?? source?.validUntil);
      if (row.promoValidity === 'invalid' || validity.status === 'invalid') reasons.push('invalid_promotion_validity');
      else if (validity.status === 'missing') reasons.push('promotion_validity_unknown');
      else if (validity.value < now.slice(0, 10)) reasons.push('expired_promotion');
    }
    if (typeof row.unitCode !== 'string' || !row.unitCode || row.unitCode !== row.unitCode.trim() || row.projectId !== source.projectId) reasons.push('unmatched_unit');
    if (duplicateCodes.has(key)) reasons.push('duplicate_unit_code');
    if (!Number.isFinite(row.amount) || row.amount <= 0 || !['THB', 'USD', 'EUR'].includes(row.currency) || row.priceUnit !== 'total') reasons.push('invalid_price_units');
    if (!['available', 'reserved', 'sold', 'unavailable', 'unknown'].includes(row.availability)) reasons.push('unknown_availability');
    const before = existing.get(key);
    // Automatic updates only match known stable physical identities. New inventory needs review.
    if (!before?.id) reasons.push('new_or_unmatched_unit');
    if (!before?.propertyId) reasons.push('unmapped_canonical_property');
    if (before?.propertyId && before.propertyProjectId !== row.projectId) reasons.push('canonical_project_mismatch');
    if (current.filter(candidate => `${candidate.projectId}:${candidate.unitCode}` === key).length > 1) reasons.push('ambiguous_existing_unit');
    if (before && before.currency !== row.currency) reasons.push('currency_changed');
    if (before?.amount > 0 && Math.abs(row.amount / before.amount - 1) > 0.25) reasons.push('large_price_change');
    const after = { id: before?.id, propertyId: before?.propertyId, propertyProjectId: before?.propertyProjectId, projectId: row.projectId, unitCode: row.unitCode, amount: row.amount, currency: row.currency, priceUnit: row.priceUnit, availability: row.availability };
    if (reasons.length) { result.review.push({ key, reasons: [...new Set(reasons)], row }); continue; }
    const beforeComparable = Object.fromEntries(Object.keys(after).map(k => [k, before[k]]));
    if (canonical(after) !== canonical(beforeComparable)) result.changes.push({ key, before, after, expectedVersion: before.version, sourceEffectiveDate: source.effectiveDate, priceKind: row.priceKind, priceProvenance: row.priceProvenance || null });
  }
  result.missing = current.filter(row => row.projectId === source.projectId && !codes.has(`${row.projectId}:${row.unitCode}`)).map(row => row.id);
  if (result.review.length) result.status = 'review';
  return result;
}
/** Private preview only. The existing physical sales bridge supplies the identity, never the source file. */
export function stagePurchaseOfferPreview({ source, rows, canonicalUnits = [], currentOffers = [], now = new Date().toISOString() }) {
  if (!Array.isArray(rows) || !Array.isArray(canonicalUnits) || !Array.isArray(currentOffers) ||
      !rows.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
    throw new Error('Purchase offer preview requires parsed rows and canonical identity arrays');
  }
  const validInstant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === (value.length === 20 ? value.slice(0, -1) + '.000Z' : value);
  if (!validInstant(now)) throw new Error('Invalid preview date');
  const bangkok = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' });
  const dateParts = Object.fromEntries(bangkok.formatToParts(new Date(now)).map(part => [part.type, part.value]));
  const day = [dateParts.year, dateParts.month, dateParts.day].join('-');
  const errors = validateSource(source);
  if (!source?.effectiveDate && source?.ownerConfirmedCurrentAt &&
      (!validInstant(source.ownerConfirmedCurrentAt) || Date.parse(source.ownerConfirmedCurrentAt) > Date.parse(now))) {
    errors.push('invalid_owner_confirmation_date');
  }
  if (source?.type !== 'price_availability') errors.push('invalid_offer_source_type');
  if (!['partial', 'complete'].includes(source?.coverage)) errors.push('unknown_coverage');
  if (source?.effectiveDate && source.effectiveDate > day) errors.push('future_effective_date');
  if (source?.validUntil != null) {
    const date = normalizeSourceDate(source.validUntil);
    if (date.status !== 'valid') errors.push('invalid_source_validity');
    else if (date.value < day) errors.push('expired_source');
  }
  if (!rows.length) errors.push('empty_source_requires_review');
  const keyOf = (...parts) => JSON.stringify(parts);
  const validKey = value => typeof value === 'string' && value.length > 0 && value.trim() === value;
  const grouped = (list, getKey) => {
    const index = new Map();
    for (const entry of list) {
      const key = getKey(entry);
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(entry);
    }
    return index;
  };
  const unitKey = u => keyOf(u.projectId, u.unitCode);
  const variantKey = o => keyOf(o.projectId, o.unitCode, o.ownership, o.offerKey);
  const baselineKey = o => keyOf(o.propertyId, o.ownership, o.offerKey);
  const byUnit = grouped(canonicalUnits, unitKey);
  const byPhysicalId = grouped(canonicalUnits, u => u.propertyId);
  const quotes = grouped(currentOffers, baselineKey);
  const importsByUnit = grouped(rows, unitKey);
  const importsByVariant = grouped(rows, variantKey);
  const preview = { format: 'purchase-offer-preview-v1', checkedAt: now, errors, proposals: [], review: [], missing: [],
    publicationEnabled: false, lastKnownGoodRetained: true };
  const seen = new Set();
  for (const row of rows) {
    const reasons = [...errors];
    const code = unitKey(row);
    const matches = byUnit.get(code) ?? [];
    const unit = matches[0];
    if (!validKey(row.unitCode) || row.projectId !== source?.projectId) reasons.push('unmatched_unit');
    if (matches.length !== 1 || !validKey(unit?.propertyId) || !validKey(unit?.id) || unit.propertyProjectId !== row.projectId ||
        (byPhysicalId.get(unit?.propertyId)?.length ?? 0) !== 1) reasons.push('unmapped_or_ambiguous_canonical_property');
    if (!['leasehold', 'freehold'].includes(row.ownership) || !validKey(row.offerKey)) reasons.push('unknown_offer_identity');
    if (importsByVariant.get(variantKey(row)).length > 1) reasons.push('duplicate_offer_variant');
    if (!['available', 'reserved', 'sold', 'unavailable', 'unknown'].includes(row.availability)) reasons.push('unknown_availability');
    if (new Set(importsByUnit.get(code).map(o => o.availability)).size > 1) reasons.push('conflicting_unit_availability');
    if (!['THB', 'USD', 'EUR'].includes(row.currency) || row.priceUnit !== 'total') reasons.push('invalid_price_units');
    if (!['quoted', 'not_offered'].includes(row.offerStatus)) reasons.push('unknown_offer_status');
    if (row.offerStatus === 'quoted' && (!Number.isFinite(row.amount) || row.amount <= 0)) reasons.push('invalid_price_amount');
    if (row.offerStatus === 'not_offered' && row.amount !== null) reasons.push('not_offered_requires_null_price');
    if (!['base', 'promotion'].includes(row.priceKind)) reasons.push('unknown_or_unseparated_price_kind');
    const promo = row.priceKind === 'promotion' ? normalizeSourceDate(row.promoValidUntil) : null;
    if (promo && (promo.status !== 'valid' || promo.value < day)) reasons.push('invalid_or_expired_promotion');
    const candidate = { propertyId: unit?.propertyId, projectUnitId: unit?.id, projectId: row.projectId, unitCode: row.unitCode,
      ownership: row.ownership, offerKey: row.offerKey, amount: row.amount, currency: row.currency, priceUnit: row.priceUnit,
      priceKind: row.priceKind, offerStatus: row.offerStatus, promoValidUntil: promo?.value ?? null };
    const key = baselineKey(candidate);
    const known = quotes.get(key) ?? [];
    const prior = known[0];
    if (known.length > 1 || (prior && prior.projectId !== row.projectId)) reasons.push('ambiguous_existing_offer');
    if (prior && prior.currency !== row.currency) reasons.push('currency_changed');
    if (prior?.amount > 0 && row.amount > 0 && Math.abs(row.amount / prior.amount - 1) > 0.25) reasons.push('large_price_change');
    if (unit && row.projectId === source?.projectId) seen.add(key);
    if (reasons.length) {
      preview.review.push({ unitCode: row.unitCode, ownership: row.ownership, offerKey: row.offerKey, reasons: [...new Set(reasons)] });
      continue;
    }
    const previous = prior && Object.fromEntries(Object.keys(candidate).map(field => [field, prior[field]]));
    if (!previous || canonical(candidate) !== canonical(previous) || row.availability !== prior.availability) {
      preview.proposals.push({ offer: candidate, unitAvailabilityObserved: row.availability,
        sourceRevision: source.revision, effectiveDate: source.effectiveDate ?? null, expectedVersion: prior?.version ?? null });
    }
  }
  preview.missing = currentOffers.filter(offer => offer.projectId === source?.projectId && !seen.has(baselineKey(offer)))
    .map(offer => ({ propertyId: offer.propertyId, ownership: offer.ownership, offerKey: offer.offerKey }));
  return { ...preview, status: errors.length || preview.review.length ? 'review' : 'staged' };
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
  return records.map(record => {
    const promoRaw = mapping.promoValidUntilColumn ? record[mapping.promoValidUntilColumn] : mapping.promoValidUntil;
    const promoDate = normalizeSourceDate(promoRaw, mapping.promoDateFormat || 'YYYY-MM-DD');
    return {
    projectId: mapping.projectId,
    unitCode: record[mapping.unitCodeColumn], // Deliberately never Number(): leading zeroes are identity.
    amount: typeof record[mapping.amountColumn] === 'number' ? record[mapping.amountColumn] * (mapping.priceScale === 'million' ? 1000000 : 1) : null,
    currency: mapping.currency,
    priceUnit: mapping.priceUnit,
    priceKind: mapping.priceKindColumn ? mapping.priceKindMap?.[record[mapping.priceKindColumn]] ?? 'unknown' : mapping.priceKind ?? 'unknown',
    promoValidUntil: promoDate.value,
    promoValidity: promoDate.status,
    priceProvenance: { parserVersion: mapping.version, amountColumn: mapping.amountColumn, priceScale: mapping.priceScale, priceKindOrigin: mapping.priceKindColumn || 'reviewed_constant', promoDateFormat: mapping.promoDateFormat || 'YYYY-MM-DD', promoDateRaw: promoRaw ?? null },
    availability: mapping.statusMap?.[record[mapping.statusColumn]] ?? 'unknown',
  };
  });
}
