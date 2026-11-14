import { z } from 'zod';

export const basicInfoSchema = z.object({
  title: z.string().min(2, 'Title (EN) must be at least 2 characters'),
  title_ru: z.string().min(2, 'Title (RU) must be at least 2 characters'),
  property_type: z.string().min(1, 'Select a property type'),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area_sqm: z.union([
    z.string().regex(/^\d*\.?\d*$/).transform(Number).pipe(z.number().min(0)),
    z.literal(''),
  ]),
});

export const locationSchema = z.object({
  address: z.string().min(3, 'Enter a valid address'),
});

export const pricingSchema = z.object({
  price_per_night: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price').transform(Number).pipe(z.number().positive('Price must be positive')),
    z.literal(''),
  ]),
  min_stay_nights: z.number().int().min(1).max(365).optional(),
  max_guests: z.number().int().min(1).max(50).optional(),
  deposit_amount: z.union([
    z.string().regex(/^\d*\.?\d*$/).transform(Number).pipe(z.number().min(0)),
    z.literal(''),
  ]),
  is_for_sale: z.boolean().optional(),
  sale_price: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid sale price').transform(Number).pipe(z.number().positive('Sale price must be positive')),
    z.literal(''),
  ]),
  sale_currency: z.string().regex(/^[a-z]{3}$/i, 'Use a three-letter sale currency code').or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.is_for_sale && !data.sale_price) ctx.addIssue({ code: 'custom', path: ['sale_price'], message: 'Sale price is required when the property is for sale' });
  if (data.is_for_sale && !data.sale_currency) ctx.addIssue({ code: 'custom', path: ['sale_currency'], message: 'Sale currency is required when the property is for sale' });
});

export type BasicInfoValidation = z.input<typeof basicInfoSchema>;
export type PricingValidation = z.input<typeof pricingSchema>;

/** Returns a list of error messages for a given step, or empty array if valid */
export function validateBasicInfo(data: BasicInfoValidation): string[] {
  const result = basicInfoSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

export function validateLocation(data: { address: string }): string[] {
  const result = locationSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}

export function validatePricing(data: PricingValidation): string[] {
  const result = pricingSchema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map((i) => i.message);
}
