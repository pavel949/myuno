/**
 * devmod-unit-hold — Create a 30-minute soft hold on a project unit
 *
 * POST body:
 *   unit_id          string (uuid)   — required
 *   expected_version number          — required (optimistic concurrency)
 *   lead_id?         string (uuid)   — optional, link to nb_lead
 *   attribution_id?  string (uuid)   — optional, link to lead_attribution
 *   notes?           string
 *
 * Always returns HTTP 200 to avoid FunctionsHttpError in the client.
 * Status is indicated via the JSON body:
 *   { success: true,  hold_id, expires_at }
 *   { success: false, reason: "conflict" | "bad_request" | "internal", message: "..." }
 *
 * Deploy: supabase functions deploy devmod-unit-hold
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SOFT_HOLD_MINUTES = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, reason: "method_not_allowed", message: "POST required" });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, reason: "bad_request", message: "Invalid JSON" });
  }

  const { unit_id, expected_version, lead_id, notes } = body as {
    unit_id?: string;
    expected_version?: number;
    lead_id?: string;
    notes?: string;
  };

  if (!unit_id) {
    return json({ success: false, reason: "bad_request", message: "unit_id is required" });
  }
  if (typeof expected_version !== "number") {
    return json({ success: false, reason: "bad_request", message: "expected_version is required" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  try {
    // ── 1. Atomic transition via DB function ──────────────────────────────────
    const { data: transitioned, error: transitionError } = await supabase
      .rpc("devmod_attempt_unit_transition", {
        p_unit_id: unit_id,
        p_from_status: "available",
        p_to_status: "soft_hold",
        p_expected_version: expected_version,
      });

    if (transitionError) {
      console.error("[devmod-unit-hold] transition error:", transitionError);
      return json({ success: false, reason: "internal", message: transitionError.message });
    }

    if (!transitioned) {
      // Another buyer got there first, or status changed concurrently
      return json({
        success: false,
        reason: "conflict",
        message: "Unit is no longer available",
      });
    }

    // ── 2. Create hold record ─────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + SOFT_HOLD_MINUTES * 60 * 1000).toISOString();

    const { data: hold, error: holdError } = await supabase
      .from("unit_holds")
      .insert({
        unit_id,
        hold_type: "soft_hold",
        fee_status: "none",
        expires_at: expiresAt,
        lead_id: lead_id ?? null,
        notes: notes ?? null,
      })
      .select("id, expires_at")
      .single();

    if (holdError || !hold) {
      // Transition succeeded but hold record failed — log and continue
      // (unit is in soft_hold state; it will self-expire via cron)
      console.error("[devmod-unit-hold] hold insert error:", holdError);
      return json({
        success: true,
        hold_id: null,
        expires_at: expiresAt,
        warning: "Hold created but record insert failed",
      });
    }

    return json({
      success: true,
      hold_id: (hold as { id: string; expires_at: string }).id,
      expires_at: (hold as { id: string; expires_at: string }).expires_at,
    });
  } catch (err) {
    console.error("[devmod-unit-hold] unexpected error:", err);
    return json({ success: false, reason: "internal", message: String(err) });
  }
});
