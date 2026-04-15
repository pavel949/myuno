import type { CrmCustomOption } from '@/hooks/useCrmSettings';

/** Resolve stored slug to company option label; if missing, show raw value so data is never hidden. */
export function resolveCrmOptionLabel(
  value: string | null | undefined,
  options: CrmCustomOption[],
  isRu: boolean,
): string {
  if (value == null || value === '') return '';
  const o = options.find((x) => x.value === value);
  if (o) return isRu ? o.label_ru : o.label_en;
  return value;
}

export function findCrmOption(value: string | null | undefined, options: CrmCustomOption[]): CrmCustomOption | undefined {
  if (value == null || value === '') return undefined;
  return options.find((x) => x.value === value);
}
