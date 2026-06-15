// Verifies that the post-signup server-side artefacts created by the
// `handle_new_user` trigger actually landed: profile row + phone column,
// and the two `terms_acceptances` records (terms v1.0, privacy v1.0).
//
// Returns a structured report so the client can show a confirmation toast
// or surface a precise warning when something is missing — without the
// client needing read access (RLS would block it pre-email-confirmation).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  user_id: string;
  expected_phone?: string;
}

interface IntegrityReport {
  ok: boolean;
  profile_exists: boolean;
  phone_saved: boolean;
  phone_matches: boolean;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  warnings: string[];
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { user_id, expected_phone } = (await req.json()) as RequestBody;
    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: profile, error: profileErr }, { data: acceptances, error: termsErr }] =
      await Promise.all([
        supabase.from("profiles").select("id, phone").eq("id", user_id).maybeSingle(),
        supabase
          .from("terms_acceptances")
          .select("document_type, version")
          .eq("user_id", user_id),
      ]);

    if (profileErr) console.error("[verify-signup-integrity] profile read:", profileErr);
    if (termsErr) console.error("[verify-signup-integrity] terms read:", termsErr);

    const profile_exists = !!profile;
    const phone_saved = !!profile?.phone;
    const phone_matches = expected_phone
      ? (profile?.phone ?? "").replace(/\D/g, "") === expected_phone.replace(/\D/g, "")
      : phone_saved;

    const types = new Set((acceptances ?? []).map((a) => a.document_type));
    const terms_accepted = types.has("terms");
    const privacy_accepted = types.has("privacy");

    const warnings: string[] = [];
    if (!profile_exists) warnings.push("profile_missing");
    if (!phone_saved) warnings.push("phone_missing");
    if (expected_phone && profile_exists && !phone_matches) warnings.push("phone_mismatch");
    if (!terms_accepted) warnings.push("terms_missing");
    if (!privacy_accepted) warnings.push("privacy_missing");
    if (profileErr) warnings.push("profile_read_error");
    if (termsErr) warnings.push("terms_read_error");

    const report: IntegrityReport = {
      ok: warnings.length === 0,
      profile_exists,
      phone_saved,
      phone_matches,
      terms_accepted,
      privacy_accepted,
      warnings,
    };

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-signup-integrity] fatal:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
