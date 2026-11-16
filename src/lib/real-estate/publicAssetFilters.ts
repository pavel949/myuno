import { COMMERCIAL_TYPES, LAND_TYPES, HOTEL_LICENSE_TYPES } from './commercialTaxonomy';

/** Public catalogue URL validation only; never an authorization or pricing writer. */
export function publicAssetNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw == null || !raw.trim()) return undefined;
  const number = Number(raw);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

export function publicAssetFilterIssue(params: URLSearchParams, kind: 'commercial' | 'land' | 'hotel'): 'invalid' | 'unsupported' | undefined {
  const intentKey = kind === 'hotel' ? 'mode' : 'intent';
  const modes = kind === 'hotel' ? ['buy', 'lease', 'management'] : ['sale', 'rent'];
  if (params.has(intentKey) && !modes.includes(params.get(intentKey)!)) return 'invalid';
  const types = kind === 'land' ? LAND_TYPES : COMMERCIAL_TYPES;
  if (kind !== 'hotel' && params.has('type') && params.get('type') !== 'all' && !types.some(type => type.id === params.get('type'))) return 'invalid';
  if (kind === 'commercial' && params.get('tenant') === '1') return 'unsupported';
  if (kind === 'hotel' && (params.get('mgmt') && params.get('mgmt') !== 'all' || params.get('minOcc'))) return 'unsupported';
  if (kind === 'commercial' && params.get('intent') === 'rent' && (params.get('minPrice') || params.get('maxPrice'))) return 'unsupported';
  const keys = kind === 'hotel' ? ['minKeys', 'maxKeys', 'minStars'] : kind === 'commercial' ? ['minPrice', 'maxPrice', 'minArea', 'maxArea', 'minCap'] : [];
  for (const key of keys) if (params.get(key)?.trim() && publicAssetNumber(params, key) === undefined) return 'invalid';
  for (const [minKey, maxKey] of [['minPrice', 'maxPrice'], ['minArea', 'maxArea'], ['minKeys', 'maxKeys']]) {
    const min = publicAssetNumber(params, minKey), max = publicAssetNumber(params, maxKey);
    if (min !== undefined && max !== undefined && min > max) return 'invalid';
  }
  if (kind === 'hotel' && ['minKeys', 'maxKeys', 'minStars'].some(key => params.get(key)?.trim() && !Number.isInteger(publicAssetNumber(params, key)))) return 'invalid';
  if ((publicAssetNumber(params, 'minCap') ?? 0) > 100 || (publicAssetNumber(params, 'minStars') ?? 0) > 5) return 'invalid';
  if (kind === 'hotel' && params.get('license') && params.get('license') !== 'all' && !HOTEL_LICENSE_TYPES.some(type => type.id === params.get('license'))) return 'invalid';
}

export function clearPublicAssetFilters(params: URLSearchParams) {
  const next = new URLSearchParams(params);
  for (const key of ['intent', 'mode', 'type', 'minPrice', 'maxPrice', 'minArea', 'maxArea', 'minCap', 'chanote', 'tenant', 'minKeys', 'maxKeys', 'minStars', 'license', 'mgmt', 'minOcc']) next.delete(key);
  return next;
}
