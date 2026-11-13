export const DRIVE_UNIT_STATUSES = ['available', 'reserved', 'sold', 'held', 'unknown'] as const;
export const DRIVE_CURRENCIES = ['THB', 'USD', 'EUR', 'RUB'] as const;

export type DriveUnitStatus = typeof DRIVE_UNIT_STATUSES[number];
export type DriveSourceReference = {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
};

export type NormalizedDriveUnit = Record<string, unknown> & {
  unit_code: string | null;
  unit_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  price: number | null;
  currency: string | null;
  view_type: string | null;
  status: DriveUnitStatus;
  needs_review: boolean;
  review_reasons: string[];
};

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function integerValue(value: unknown): number | null {
  const valueNumber = numberValue(value);
  return valueNumber !== null && Number.isInteger(valueNumber) ? valueNumber : null;
}

export function driveUnitSource(file: DriveSourceReference): Record<string, unknown> {
  return {
    _source: file.name,
    _source_file_id: file.id,
    _source_file_name: file.name,
    _source_modified_at: file.modifiedTime ?? null,
    _source_web_view_link: file.webViewLink ?? null,
  };
}

/** AI output is untrusted input. Missing/invalid availability never becomes available. */
export function normalizeDriveUnit(raw: Record<string, unknown>, source?: DriveSourceReference): NormalizedDriveUnit {
  const embeddedSource = !source && text(raw._source_file_id) && text(raw._source_file_name)
    ? {
        id: text(raw._source_file_id)!,
        name: text(raw._source_file_name)!,
        modifiedTime: text(raw._source_modified_at) ?? undefined,
        webViewLink: text(raw._source_web_view_link) ?? undefined,
      }
    : source;
  const sourceStatus = text(raw.status)?.toLowerCase() ?? null;
  const status = DRIVE_UNIT_STATUSES.includes(sourceStatus as DriveUnitStatus)
    ? sourceStatus as DriveUnitStatus
    : 'unknown';
  const currencyValue = text(raw.currency)?.toUpperCase() ?? null;
  const currency = DRIVE_CURRENCIES.includes(currencyValue as typeof DRIVE_CURRENCIES[number])
    ? currencyValue
    : null;
  const unitCode = text(raw.unit_code);
  const unitType = text(raw.unit_type) ?? 'unknown';
  const price = numberValue(raw.price);
  const reasons: string[] = [];

  if (!sourceStatus) reasons.push('missing_status');
  else if (status === 'unknown') reasons.push('unrecognized_status');
  if (!unitCode) reasons.push('missing_unit_code');
  if (!text(raw.unit_type)) reasons.push('missing_unit_type');
  if (price !== null && !currency) reasons.push('missing_or_invalid_currency');
  if (price === null && currency) reasons.push('currency_without_price');
  if (embeddedSource && !embeddedSource.id) reasons.push('missing_source');

  return {
    unit_code: unitCode,
    unit_type: unitType,
    bedrooms: integerValue(raw.bedrooms),
    bathrooms: integerValue(raw.bathrooms),
    area_sqm: numberValue(raw.area_sqm),
    floor: integerValue(raw.floor),
    price,
    currency,
    view_type: text(raw.view_type),
    status,
    needs_review: reasons.length > 0,
    review_reasons: reasons,
    ...(embeddedSource ? driveUnitSource(embeddedSource) : {}),
    ...(text(raw._extraction_method) ? { _extraction_method: text(raw._extraction_method) } : {}),
    _raw: raw,
  };
}

export function normalizeDriveUnits(
  rows: Array<Record<string, unknown>>,
  source?: DriveSourceReference,
): NormalizedDriveUnit[] {
  const normalized = rows.map(row => normalizeDriveUnit(row, source));
  const counts = new Map<string, number>();
  for (const row of normalized) {
    if (!row.unit_code) continue;
    const key = row.unit_code.toLocaleUpperCase('en-US');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return normalized.map(row => {
    const duplicate = row.unit_code
      ? (counts.get(row.unit_code.toLocaleUpperCase('en-US')) ?? 0) > 1
      : false;
    if (!duplicate) return row;
    const reasons = [...new Set([...row.review_reasons, 'duplicate_unit_code'])];
    return { ...row, needs_review: true, review_reasons: reasons };
  });
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

export async function driveImportContentHash(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(stableJson(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
