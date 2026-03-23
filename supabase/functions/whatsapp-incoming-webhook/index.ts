/**
 * WhatsApp Incoming Webhook
 * 
 * Receives incoming WhatsApp messages from UltraMSG webhook.
 * Auto-creates a lead in consultation_requests and notifies Pavel.
 * 
 * UltraMSG webhook payload: { from, body, pushName, ... }
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

const ADMIN_PHONE = Deno.env.get("ADMIN_WHATSAPP_NUMBER") ?? "66922407355";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept both GET (UltraMSG verify) and POST (actual messages)
  if (req.method === "GET") {
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("[WhatsApp Incoming] Payload:", JSON.stringify(body));

    // UltraMSG sends: { event_type, data: { from, pushName, body, ... } }
    // Or direct: { from, body, pushName, ... }
    const msgData = body.data || body;
    const from = msgData.from || msgData.sender || "";
    const messageBody = msgData.body || msgData.message || "";
    const pushName = msgData.pushName || msgData.notifyName || "";
    const msgId = msgData.id || msgData.messageId || "";

    // Skip status updates, group messages, and empty messages
    if (!from || !messageBody || from.includes("@g.us")) {
      return new Response(
        JSON.stringify({ ok: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number (remove @c.us suffix from UltraMSG)
    const phone = from.replace("@c.us", "").replace("@s.whatsapp.net", "");
    const name = pushName || `WhatsApp ${phone}`;

    const supabase = createServiceClient();

    // Check if we already have a recent lead from this phone (last 24h) to avoid duplicates
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLead } = await supabase
      .from("consultation_requests")
      .select("id, created_at")
      .eq("phone", phone)
      .eq("lead_source", "whatsapp_incoming")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingLead) {
      console.log(`[WhatsApp Incoming] Duplicate within 24h for ${phone}, skipping lead creation`);
      // Still notify admin about the follow-up message
      await sendWhatsApp({
        to: ADMIN_PHONE,
        body: `💬 *Повторное сообщение от клиента*\n\n👤 ${name}\n📱 ${phone}\n\n📝 ${messageBody.slice(0, 500)}`,
      });

      return new Response(
        JSON.stringify({ ok: true, duplicate: true, existing_lead_id: existingLead.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new lead in consultation_requests
    const { data: lead, error: leadError } = await supabase
      .from("consultation_requests")
      .insert({
        name,
        phone,
        request_type: "whatsapp_inquiry",
        vertical_id: "general",
        lead_source: "whatsapp_incoming",
        entry_point: "whatsapp_direct",
        preferred_contact_method: "whatsapp",
        preferred_language: "en",
        notes: messageBody.slice(0, 2000),
        status: "pending",
        priority: "high",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("[WhatsApp Incoming] Failed to create lead:", leadError);
      // Still notify admin even if DB insert fails
      await sendWhatsApp({
        to: ADMIN_PHONE,
        body: `⚠️ *Новое сообщение WhatsApp (не сохранено в CRM)*\n\n👤 ${name}\n📱 ${phone}\n\n📝 ${messageBody.slice(0, 500)}\n\n❌ Ошибка: ${leadError.message}`,
      });

      return new Response(
        JSON.stringify({ error: "Failed to create lead", detail: leadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WhatsApp Incoming] Lead created: ${lead.id} from ${phone}`);

    // Score lead and start nurture (fire-and-forget)
    EdgeRuntime.waitUntil((async () => {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/ai-owner-nurture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
            "x-internal-secret": Deno.env.get("INTERNAL_SECRET") ?? "",
          },
          body: JSON.stringify({ lead_id: lead.id, source: "whatsapp" }),
        });
      } catch (e) {
        console.error("[WhatsApp Incoming] nurture trigger failed:", e);
      }
    })());

    // Notify Pavel immediately
    const adminMessage = `📩 *НОВЫЙ ЛИД ИЗ WHATSAPP*

👤 *Имя:* ${name}
📱 *Телефон:* ${phone}
🕐 *Время:* ${new Date().toLocaleString("ru-RU", { timeZone: "Asia/Bangkok" })}

📝 *Сообщение:*
${messageBody.slice(0, 500)}

🔗 Открыть CRM: https://myuno.app/admin/crm`;

    await sendWhatsApp({ to: ADMIN_PHONE, body: adminMessage });

    // Also try to find if this person is an existing CRM contact
    const { data: existingContact } = await supabase
      .from("crm_contacts")
      .select("id, first_name, last_name, tags")
      .or(`phone.eq.${phone},phone.eq.+${phone}`)
      .limit(1)
      .maybeSingle();

    if (existingContact) {
      console.log(`[WhatsApp Incoming] Matched existing CRM contact: ${existingContact.id}`);
      // Add activity to existing contact
      await supabase.from("crm_activities").insert({
        contact_id: existingContact.id,
        activity_type: "whatsapp_received",
        subject: "Incoming WhatsApp message",
        notes: messageBody.slice(0, 1000),
        created_by: existingContact.id, // self-reference as system
      }).then(() => {}).catch(() => {});
    }

    // Send auto-reply to the customer
    const autoReply = `Hello ${pushName || ""}! 👋

Thank you for reaching out to *myUNO* — your concierge in Phuket.

Our team has received your message and will reply shortly.

For urgent matters, feel free to call us on WhatsApp.

---
Привет${pushName ? ` ${pushName}` : ""}! 👋

Спасибо за обращение в *myUNO* — ваш консьерж на Пхукете.

Наша команда получила ваше сообщение и скоро ответит.

По срочным вопросам — напишите нам напрямую.`;

    await sendWhatsApp({ to: phone, body: autoReply });

    return new Response(
      JSON.stringify({ ok: true, lead_id: lead.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[WhatsApp Incoming] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
