import { SOURCE_TYPES, stageImport, stagePurchaseOfferPreview } from './offplan-staging.mjs';

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const instant = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const isInstant = value => typeof value === 'string' && instant.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const token = value => typeof value === 'string' && !!value.trim() && value === value.trim();
const stop = (status, reasons = []) => ({
  status, reasons, changes: [], missingCount: 0, reviewCount: 0,
  lastKnownGoodRetained: true, publicationEnabled: false,
});

/** Offline validation against already-reviewed operator inputs; never calls a provider. */
export function validateProjectSourceLink(source, project, approvedHosts = []) {
  const reasons = [];
  if (!project || !uuid.test(project.id) || !uuid.test(project.developerId) ||
      source?.projectId !== project.id || source.developerId !== project.developerId) {
    reasons.push('project_developer_mismatch');
  }
  if (!token(source?.sourceId)) reasons.push('missing_source_id');
  if (!SOURCE_TYPES.includes(source?.type)) reasons.push('invalid_source_type');
  let url;
  try {
    if (token(source?.url) && source.url.startsWith('https://') && !/[\\\u0000-\u0020\u007f]/.test(source.url)) url = new URL(source.url);
  } catch { /* Return a code, never the raw link. */ }
  if (!url || url.protocol !== 'https:' || url.username || url.password ||
      url.port || url.search || url.hash || url.pathname === '/') {
    reasons.push('invalid_source_link');
  } else if (!Array.isArray(approvedHosts) || !approvedHosts.includes(url.hostname)) {
    reasons.push('unreviewed_source_host');
  }
  return reasons;
}

/** Both manual and due previews use the same snapshot and the canonical staging engine. */
export function previewProjectSource({
  source, project, approvedHosts, approvedSource, snapshot, current, previousBatch, now,
  canonicalUnits, currentOffers,
  trigger = 'manual', nextDueAt,
} = {}) {
  const admission = validateProjectSourceLink(source, project, approvedHosts);
  if (admission.length) return stop('review', admission);
  if (approvedSource?.sourceId !== source.sourceId || approvedSource.url !== source.url ||
      approvedSource.projectId !== source.projectId || approvedSource.developerId !== source.developerId ||
      approvedSource.type !== source.type) {
    return stop('review', ['source_link_not_bound']);
  }
  // Approval, coverage, dates and source identity come from the trusted operator record.
  const boundSource = approvedSource;
  if (!isInstant(now) || !['manual', 'scheduled_preview'].includes(trigger)) {
    return stop('review', ['invalid_preview_clock_or_trigger']);
  }
  if (trigger === 'scheduled_preview') {
    if (!isInstant(nextDueAt)) return stop('review', ['invalid_due_at']);
    if (nextDueAt > now) return stop('not_due');
  }
  if (source.type !== 'price_availability') return stop('review', ['no_reviewed_preview_adapter']);
  // A missing/failed parser is not an empty inventory. Never stage stale source data.
  if (snapshot?.status !== 'parsed' || !Array.isArray(snapshot.rows)) {
    return stop('stale', ['snapshot_unavailable']);
  }
  const purchaseOffers = snapshot.format === 'purchase-offer-preview-v1';
  if (snapshot.format != null && !purchaseOffers) return stop('review', ['unknown_snapshot_format']);
  if (purchaseOffers ? (!Array.isArray(canonicalUnits) || !Array.isArray(currentOffers)) : !Array.isArray(current)) {
    return stop('review', ['invalid_current_snapshot']);
  }
  if (snapshot.sourceId !== source.sourceId || snapshot.projectId !== source.projectId ||
      !token(snapshot.revision) || snapshot.revision !== boundSource.revision ||
      !token(snapshot.parserVersion) || snapshot.parserVersion !== boundSource.parserVersion ||
      !/^[a-f0-9]{64}$/.test(snapshot.contentSha256 ?? '')) {
    return stop('review', ['snapshot_identity_mismatch']);
  }
  // Block malformed parsed rows; do not let raw parser values through to staging.
  if (snapshot.rows.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    return stop('review', ['invalid_parsed_rows']);
  }
  const baseline = purchaseOffers ? [...canonicalUnits, ...currentOffers] : current;
  if (baseline.some(row => !row || typeof row !== 'object' || Array.isArray(row))) {
    return stop('review', ['invalid_current_snapshot']);
  }
  if (purchaseOffers) {
    const preview = stagePurchaseOfferPreview({ source: boundSource, rows: snapshot.rows, canonicalUnits, currentOffers, now });
    return {
      ...stop(preview.status, [...new Set([...preview.errors, ...preview.review.flatMap(item => item.reasons)])]),
      contentSha256: snapshot.contentSha256,
      checkedAt: now,
      changes: preview.proposals.map(({ offer, unitAvailabilityObserved, expectedVersion }) => ({
        unitId: offer.projectUnitId, unitCode: offer.unitCode, expectedVersion,
        after: { ownership: offer.ownership, offerKey: offer.offerKey, amount: offer.amount, currency: offer.currency,
          priceUnit: offer.priceUnit, priceKind: offer.priceKind, offerStatus: offer.offerStatus,
          promoValidUntil: offer.promoValidUntil, unitAvailabilityObserved },
      })),
      missingCount: preview.missing.length,
      reviewCount: preview.review.length,
    };
  }
  const batch = stageImport({ source: boundSource, rows: snapshot.rows, current, previousBatch, now });
  // Private preview DTO only: omit raw source identity, URLs, error strings and before images.
  const commercial = ({ amount, currency, priceUnit, availability }) => ({ amount, currency, priceUnit, availability });
  return {
    ...stop(batch.status, [...new Set([...batch.errors, ...batch.review.flatMap(item => item.reasons)])]),
    contentSha256: snapshot.contentSha256,
    checkedAt: now,
    changes: batch.changes.map(({ before, after, expectedVersion }) => ({
      unitId: after.id, unitCode: after.unitCode, expectedVersion,
      before: commercial(before), after: commercial(after),
    })),
    missingCount: batch.missing.length,
    reviewCount: batch.review.length,
  };
}
