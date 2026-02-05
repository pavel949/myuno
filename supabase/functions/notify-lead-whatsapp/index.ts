 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "../_shared/supabase.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface LeadNotificationRequest {
   leadId: string;
 }
 
 serve(async (req) => {
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
       console.error("Lead not found:", leadError);
       return new Response(
         JSON.stringify({ error: "Lead not found" }),
         { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
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
 
     // Admin phone number (Thailand format)
     const adminPhone = "66922407355";
 
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
         console.log("WhatsApp API response:", whatsappResult);
       } catch (waError) {
         console.error("WhatsApp API error:", waError);
       }
     } else {
       console.log("WhatsApp credentials not configured. Message to send:");
       console.log(message);
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
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Услуга</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${functionNameRu} / ${functionNameEn}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Цена от</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${currency === "THB" ? "฿" : currency}${basePrice}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Время работы</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${estimatedTime}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Клиент</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.name}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Телефон</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.phone}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Связь</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.preferred_contact_method || "WhatsApp"}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Адрес</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${serviceAddress}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Дата</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${preferredDate} / ${preferredTime}</td></tr>
                 <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Описание</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.notes || "Не указано"}</td></tr>
               </table>
               <p><a href="https://uno.ae/admin/consultations">Открыть в админке</a></p>
             `,
           }),
         });
 
         const emailResult = await emailResponse.json();
         console.log("Email sent:", emailResult);
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