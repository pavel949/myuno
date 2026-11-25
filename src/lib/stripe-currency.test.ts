import { describe, expect, it } from "vitest";
import { toStripeMinorUnits } from "../../supabase/functions/_shared/currency";

describe("Stripe currency conversion", () => {
  it("converts whole and fractional Thai baht to satang", () => {
    expect(toStripeMinorUnits(700, "THB")).toBe(70000);
    expect(toStripeMinorUnits(700.25, "thb")).toBe(70025);
  });

  it("keeps zero-decimal currencies in whole units", () => {
    expect(toStripeMinorUnits(700, "JPY")).toBe(700);
  });
});
