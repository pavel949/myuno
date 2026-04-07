/**
 * AI Outreach Agent - Automated vendor invitation & nurturing
 * 
 * Features:
 * - AI-personalized messages via Gemini
 * - Multi-channel delivery (Email via Resend, WhatsApp via UltraMSG)
 * - 3-stage follow-up sequence
 * - Automatic status tracking
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OutreachContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  category: string | null;
  outreach_status: string;
  outreach_sent_at: string | null;
}

interface OutreachResult {
  contact_id: string;
  channel: "email" | "whatsapp";
  success: boolean;
  error?: string;
}

const FOLLOW_UP_DELAYS_DAYS = [3, 7, 14]; // Days between follow-ups
const INVITE_URL = (Deno.env.get("SITE_URL") || "https://uno.ae") + "/vendor/join";

/**
 * Generate personalized message using Lovable AI (Gemini)
 */
async function generatePersonalizedMessage(
  contact: OutreachContact,
  sequence: number,
  channel: "email" | "whatsapp"
): Promise<{ subject?: string; body: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    // Fallback to template-based message
    return getTemplateMessage(contact, sequence, channel);
  }

  const sequenceContext = sequence === 1 
    ? "initial introduction" 
    : sequence === 2 
      ? "friendly follow-up" 
      : "final outreach";

  const prompt = `You are a business development assistant for myUNO, a premium concierge platform in Phuket, Thailand.

Generate a ${channel === "email" ? "professional email" : "WhatsApp message"} for a ${sequenceContext} to invite a potential vendor to join our platform.

Vendor details:
- Name: ${contact.first_name || ""} ${contact.last_name || ""}
- Company: ${contact.company_name || "their business"}
- Category: ${contact.category || "local services"}

Requirements:
- Be warm, professional, and concise
- Highlight benefits: access to high-net-worth clients, zero upfront costs, easy onboarding
- ${channel === "whatsapp" ? "Keep under 500 characters, use WhatsApp formatting (*bold*, _italic_)" : "Keep email body under 150 words"}
- ${sequence > 1 ? "Acknowledge this is a follow-up without being pushy" : ""}
- Include a call-to-action to visit: ${INVITE_URL}
- Write in English, but be culturally aware for Thailand market

${channel === "email" ? "Return JSON: {\"subject\": \"...\", \"body\": \"...\"}" : "Return JSON: {\"body\": \"...\"}"}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return getTemplateMessage(contact, sequence, channel);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return getTemplateMessage(contact, sequence, channel);
  } catch (err) {
    console.error("AI generation error:", err);
    return getTemplateMessage(contact, sequence, channel);
  }
}

/**
 * Fallback template messages
 */
function getTemplateMessage(
  contact: OutreachContact,
  sequence: number,
  channel: "email" | "whatsapp"
): { subject?: string; body: string } {
  const name = contact.first_name || contact.company_name || "there";
  const company = contact.company_name ? ` at ${contact.company_name}` : "";

  if (channel === "whatsapp") {
    if (sequence === 1) {
      return {
        body: `Hi ${name}! 👋\n\nI'm reaching out from *myUNO* — a premium concierge platform connecting local businesses with high-net-worth clients in Phuket.\n\nWe'd love to feature your services${company}. It's free to join and takes just 2 minutes.\n\n👉 ${INVITE_URL}\n\nHappy to answer any questions!`,
      };
    } else if (sequence === 2) {
      return {
        body: `Hi ${name}! Just following up on my previous message about myUNO 🌴\n\nWe're growing quickly and would love to have you on the platform. Our vendors are seeing great results with our premium client base.\n\nReady to get started? 👉 ${INVITE_URL}`,
      };
    } else {
      return {
        body: `Hi ${name}, final check-in! 🙂\n\nIf you're interested in reaching premium clients through myUNO, the door is always open:\n\n👉 ${INVITE_URL}\n\nWishing you continued success!`,
      };
    }
  }

  // Email templates
  if (sequence === 1) {
    return {
      subject: `Join myUNO — Connect with Premium Clients in Phuket`,
      body: `<p>Hi ${name},</p>
<p>I'm reaching out from myUNO, a premium concierge platform serving high-net-worth clients in Phuket.</p>
<p>We're building a curated network of the best local service providers${company ? `, and ${company} caught our attention` : ""}.</p>
<p><strong>Why join myUNO?</strong></p>
<ul>
<li>Access to affluent international clients</li>
<li>Zero upfront costs — we only succeed when you do</li>
<li>Simple 2-minute onboarding</li>
</ul>
<p><a href="${INVITE_URL}" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Join myUNO</a></p>
<p>Happy to answer any questions!</p>
<p>Best regards,<br>myUNO Team</p>`,
    };
  } else if (sequence === 2) {
    return {
      subject: `Quick follow-up: myUNO Partner Invitation`,
      body: `<p>Hi ${name},</p>
<p>I wanted to follow up on my previous email about joining myUNO.</p>
<p>We're seeing great traction with our vendor partners, and I think there's a real opportunity for ${contact.company_name || "your business"}.</p>
<p><a href="${INVITE_URL}" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Get Started</a></p>
<p>Let me know if you have any questions!</p>
<p>Best,<br>myUNO Team</p>`,
    };
  } else {
    return {
      subject: `Final invitation: Join myUNO's vendor network`,
      body: `<p>Hi ${name},</p>
<p>This is my final follow-up about joining myUNO's vendor network.</p>
<p>If you're interested in connecting with premium clients, the invitation remains open:</p>
<p><a href="${INVITE_URL}" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Join myUNO</a></p>
<p>Wishing you continued success!</p>
<p>Best regards,<br>myUNO Team</p>`,
    };
  }
}

