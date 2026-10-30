import { propertySupportsMode } from '@/lib/real-estate/propertyDetailIntent';

const amountFields = ['price', 'price_per_night', 'price_per_month', 'price_per_year', 'sale_price'] as const;
const textFields = ['price_period', 'currency', 'sale_currency'] as const;
type AmountField = typeof amountFields[number];
type TextField = typeof textFields[number];
export type PropertyCommercialSource = Partial<Record<AmountField, number | string | null> & Record<TextField, string | null>> & {
  listing_modes?: string[] | null; listing_type?: string | null; is_for_sale?: boolean | null;
};
/** Form projection only. Each amount retains its own stored column/unit. */
export type PropertyCommercialValues = Record<AmountField | TextField, string> & Pick<PropertyCommercialSource, 'listing_modes' | 'listing_type' | 'is_for_sale'>;
export const commercialText = (value: string | number | null | undefined) => value == null ? '' : String(value);
export function propertyCommercialValues(source: PropertyCommercialSource): PropertyCommercialValues {
  return {
    ...Object.fromEntries([...amountFields, ...textFields].map(key => [key, commercialText(source[key])])) as Record<AmountField | TextField, string>,
    listing_modes: source.listing_modes == null ? source.listing_modes : [...source.listing_modes],
    listing_type: source.listing_type, is_for_sale: source.is_for_sale,
  };
}
export function changeCommercialOffer(values: PropertyCommercialValues, mode: 'rent' | 'sale', enabled: boolean): PropertyCommercialValues {
  const modes = new Set(values.listing_modes ?? []);
  // Preserve the other currently intended offer, including legacy listing_type.
  if (propertySupportsMode(values, 'rent')) modes.add('rent');
  if (propertySupportsMode(values, 'buy')) modes.add('sale');
  if (enabled) modes.add(mode); else modes.delete(mode);
  const primary = values.listing_type;
  return { ...values, listing_modes: [...modes],
    listing_type: primary && modes.has(primary) ? primary : modes.has('rent') ? 'rent' : modes.has('sale') ? 'sale' : null,
    is_for_sale: mode === 'sale' ? enabled : values.is_for_sale,
  };
}
function amount(value: string, original: number | string | null | undefined, key: string) {
  if (value === commercialText(original) && original == null) return original;
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > Number.MAX_SAFE_INTEGER) throw new Error(`Invalid amount: ${key}`);
  return parsed;
}
/** No FX, no division by nights/months, no nightly↔generic fallback, no offer inference. */
export function propertyCommercialPayload(values: PropertyCommercialValues, original: PropertyCommercialSource = {}, validateChanges = true, creating = false) {
  const amounts = Object.fromEntries(amountFields.map(key => [key, amount(values[key], original[key], key)])) as Record<AmountField, number | null | undefined>;
  const texts = Object.fromEntries(textFields.map(key => {
    const input = values[key];
    if (input === commercialText(original[key])) return [key, original[key]];
    const value = input.trim();
    if (value && key === 'price_period' && !['night', 'day', 'daily', 'nightly', 'week', 'weekly', 'month', 'monthly', 'year', 'yearly', 'annual', 'total'].includes(value)) throw new Error('Choose a supported billing period');
    if (value && key !== 'price_period' && !/^[a-z]{3}$/i.test(value)) throw new Error(`Use a three-letter currency code: ${key}`);
    return [key, value ? key === 'price_period' ? value : value.toUpperCase() : null];
  })) as Record<TextField, string | null | undefined>;
  if (validateChanges) {
    for (const key of amountFields) {
      if (values[key] === commercialText(original[key]) || amounts[key] == null) continue;
      if (!(key === 'sale_price' ? texts.sale_currency : texts.currency)) throw new Error(key === 'sale_price' ? 'Set the sale currency before changing its amount' : 'Set the rental/offer currency before changing its amount');
      if (key === 'price' && !texts.price_period && propertySupportsMode(values, 'rent')) throw new Error('Set the billing period for the offer amount');
    }
  }
  if (creating) {
    for (const key of amountFields) if (amounts[key] === undefined) amounts[key] = null;
    for (const key of textFields) if (texts[key] === undefined) texts[key] = null;
  }
  return { ...amounts, ...texts, listing_modes: values.listing_modes === undefined ? original.listing_modes : values.listing_modes, listing_type: values.listing_type === undefined ? original.listing_type : values.listing_type, is_for_sale: values.is_for_sale === undefined ? original.is_for_sale : values.is_for_sale };
}
/** Adapter for the existing canonical form's string-valued amount controls. */
function initialAmount(value: number | string | null | undefined): number | null | undefined {
  if (value === null) return null;
  if (value === undefined) return undefined;
  return Number(value);
}
export function propertyCommercialInitial(source: PropertyCommercialSource) {
  const values = propertyCommercialValues(source);
  return { price: initialAmount(source.price), price_period: source.price_period,
    currency: source.currency, sale_currency: source.sale_currency,
    price_per_night: values.price_per_night, price_per_month: values.price_per_month, price_per_year: values.price_per_year, sale_price: values.sale_price,
    listing_modes: source.listing_modes, listing_type: source.listing_type, is_for_sale: source.is_for_sale ?? undefined,
  };
}
