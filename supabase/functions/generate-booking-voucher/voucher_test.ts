/**
 * Integration test: generate-booking-voucher
 *
 * Verifies that for a confirmed property booking whose underlying
 * `properties.address` is empty, the voucher endpoint:
 *   1. Returns HTTP 200 with `success: true` (does not crash).
 *   2. Always populates `voucher.title` for both RU and EN.
 *   3. Always populates `voucher.location` (falls back to district or
 *      a localized "Address on request" string).
 *
 * Test fixture: booking `aa97af8b-ba95-450f-ab85-6af570ca7955`
 * (property `92e61eea-df7b-42bd-bae1-14e5110841d5`, address = "").
 */

import { loadSync } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
loadSync({ export: true, examplePath: null, allowEmptyValues: true });
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const FN_URL = `${SUPABASE_URL}/functions/v1/generate-booking-voucher`;
// Confirmed property booking whose properties.address is empty string.
const BOOKING_ID = "aa97af8b-ba95-450f-ab85-6af570ca7955";

async function invoke(language: "ru" | "en") {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ bookingId: BOOKING_ID, language }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

Deno.test(
  "voucher: confirmed property booking with empty address (RU)",
  async () => {
    const { status, body } = await invoke("ru");
    assertEquals(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assertEquals(body.success, true);
    const v = body.voucher;
    assert(v, "voucher payload missing");
    assert(
      typeof v.title === "string" && v.title.trim().length > 0,
      `title must be non-empty, got: ${JSON.stringify(v.title)}`,
    );
    assert(
      typeof v.location === "string" && v.location.trim().length > 0,
      `location must be non-empty (fallback expected), got: ${JSON.stringify(v.location)}`,
    );
    assertEquals(v.booking_type, "property");
    assertEquals(v.status, "active");
  },
);

Deno.test(
  "voucher: confirmed property booking with empty address (EN)",
  async () => {
    const { status, body } = await invoke("en");
    assertEquals(status, 200, `expected 200, got ${status}: ${JSON.stringify(body)}`);
    assertEquals(body.success, true);
    const v = body.voucher;
    assert(v, "voucher payload missing");
    assert(
      typeof v.title === "string" && v.title.trim().length > 0,
      `title must be non-empty, got: ${JSON.stringify(v.title)}`,
    );
    assert(
      typeof v.location === "string" && v.location.trim().length > 0,
      `location must be non-empty (fallback expected), got: ${JSON.stringify(v.location)}`,
    );
    assertEquals(v.booking_type, "property");
  },
);

Deno.test("voucher: missing identifiers returns 400, no crash", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ language: "en" }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(typeof body.error === "string" && body.error.length > 0);
});
