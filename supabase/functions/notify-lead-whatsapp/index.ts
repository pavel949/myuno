 // Deno.serve used (native edge runtime)
 import { createClient } from "../_shared/supabase.ts";
 import { getAdminWhatsApp } from "../_shared/admin-config.ts";
 import { NOTIFY_CORS as corsHeaders } from "../_shared/notify-utils.ts";
 import { requireServiceCaller } from "../_shared/internal-secret.ts";

 const FRESH_LEAD_MS = 10 * 60 * 1000;
 const notified = new Set<string>();
 const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
 
 interface LeadNotificationRequest {
   leadId: string;
 }
 
 Deno.serve(async (req) => {
   // Handle CORS preflight
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const { leadId } = (await req.json()) as LeadNotificationRequest;
 
     if (!leadId) {
       return new Response(
         JSON.stringify({ error: "Lead ID is required" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Fetch the lead details
     const { data: lead, error: leadError } = await supabase
       .from("consultation_requests")
       .select("*")
       .eq("id", leadId)
       .single();
 
     if (leadError || !lead) {
       console.error("Lead not found");
       return new Response(
         JSON.stringify({ error: "Lead not found" }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Browser callers may only trigger the one-time alert for a lead that was
     // just created; replaying old lead IDs is refused. Recipients are fixed
     // internal admin channels, never caller-chosen.
     const isService = (await requireServiceCaller(req, corsHeaders)) === null;
     if (!isService) {
       const createdAt = Date.parse(String(lead.created_at ?? ""));
       if (!Number.isFinite(createdAt) || Date.now() - createdAt > FRESH_LEAD_MS || notified.has(leadId)) {
         return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
       }
     }
     notified.add(leadId);

     // Durable one-time guard (survives cold starts / multiple instances).
     const { data: priorNotice } = await supabase
       .from("booking_notifications_log")
       .select("id")
       .eq("notification_type", "lead_whatsapp_admin")
       .contains("metadata", { lead_id: leadId })
       .limit(1)
       .maybeSingle();
     if (priorNotice && !isService) {
       return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
     }
     await supabase.from("booking_notifications_log").insert({
       notification_type: "lead_whatsapp_admin",
       channel: "whatsapp",
       sent_at: new Date().toISOString(),
       metadata: { lead_id: leadId },
     });

     // Only process home_services leads for now
     if (lead.vertical_id !== "home_services") {
       return new Response(
         JSON.stringify({ message: "Not a home services lead, skipping" }),
         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Extract metadata
     const metadata = lead.vertical_metadata || {};
     const functionNameEn = metadata.function_name_en || "Unknown Service";
     const functionNameRu = metadata.function_name_ru || "Неизвестная услуга";
     const basePrice = metadata.base_price || "N/A";
     const currency = metadata.currency || "THB";
     const estimatedTime = metadata.estimated_time || "N/A";
     const serviceAddress = metadata.service_address || "Not specified";
     const preferredDate = metadata.preferred_date || "Flexible";
     const preferredTime = metadata.preferred_time || "Any";
 
     // Format the WhatsApp message
     const message = `🛠️ *НОВАЯ ЗАЯВКА: ДОМАШНИЕ УСЛУГИ*
 
 📋 *Услуга:* ${functionNameRu} / ${functionNameEn}
 💰 *Цена от:* ${currency === "THB" ? "฿" : currency}${basePrice}
 ⏱ *Время:* ${estimatedTime}
 
 👤 *Клиент:* ${lead.name}
 📱 *Телефон:* ${lead.phone}
 💬 *Связь:* ${lead.preferred_contact_method || "WhatsApp"}
 
 📍 *Адрес:* ${serviceAddress}
 📅 *Дата:* ${preferredDate}
 🕐 *Время:* ${preferredTime}
 
 📝 *Описание:*
 ${lead.notes || "Не указано"}
 
 🔗 Открыть: https://uno.ae/admin/consultations`;
 
     // Admin phone number from system_settings
     const adminPhone = await getAdminWhatsApp();
 
     // Send via WhatsApp Cloud API (placeholder - needs WHATSAPP_TOKEN secret)
     const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
     const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID");
 
     if (whatsappToken && whatsappPhoneId) {
       try {
         const whatsappResponse = await fetch(
           `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
           {
             method: "POST",
             headers: {
               Authorization: `Bearer ${whatsappToken}`,
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               messaging_product: "whatsapp",
               to: adminPhone,
               type: "text",
               text: { body: message },
             }),
           }
         );
 
         const whatsappResult = await whatsappResponse.json();
         console.info("WhatsApp API status:", whatsappResponse.status, Boolean(whatsappResult));
       } catch (waError) {
         console.error("WhatsApp API error:", waError);
       }
     } else {
       console.info("WhatsApp credentials not configured; message not sent.");
     }
 
     // Also send email notification via Resend as backup
     const resendApiKey = Deno.env.get("RESEND_API_KEY");
     if (resendApiKey) {
       try {
         const emailResponse = await fetch("https://api.resend.com/emails", {
           method: "POST",
           headers: {
             Authorization: `Bearer ${resendApiKey}`,
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             from: "UNO Notifications <notifications@uno.ae>",
             to: ["leads@uno.ae"],
             subject: `🛠️ Новая заявка: ${functionNameRu}`,
             html: `
               <h2>Новая заявка на домашнюю услугу</h2>
               <table style="border-collapse: collapse; width: 100%;">
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(functionNameRu)} / ${esc(functionNameEn)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Цена от</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(currency === "THB" ? "฿" : currency)}${esc(basePrice)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Время работы</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(estimatedTime)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Клиент</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(lead.name)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(lead.phone)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Связь</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(lead.preferred_contact_method || "WhatsApp")}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Адрес</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(serviceAddress)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Дата</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(preferredDate)} / ${esc(preferredTime)}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Описание</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${esc(lead.notes || "Не указано")}</td></tr>
               </table>
               <p><a href="https://uno.ae/admin/consultations">Открыть в админке</a></p>
             `,
           }),
         });
 
         const emailResult = await emailResponse.json();
         console.info("Email status:", emailResponse.status, Boolean(emailResult));
       } catch (emailError) {
         console.error("Email error:", emailError);
       }
     }
 
     return new Response(
       JSON.stringify({ success: true, leadId }),
       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error processing lead notification:", error);
     return new Response(
       JSON.stringify({ error: "Internal server error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });