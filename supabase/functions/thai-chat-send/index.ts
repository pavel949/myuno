/**
 * thai-chat-send — send a message in a Thai-business chat with auto-translation.
 *
 * Stores BOTH the original text and a translation in the recipient's language so
 * each side reads in their own language (customer ↔ business owner, RU ↔ TH/EN).
 * Resolves/creates the per-(business, customer) thread, persists the message,
 * bumps the thread timestamp, and fires `thai-notify` (best-effort).
 *
 * Target language rule: a Russian message is translated to Thai (owner reads TH);
 * anything else (TH/EN from the owner) is translated to Russian (customer reads RU).
 *
 * Body: { chatId?, businessId, text, senderLang, isImage?, imageUrl? }
 */
import { createClient, createServiceClient } from "../_shared/supabase.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

type Lang = "ru" | "th" | "en";
const LANG_NAMES: Record<Lang, string> = { ru: "Russian", th: "Thai", en: "English" };
const DEFAULT_MODEL = "google/gemini-2.5-flash";

async function translate(text: string, targetLang: Lang): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !text.trim()) return text;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: `You are a professional translator. Translate the user's text to ${LANG_NAMES[targetLang]}. Respond with ONLY the translated text, nothing else. Preserve formatting.` },
          { role: "user", content: text },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[thai-chat-send] translation gateway error:", res.status);
      return text; // fail open — never block the message on translation
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (e) {
    console.error("[thai-chat-send] translation error:", e);
    return text;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──
    let userId: string | undefined;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data: { user } } = await anon.auth.getUser(authHeader.slice(7));
      userId = user?.id;
    }
    if (!userId) return json({ error: "Unauthorized" }, 401, corsHeaders);

    // ── Rate limit ──
    const limited = await withRateLimit(req, "thai-chat-send", RATE_LIMITS.ai, corsHeaders, userId);
    if (limited) return limited;

    const { chatId, businessId, text, senderLang = "ru", isImage = false, imageUrl } = await req.json();
    if (!text && !isImage) return json({ error: "text required" }, 400, corsHeaders);
    const lang = (["ru", "th", "en"].includes(senderLang) ? senderLang : "ru") as Lang;

    const sb = createServiceClient();

    // ── Resolve chat + membership ──
    let chat: { id: string; business_id: string; customer_id: string } | null = null;
    if (chatId) {
      const { data } = await sb.from("thai_chats").select("id, business_id, customer_id").eq("id", chatId).maybeSingle();
      chat = data;
    }
    let bizId = chat?.business_id ?? businessId;
    if (!bizId) return json({ error: "businessId required" }, 400, corsHeaders);

    const { data: business } = await sb.from("thai_businesses").select("id, owner_id").eq("id", bizId).maybeSingle();
    if (!business) return json({ error: "business not found" }, 404, corsHeaders);
    const senderIsOwner = userId === business.owner_id;

    if (!chat) {
      // Customer-initiated: thread keyed on (business, customer). Owners must pass chatId.
      if (senderIsOwner) return json({ error: "chatId required for owner replies" }, 400, corsHeaders);
      const { data: existing } = await sb
        .from("thai_chats").select("id, business_id, customer_id")
        .eq("business_id", bizId).eq("customer_id", userId).maybeSingle();
      if (existing) {
        chat = existing;
      } else {
        const { data: created, error } = await sb
          .from("thai_chats").insert({ business_id: bizId, customer_id: userId }).select("id, business_id, customer_id").single();
        if (error) throw error;
        chat = created;
      }
    }

    // Membership check (owner of the business OR the chat's customer).
    if (!senderIsOwner && chat.customer_id !== userId) {
      return json({ error: "Forbidden" }, 403, corsHeaders);
    }

    // ── Translate to the recipient's language ──
    const targetLang: Lang = lang === "ru" ? "th" : "ru";
    const translated = isImage ? "" : await translate(text ?? "", targetLang);

    // ── Persist message + bump thread ──
    const { data: message, error: msgErr } = await sb
      .from("thai_chat_messages")
      .insert({
        chat_id: chat.id,
        sender_id: userId,
        text_original: text ?? "",
        lang_original: lang,
        text_translated: translated,
        lang_target: targetLang,
        is_image: isImage,
        image_url: imageUrl ?? null,
      })
      .select("*")
      .single();
    if (msgErr) throw msgErr;

    await sb.from("thai_chats").update({ last_message_at: new Date().toISOString() }).eq("id", chat.id);

    // ── Fire notification (best-effort, non-blocking) ──
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/thai-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ kind: "new_message", messageId: message.id }),
    }).catch((e) => console.error("[thai-chat-send] notify dispatch failed:", e));

    return json({ message, chatId: chat.id }, 200, corsHeaders);
  } catch (error) {
    console.error("[thai-chat-send] error:", error);
    return json({ error: error instanceof Error ? error.message : "unknown" }, 500, corsHeaders);
  }
});

function json(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
