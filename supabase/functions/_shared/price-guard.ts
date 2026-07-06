/**
 * Server-side price validation (anti-tampering) for checkout Edge Functions.
 *
 * Client-supplied prices must NEVER be trusted: a caller can POST `price: 1`
 * and otherwise pay 1 unit for any order. Every checkout that charges from a
 * catalogue price must validate each submitted price against the authoritative
 * value in the DB before building the Stripe line items.
 *
 * This generalises the pattern first implemented inline in
 * `create-flowers-checkout` (bouquet lookup + tolerance match) so every vertical
 * can reuse it via a single `(table, id-column, price-columns)` spec.
 *
 * On any mismatch / missing / inactive row it THROWS — the checkout handler
 * turns thrown errors into a 400, so the flow fails closed.
 */

import type { SupabaseClient } from "./supabase.ts";

export interface PriceValidationSpec {
  /** Table holding the authoritative price, e.g. "marketplace_products". */
  table: string;
  /** Primary-key / lookup column. Defaults to "id". */
  idColumn?: string;
  /** Authoritative price column(s). Any one matching within tolerance passes. */
  priceColumns: string[];
  /** Optional boolean column; a row is rejected when it is strictly `false`. */
  activeColumn?: string;
  /** Absolute tolerance in currency units. Defaults to 0.5. */
  tolerance?: number;
  /**
   * Optional multipliers applied to each authoritative price to form the
   * allowed set (e.g. flowers S/M/L = [0.7, 1, 1.5]). `1` is always included.
   */
  allowMultipliers?: number[];
  /**
   * When true the submitted price only has to be >= the minimum authoritative
   * price (a floor, e.g. `pet_services.price_from`) rather than matching exactly.
   */
  priceIsFloor?: boolean;
}

export interface LineToValidate {
  id: string;
  price: number;
}

const PRICE_MISMATCH = "Price mismatch — please refresh your cart";

function allowedPricesFor(row: Record<string, unknown>, spec: PriceValidationSpec): number[] {
  const multipliers = spec.allowMultipliers && spec.allowMultipliers.length
    ? [...new Set([1, ...spec.allowMultipliers])]
    : [1];
  const prices: number[] = [];
  for (const col of spec.priceColumns) {
    const base = Number(row[col]);
    if (!Number.isFinite(base) || base <= 0) continue;
    for (const m of multipliers) prices.push(base * m);
  }
  return prices;
}

/**
 * Validate a batch of `{ id, price }` items against `spec`.
 * Throws on the first invalid line. Resolves silently when all lines are valid.
 */
export async function validateItemPrices(
  supabaseAdmin: SupabaseClient,
  spec: PriceValidationSpec,
  items: LineToValidate[],
  endpoint: string,
): Promise<void> {
  if (!items.length) return;

  const idColumn = spec.idColumn ?? "id";
  const tolerance = spec.tolerance ?? 0.5;
  const ids = [...new Set(items.map((i) => i.id).filter((id) => typeof id === "string" && id.length))];
  if (!ids.length) {
    throw new Error(`Missing product id — cannot verify price`);
  }

  const columns = [idColumn, ...spec.priceColumns, ...(spec.activeColumn ? [spec.activeColumn] : [])];
  const { data, error } = await supabaseAdmin
    .from(spec.table)
    .select(columns.join(", "))
    .in(idColumn, ids);
  if (error) {
    console.error(`[${endpoint}] price validation query failed for ${spec.table}:`, error.message);
    throw new Error("Failed to validate prices");
  }

  const rowById = new Map<string, Record<string, unknown>>();
  for (const row of ((data ?? []) as unknown) as Record<string, unknown>[]) {
    rowById.set(String(row[idColumn]), row);
  }

  for (const item of items) {
    const row = rowById.get(item.id);
    if (!row) {
      console.warn(`[${endpoint}] price validation: unknown ${spec.table} id=${item.id}`);
      throw new Error(`Invalid or unavailable product: ${item.id}`);
    }
    if (spec.activeColumn && row[spec.activeColumn] === false) {
      throw new Error(`Invalid or unavailable product: ${item.id}`);
    }

    const submitted = Number(item.price);
    if (!Number.isFinite(submitted) || submitted < 0) {
      throw new Error(`Invalid price for product: ${item.id}`);
    }

    const allowed = allowedPricesFor(row, spec);
    if (!allowed.length) {
      console.error(`[${endpoint}] no authoritative price on ${spec.table} id=${item.id}`);
      throw new Error(`Invalid or unavailable product: ${item.id}`);
    }

    const ok = spec.priceIsFloor
      ? submitted >= Math.min(...allowed) - tolerance
      : allowed.some((p) => Math.abs(p - submitted) <= tolerance);
    if (!ok) {
      console.warn(
        `[${endpoint}] price tamper rejected: ${spec.table} id=${item.id} submitted=${submitted} allowed=[${allowed.join(",")}]`,
      );
      throw new Error(PRICE_MISMATCH);
    }
  }
}

/**
 * Convenience wrapper for single-item verticals (event ticket, yacht base,
 * cleaning/legal/pet service). Throws on mismatch.
 */
export async function validateSinglePrice(
  supabaseAdmin: SupabaseClient,
  spec: PriceValidationSpec,
  id: string,
  submittedPrice: number,
  endpoint: string,
): Promise<void> {
  await validateItemPrices(supabaseAdmin, spec, [{ id, price: submittedPrice }], endpoint);
}
