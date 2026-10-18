/** Display only: never convert an amount or infer a denomination from city/deposit settings. */
export function propertyRateCurrencyLabel(currency: string | null | undefined, isRu: boolean): string {
  return currency?.trim().toUpperCase() || (isRu ? 'валюта не указана' : 'currency not specified');
}

export function formatPropertyRate(amount: number | null | undefined, currency: string | null | undefined, isRu: boolean): string {
  return `${amount == null ? '—' : amount.toLocaleString()} ${propertyRateCurrencyLabel(currency, isRu)}`;
}

/** A percentage comparison is meaningful only when both stored denominations agree. */
export function matchingRateCurrencies(a: string | null | undefined, b: string | null | undefined): boolean {
  const first = a?.trim().toUpperCase();
  return !!first && first === b?.trim().toUpperCase();
}
