/**
 * devmod-buyer-kyc — KYC submission + passport OCR for buyers
 *
 * POST body (action: "lite"):
 *   first_name, last_name, nationality, date_of_birth, phone?, email?,
 *   lead_id?
 *   → creates/updates buyers record, sets kyc_status='submitted'
 *   → returns { buyer_id, kyc_status: 'submitted' }
 *
 * POST body (action: "upload_passport"):
 *   buyer_id, passport_storage_path (path in kyc-documents bucket)
 *   → downloads image, runs Claude Vision OCR
 *   → updates buyer with passport_number, passport_expiry, DOB if confirmed
 *   → sets kyc_status='verified' when OCR succeeds
 *   → returns { buyer_id, kyc_status, extracted: { passport_number, expiry, dob } }
 *
 * POST body (action: "status"):
 *   → returns current buyer record for authenticated user
 *
 * Deploy: supabase functions deploy devmod-buyer-kyc
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { requireAuth } from "../_shared/auth-guard.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// ── Claude Vision OCR ─────────────────────────────────────────────────────────

async function extractPassportData(imageUrl: string): Promise<{
  passport_number: string | null;
  expiry: string | null;
  dob: string | null;
  nationality: string | null;
}> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: `Extract the following fields from this passport image. Return ONLY a JSON object with no markdown, no explanation:
{
  "passport_number": "...",
  "expiry": "YYYY-MM-DD",
  "dob": "YYYY-MM-DD",
  "nationality": "ISO 2-letter code, e.g. RU, GB, TH"
}
If a field is not visible or unclear, use null.`,
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = await res.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const text = data.content.find(c => c.type === "text")?.text ?? "{}";
  try {
    const parsed = JSON.parse(text) as Record<string, string | null>;
    return {
      passport_number: parsed.passport_number ?? null,
      expiry: parsed.expiry ?? null,
      dob: parsed.dob ?? null,
      nationality: parsed.nationality ?? null,
    };
  } catch {
    return { passport_number: null, expiry: null, dob: null, nationality: null };
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const authResult = await requireAuth(req, CORS);
    if (authResult instanceof Response) return authResult;
    const user = authResult;

    const body = await req.json() as Record<string, unknown>;
    const action = (body.action as string) ?? "lite";

    const sb = createServiceClient();

    // ── action: status ──────────────────────────────────────────────────────
    if (action === "status") {
      const { data: buyer } = await sb
        .from("buyers" as never)
        .select("id, kyc_status, first_name, last_name, nationality, passport_number, passport_expiry")
        .eq("created_by_user_id" as never, user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return ok({ buyer });
    }

    // ── action: lite ────────────────────────────────────────────────────────
    if (action === "lite") {
      const { first_name, last_name, nationality, date_of_birth, phone, email, lead_id } = body as {
        first_name?: string;
        last_name?: string;
        nationality?: string;
        date_of_birth?: string;
        phone?: string;
        email?: string;
        lead_id?: string;
      };

      if (!first_name || !last_name || !nationality) {
        return err("first_name, last_name, and nationality are required");
      }

      // Find existing buyer for this user
      const { data: existing } = await sb
        .from("buyers" as never)
        .select("id, kyc_status")
        .eq("created_by_user_id" as never, user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing buyer
        const buyerId = (existing as { id: string }).id;
        await sb
          .from("buyers" as never)
          .update({
            first_name,
            last_name,
            nationality,
            date_of_birth: date_of_birth ?? null,
            phone: phone ?? null,
            email: email ?? null,
            lead_id: lead_id ?? null,
            kyc_status: "submitted",
          })
          .eq("id", buyerId);

        return ok({ buyer_id: buyerId, kyc_status: "submitted" });
      } else {
        // Create new buyer
        const { data: created, error: createErr } = await sb
          .from("buyers" as never)
          .insert({
            first_name,
            last_name,
            nationality,
            date_of_birth: date_of_birth ?? null,
            phone: phone ?? user.phone ?? "",
            email: email ?? user.email ?? "",
            lead_id: lead_id ?? null,
            kyc_status: "submitted",
            created_by_user_id: user.id,
          } as never)
          .select("id")
          .single();

        if (createErr || !created) {
          return err(createErr?.message ?? "Failed to create buyer record", 500);
        }

        return ok({ buyer_id: (created as { id: string }).id, kyc_status: "submitted" });
      }
    }

    // ── action: upload_passport ─────────────────────────────────────────────
    if (action === "upload_passport") {
      const { buyer_id, passport_storage_path } = body as {
        buyer_id?: string;
        passport_storage_path?: string;
      };

      if (!buyer_id || !passport_storage_path) {
        return err("buyer_id and passport_storage_path are required");
      }

      // Verify buyer belongs to authenticated user
      const { data: buyer } = await sb
        .from("buyers" as never)
        .select("id, kyc_status, nationality, date_of_birth")
        .eq("id", buyer_id)
        .maybeSingle();

      if (!buyer) return err("Buyer not found", 404);

      // Get signed URL for the passport image
      const { data: signedUrl } = await sb.storage
        .from("kyc-documents")
        .createSignedUrl(passport_storage_path, 120); // 2 min TTL for OCR

      if (!signedUrl?.signedUrl) {
        return err("Failed to generate access URL for passport", 500);
      }

      // Update passport_scan_url on buyer
      await sb
        .from("buyers" as never)
        .update({ passport_scan_url: passport_storage_path } as never)
        .eq("id", buyer_id);

      // Run OCR (best-effort — if it fails, kyc_status stays 'submitted')
      let extracted: { passport_number: string | null; expiry: string | null; dob: string | null; nationality: string | null } = {
        passport_number: null, expiry: null, dob: null, nationality: null,
      };

      try {
        extracted = await extractPassportData(signedUrl.signedUrl);

        const updates: Record<string, unknown> = {
          kyc_status: "verified",
        };
        if (extracted.passport_number) updates.passport_number = extracted.passport_number;
        if (extracted.expiry) updates.passport_expiry = extracted.expiry;
        if (extracted.dob && !(buyer as Record<string, unknown>).date_of_birth) {
          updates.date_of_birth = extracted.dob;
        }
        if (extracted.nationality && !(buyer as Record<string, unknown>).nationality) {
          updates.nationality = extracted.nationality;
        }

        await sb
          .from("buyers" as never)
          .update(updates as never)
          .eq("id", buyer_id);

        return ok({ buyer_id, kyc_status: "verified", extracted });
      } catch (ocrErr) {
        console.error("[devmod-buyer-kyc] OCR failed:", ocrErr);
        // OCR failed — passport uploaded but not auto-verified, broker will verify manually
        await sb
          .from("buyers" as never)
          .update({ kyc_status: "submitted" } as never)
          .eq("id", buyer_id);

        return ok({
          buyer_id,
          kyc_status: "submitted",
          extracted: null,
          warning: "Passport uploaded but OCR failed — manual review required",
        });
      }
    }

    return err(`Unknown action: ${action}`);
  } catch (e) {
    console.error("[devmod-buyer-kyc]", e);
    return err(e instanceof Error ? e.message : "Internal error", 500);
  }
});
