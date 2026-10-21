import { describe, it, expect } from "vitest";
import {
  validateItemPrices,
  validateSinglePrice,
  type PriceValidationSpec,
} from "../../../supabase/functions/_shared/price-guard.ts";

/**
 * Minimal stub of the Supabase query builder surface used by price-guard:
 *   supabaseAdmin.from(table).select(cols).in(col, ids) -> { data, error }
 */
function stubClient(rows: Record<string, unknown>[], error: unknown = null) {
  return {
    from() {
      return {
        select() {
          return {
            in() {
              return Promise.resolve({ data: rows, error });
            },
          };
        },
      };
    },
    // deno-lint-ignore no-explicit-any
  } as any;
}

const spec: PriceValidationSpec = {
  table: "marketplace_products",
  priceColumns: ["price"],
  activeColumn: "is_active",
};

describe("price-guard validateItemPrices", () => {
  it("accepts a submitted price that matches the authoritative price", async () => {
    const client = stubClient([{ id: "p1", price: 1200, is_active: true }]);
    await expect(
      validateItemPrices(client, spec, [{ id: "p1", price: 1200 }], "test"),
    ).resolves.toBeUndefined();
  });

  it("accepts within the default tolerance", async () => {
    const client = stubClient([{ id: "p1", price: 1200, is_active: true }]);
    await expect(
      validateItemPrices(client, spec, [{ id: "p1", price: 1200.4 }], "test"),
    ).resolves.toBeUndefined();
  });

  it("rejects a tampered (too-low) price — the pay-1-baht attack", async () => {
    const client = stubClient([{ id: "p1", price: 1200, is_active: true }]);
    await expect(
      validateItemPrices(client, spec, [{ id: "p1", price: 1 }], "test"),
    ).rejects.toThrow(/price mismatch/i);
  });

  it("rejects an unknown product id", async () => {
    const client = stubClient([]); // id not found
    await expect(
      validateItemPrices(client, spec, [{ id: "ghost", price: 1200 }], "test"),
    ).rejects.toThrow(/invalid or unavailable/i);
  });

  it("rejects an inactive product", async () => {
    const client = stubClient([{ id: "p1", price: 1200, is_active: false }]);
    await expect(
      validateItemPrices(client, spec, [{ id: "p1", price: 1200 }], "test"),
    ).rejects.toThrow(/invalid or unavailable/i);
  });

  it("supports multiple price columns (any match passes)", async () => {
    const yachtSpec: PriceValidationSpec = {
      table: "listings",
      priceColumns: ["price_full_day", "price_half_day"],
    };
    const client = stubClient([{ id: "y1", price_full_day: 40000, price_half_day: 25000 }]);
    await expect(validateSinglePrice(client, yachtSpec, "y1", 25000, "test")).resolves.toBeUndefined();
    await expect(validateSinglePrice(client, yachtSpec, "y1", 999, "test")).rejects.toThrow(/price mismatch/i);
  });

  it("priceIsFloor accepts a submitted price at or above the minimum", async () => {
    const floorSpec: PriceValidationSpec = {
      table: "listings",
      priceColumns: ["price"],
      priceIsFloor: true,
    };
    const client = stubClient([{ id: "s1", price: 500 }]);
    await expect(validateSinglePrice(client, floorSpec, "s1", 800, "test")).resolves.toBeUndefined();
    await expect(validateSinglePrice(client, floorSpec, "s1", 100, "test")).rejects.toThrow(/price mismatch/i);
  });

  it("is a no-op for an empty item list", async () => {
    const client = stubClient([]);
    await expect(validateItemPrices(client, spec, [], "test")).resolves.toBeUndefined();
  });
});