/**
 * Send email via Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "myUNO <partners@updates.myuno.ai>",
        to: [to],
        subject,
        html: htmlBody,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Email] Send error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Error:", err);
    return false;
  }
}

/**
 * Process outreach for contacts
 */
async function processOutreach(
  supabase: ReturnType<typeof createServiceClient>,
  contacts: OutreachContact[],
  sequence: number
): Promise<OutreachResult[]> {
  const results: OutreachResult[] = [];

  for (const contact of contacts) {
    // Determine channel: prefer WhatsApp if phone available
    const channel: "email" | "whatsapp" = contact.phone ? "whatsapp" : "email";
    
    if (channel === "email" && !contact.email) {
      console.log(`[Outreach] Skipping ${contact.id} — no contact info`);
      continue;
    }

    // Generate personalized message
    const message = await generatePersonalizedMessage(contact, sequence, channel);

    let success = false;
    let error: string | undefined;

    if (channel === "whatsapp" && contact.phone) {
      success = await sendWhatsApp({ to: contact.phone, body: message.body });
      if (!success) error = "WhatsApp send failed";
    } else if (channel === "email" && contact.email) {
      success = await sendEmail(contact.email, message.subject!, message.body);
      if (!success) error = "Email send failed";
    }

    // Calculate next follow-up date
    const nextFollowupDays = FOLLOW_UP_DELAYS_DAYS[sequence - 1];
    const nextFollowupAt = sequence < 3 && nextFollowupDays
      ? new Date(Date.now() + nextFollowupDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Log outreach
    await supabase.from("vendor_outreach_log").insert({
      contact_id: contact.id,
      channel,
      status: success ? "sent" : "failed",
      followup_sequence: sequence,
      message_content: message.body,
      subject: message.subject,
      error_message: error,
      next_followup_at: nextFollowupAt,
    });

    // Update contact status
    const outreachStatus = sequence === 1 
      ? "contacted" 
      : `follow_up_${sequence - 1}` as "follow_up_1" | "follow_up_2" | "follow_up_3";

    await supabase.from("crm_contacts").update({
      outreach_status: outreachStatus,
      outreach_sent_at: new Date().toISOString(),
      outreach_channel: channel,
    }).eq("id", contact.id);

    results.push({ contact_id: contact.id, channel, success, error });

    // Small delay between sends to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();
    const body = await req.json().catch(() => ({}));
    const { action = "initial", limit = 10 } = body;

    let contacts: OutreachContact[] = [];
    let sequence = 1;

    if (action === "initial") {
      // Get contacts that haven't been contacted yet
      const { data } = await supabase
        .from("crm_contacts")
        .select("id, first_name, last_name, company_name, email, phone, category, outreach_status, outreach_sent_at")
        .eq("contact_type", "vendor")
        .eq("outreach_status", "not_contacted")
        .not("email", "is", null)
        .limit(limit);

      contacts = (data || []) as OutreachContact[];
      sequence = 1;
    } else if (action === "followup") {
      // Get contacts due for follow-up
      const { data: dueFollowups } = await supabase
        .from("vendor_outreach_log")
        .select(`
          contact_id,
          followup_sequence,
          crm_contacts!inner(
            id, first_name, last_name, company_name, email, phone, category, outreach_status, outreach_sent_at
          )
        `)
        .lte("next_followup_at", new Date().toISOString())
        .in("status", ["sent", "delivered", "opened"])
        .lt("followup_sequence", 3)
        .order("next_followup_at", { ascending: true })
        .limit(limit);

      if (dueFollowups && dueFollowups.length > 0) {
        // Get the next sequence based on the last one sent
        sequence = (dueFollowups[0].followup_sequence || 1) + 1;
        contacts = dueFollowups.map((f: any) => f.crm_contacts) as OutreachContact[];
      }
    }

    if (contacts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: action === "initial" ? "No new contacts to reach" : "No follow-ups due",
          processed: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Outreach] Processing ${contacts.length} contacts (sequence ${sequence})`);

    const results = await processOutreach(supabase, contacts, sequence);
    const successful = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        action,
        processed: results.length,
        successful,
        failed: results.length - successful,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Outreach] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
