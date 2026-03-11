const FURNISHING_LEVEL_ALIAS_MAP: Record<string, string> = {
  unfurnished: 'unfurnished',
  partially: 'basic_furnishing',
  partially_furnished: 'basic_furnishing',
  basic_furnishing: 'basic_furnishing',
  fully: 'full_furnishing',
  fully_furnished: 'full_furnishing',
  full_furnishing: 'full_furnishing',
  luxury: 'premium_designer_interior',
  designer_interior: 'designer_interior',
  premium_designer_interior: 'premium_designer_interior',
};

export function normalizeViewTypes(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',').map((item) => item.trim())
      : [];

  return Array.from(
    new Set(
      values
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    )
  );
}

export function primaryViewType(value: unknown): string {
  return normalizeViewTypes(value)[0] || '';
}

export function normalizeFurnishingLevel(value: unknown): string {
  if (typeof value !== 'string') return '';

  const normalized = value.trim();
  if (!normalized) return '';

  return FURNISHING_LEVEL_ALIAS_MAP[normalized] || normalized;
}
