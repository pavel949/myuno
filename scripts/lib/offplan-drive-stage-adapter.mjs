import { createHash } from 'node:crypto';

const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const KEY = /^[a-zA-Z0-9_.-]{1,80}$/;
const HASH = /^[0-9a-f]{64}$/;
const STOCK = new Set(['available', 'reserved', 'sold', 'held', 'unknown']);
const CURRENCY = new Set(['THB', 'USD', 'EUR']);
const sameId = (a, b) => typeof a === 'string' && UUID.test(a) && typeof b === 'string' && UUID.test(b) && a.toLowerCase() === b.toLowerCase();
const isUuid = value => typeof value === 'string' && UUID.test(value);
const fail = code => ({ ok: false, code });
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, fields) => isObject(value) && Object.keys(value).length === fields.length &&
  fields.every(key => Object.prototype.hasOwnProperty.call(value, key));
const unitKey = value => typeof value === 'string' ? value.trim().toLowerCase() : '';

/** V1 consumes one bounded, already reviewed normalized JSON observation, not an unreviewed supplier file. */
function readObservation(bytes) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > 8192) return null;
  let record;
  try { record = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { return null; }
  if (!exact(record, ['unit_code', 'unit_type', 'amount', 'currency', 'price_unit', 'status']) ||
      typeof record.unit_code !== 'string' || !KEY.test(record.unit_code) ||
      typeof record.unit_type !== 'string' || !KEY.test(record.unit_type) ||
      typeof record.amount !== 'string' || !CURRENCY.has(record.currency) ||
      record.price_unit !== 'total' || !STOCK.has(record.status)) return null;
  const m = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(record.amount);
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  if (!minor) return null;
  return { code: record.unit_code, type: record.unit_type, amount: minor / 100, currency: record.currency, status: record.status };
}

function bindingMatches(binding, scope) {
  const { project, source, job } = binding ?? {};
  return sameId(project?.id, scope.projectId) && sameId(project?.developer_id, scope.developerId) &&
    sameId(source?.id, scope.sourceId) && sameId(source?.project_id, project.id) &&
    sameId(job?.id, scope.jobId) && sameId(job?.project_id, project.id) && sameId(job?.source_id, source.id) &&
    ['running', 'completed', 'partial'].includes(job?.status) && typeof binding.parserVersion === 'string' &&
    KEY.test(binding.parserVersion) && typeof binding.approvedSha256 === 'string' && HASH.test(binding.approvedSha256) &&
    Array.isArray(binding.salesRows) && Array.isArray(binding.physicalRows);
}

function linkedUnit(binding, scope, code) {
  const matches = binding.salesRows.filter(row => unitKey(row?.unit_code) === unitKey(code));
  const sales = matches[0];
  if (matches.length !== 1 || !isUuid(sales?.id) || !isUuid(sales?.property_id) ||
      sales.unit_code.trim() !== code || !sameId(sales.project_id, scope.projectId) ||
      binding.salesRows.filter(row => sameId(row?.property_id, sales.property_id)).length !== 1) return null;
  const physical = binding.physicalRows.filter(row => sameId(row?.id, sales.property_id));
  return physical.length === 1 && sameId(physical[0].project_id, scope.projectId)
    ? { unitId: sales.id, propertyId: physical[0].id } : null;
}

function confirmedVersion(row, scope, hash, parserVersion) {
  return isUuid(row?.id) && sameId(row.import_job_id, scope.jobId) &&
    sameId(row.project_id, scope.projectId) && sameId(row.source_id, scope.sourceId) &&
    row.content_sha256 === hash && row.parser_version === parserVersion && row.status === 'pending_review';
}

/**
 * Unwired service adapter. Ports must be trusted, authenticated and actor/project-scoped:
 * admit() resolves live admin+scope; loadBinding() supplies approved hash/parser + canonical rows;
 * openWriter() yields findVersionByJob, stageDriveImportVersion and readStageItems.
 * Never pass these ports or raw token/supplier data from a browser.
 */
export async function stageOneReviewedDrivePrice({ scope: requestedScope, normalizedBytes } = {}, ports) {
  if (!exact(requestedScope, ['developerId', 'projectId', 'sourceId', 'jobId']) || !Object.values(requestedScope).every(isUuid)) return fail('invalid_scope');
  const scope = Object.freeze({ ...requestedScope });
  try {
    const actor = await ports.admit(scope);
    if (!isUuid(actor?.id) || actor.isAdmin !== true || actor.canImportProjectSource !== true) return fail('forbidden');
    // One copy: byte inspection, digest and dispatch use the same immutable working input.
    if (!(normalizedBytes instanceof Uint8Array) || !normalizedBytes.length || normalizedBytes.length > 8192) return fail('invalid_observation');
    const bytes = Uint8Array.from(normalizedBytes);
    const observation = readObservation(bytes);
    if (!observation) return fail('invalid_observation');
    const hash = createHash('sha256').update(bytes).digest('hex');
    const binding = await ports.loadBinding(scope, actor);
    if (!bindingMatches(binding, scope)) return fail('unbound_source_job');
    if (binding.approvedSha256 !== hash) return fail('unapproved_snapshot');
    const unit = linkedUnit(binding, scope, observation.code);
    if (!unit) return fail('unlinked_or_ambiguous_unit');
    const { parserVersion } = binding;
    const writer = await ports.openWriter();
    const prior = await writer.findVersionByJob(scope.jobId);
    if (prior && !confirmedVersion(prior, scope, hash, parserVersion)) return fail('stage_conflict');
    const receipt = prior?.id ?? await writer.stageDriveImportVersion({
      p_job_id: scope.jobId, p_content_sha256: hash, p_parser_version: parserVersion,
      p_project_patch: {}, p_project_sources: {},
      p_units: [{
        unit_code: observation.code, unit_type: observation.type, price: observation.amount,
        currency: observation.currency, status: observation.status, needs_review: true,
        review_reasons: ['operator_review_required'], _raw: { price_unit: 'total' },
      }],
    });
    // RPC locks and deduplicates by job, but returns an existing version even for a different payload.
    if (!isUuid(receipt)) return fail('unconfirmed_stage');
    const stored = await writer.findVersionByJob(scope.jobId);
    if (!sameId(stored?.id, receipt) || !confirmedVersion(stored, scope, hash, parserVersion)) return fail('stage_conflict');
    const items = await writer.readStageItems(receipt);
    const item = Array.isArray(items) && items.length === 1 ? items[0] : null;
    if (!sameId(item?.version_id, receipt) || item.unit_code !== observation.code ||
        item.unit_type !== observation.type || item.price !== observation.amount || item.currency !== observation.currency ||
        item.status !== observation.status || item.needs_review !== true || item.raw_record?.price_unit !== 'total') return fail('unconfirmed_item');
    const reloaded = await ports.loadBinding(scope, actor);
    const matched = bindingMatches(reloaded, scope) && reloaded.approvedSha256 === hash && reloaded.parserVersion === parserVersion
      ? linkedUnit(reloaded, scope, observation.code) : null;
    if (!sameId(matched?.unitId, unit.unitId) || !sameId(matched?.propertyId, unit.propertyId)) return fail('canonical_link_changed');
    return { ok: true, status: 'staged_for_review', versionId: receipt, ...unit, publicationEnabled: false };
  } catch {
    // Errors may contain supplier metadata or credentials. A write with lost acknowledgement is not an invitation to resend.
    return fail('stage_unconfirmed_check_existing_job');
  }
}
