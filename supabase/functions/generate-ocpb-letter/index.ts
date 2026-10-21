/**
 * generate-ocpb-letter — generates a draft OCPB (Office of Consumer
 * Protection Board, Thailand) complaint letter for a paid dispute pack.
 *
 * Uses Lovable AI Gateway (Gemini) so no extra secrets are required.
 * The dispute pack must be in `status='paid'` and owned by the caller.
 *
 * Trust Stack v1.0 §3 A-3 · §9 disclaimer applied automatically.
 */

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface Body { disputePackId?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Sign in required" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Invalid session" }, 401);

    const { disputePackId } = (await req.json()) as Body;
    if (!disputePackId) return json({ error: "disputePackId is required" }, 400);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: pack, error: packErr } = await admin
      .from("dispute_packs")
      .select("*")
      .eq("id", disputePackId)
      .eq("user_id", user.id)
      .single();
    if (packErr || !pack) return json({ error: "Dispute pack not found" }, 404);
    if (pack.status === "pending") {
      return json({ error: "Payment not confirmed yet" }, 402);
    }
    if (pack.letter_text && pack.status === "generated") {
      return json({ letter: pack.letter_text, status: pack.status });
    }

    // Fetch vault + photos for evidence index
    const { data: vault } = await admin
      .from("deposit_vaults")
      .select("*")
      .eq("id", pack.vault_id)
      .maybeSingle();

    const { data: photos } = await admin
      .from("deposit_vault_photos")
      .select("phase, label, taken_at, lat, lng")
      .eq("vault_id", pack.vault_id)
      .order("taken_at");

    const isRu = (pack.language ?? "ru") === "ru";
    const systemPrompt = isRu
      ? `Ты юридический ассистент в Таиланде. Сгенерируй ЧЕРНОВИК жалобы в OCPB (Office of Consumer Protection Board) на удержание депозита арендодателем. Формат: официальное письмо на русском, с разделами: 1) Шапка (заявитель, дата, адресат — OCPB), 2) Фактические обстоятельства, 3) Ссылки на ст. ЗоЗПП Таиланда (B.E. 2522) и ст. 378 ГК Таиланда о депозите, 4) Требование вернуть депозит в 15-дневный срок, 5) Перечень доказательств (фото с timestamp). В конце добавь дисклеймер: "Это автоматически сгенерированный черновик. Перед подачей рекомендуем проверить у юриста (тариф — партнёрская юрфирма myUNO)." НЕ выдумывай номера документов и не делай оценочных обвинений.`
      : `You are a Thailand legal assistant. Generate a DRAFT complaint letter to the OCPB (Office of Consumer Protection Board) about a withheld rental deposit. Format: formal English letter with sections: 1) Header (claimant, date, addressee — OCPB), 2) Facts of the case, 3) References to Thailand Consumer Protection Act B.E. 2522 and Section 378 of the Thai Civil and Commercial Code on deposits, 4) Demand to return the deposit within 15 days, 5) Evidence index (timestamped photos). End with a disclaimer: "This is an auto-generated draft. Before filing, please have it reviewed by a lawyer (partner firm via myUNO)." Do NOT invent document numbers or make defamatory accusations.`;

    const userPrompt = JSON.stringify({
      claimant_email: user.email,
      property_address: vault?.property_address,
      landlord_name: pack.landlord_name ?? vault?.landlord_name,
      landlord_contact: pack.landlord_contact ?? vault?.landlord_contact,
      deposit_amount_thb: pack.deposit_amount_thb ?? vault?.deposit_amount_thb,
      checkin_at: vault?.checkin_at,
      checkout_at: vault?.checkout_at,
      complaint: pack.complaint_summary,
      evidence: (photos ?? []).map((p) => ({
        phase: p.phase,
        label: p.label,
        taken_at: p.taken_at,
        geo: p.lat && p.lng ? `${p.lat},${p.lng}` : null,
      })),
    });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const text = await aiResp.text();
      console.error("[generate-ocpb-letter] gateway error:", aiResp.status, text);
      if (aiResp.status === 429) return json({ error: "Rate limited, try again shortly" }, 429);
      if (aiResp.status === 402) return json({ error: "AI credits exhausted" }, 402);
      return json({ error: "AI generation failed" }, 500);
    }

    const aiData = await aiResp.json();
    const letter: string = aiData?.choices?.[0]?.message?.content ?? "";
    if (!letter) return json({ error: "Empty AI response" }, 500);

    await admin
      .from("dispute_packs")
      .update({
        letter_text: letter,
        letter_generated_at: new Date().toISOString(),
        status: "generated",
      })
      .eq("id", disputePackId);

    return json({ letter, status: "generated" });
  } catch (err) {
    console.error("[generate-ocpb-letter] unexpected:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
