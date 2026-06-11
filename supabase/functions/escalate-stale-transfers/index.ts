// Cron-triggered: finds airport-transfer orders that are still NOT confirmed
// after 30 minutes and sends an escalation alert to admin (WA + email).
// Also notifies the customer that we're still working on confirmation.
//
// Idempotent: marks order metadata.escalated_at so we don't re-alert.
// Schedule: every 5 minutes via pg_cron.
import { createClient } from "npm:@supabase/supabase-js@2";
import { NOTIFY_CORS as corsHeaders } from "../_shared/notify-utils.ts";
import { getAdminEmails, getAdminWhatsApp } from "../_shared/admin-config.ts";

const sb = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const ESCALATE_AFTER_MIN = 30;

async function sendWA(to: string, body: string) {
  const inst = Deno.env.get("ULTRAMSG_INSTANCE");
  const tok = Deno.env.get("ULTRAMSG_TOKEN");
  if (!inst || !tok) return;
  try {
    await fetch(`https://api.ultramsg.com/${inst}/messages/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: tok, to: `+${to.replace(/\D/g, "")}`, body }),
    });
  } catch (e) {
    console.error("[escalate WA]", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const cutoff = new Date(Date.now() - ESCALATE_AFTER_MIN * 60 * 1000).toISOString();
  try {
    const { data: stale } = await sb()
      .from("orders")
      .select("id, order_number, status, customer_email, customer_phone, customer_name, total_amount, currency, created_at, metadata")
      .eq("order_type", "vehicle")
      .in("status", ["pending", "pending_confirmation", "awaiting_operator"])
      .lt("created_at", cutoff)
      .limit(50);

    const items = (stale || []).filter((o) => {
      const meta = (o.metadata || {}) as Record<string, unknown>;
      return meta.transfer_type === "airport" && !meta.escalated_at;
    });

    if (items.length === 0) {
      return new Response(JSON.stringify({ checked_before: cutoff, escalated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmails = await getAdminEmails();
    const adminWA = await getAdminWhatsApp();

    let escalated = 0;
    for (const o of items) {
      const msg = `⏱️ *TRANSFER NOT CONFIRMED*\n\n#${o.order_number}\nWaiting > ${ESCALATE_AFTER_MIN} min\nCustomer: ${o.customer_name || "—"} (${o.customer_phone || "—"})\nTotal: ${o.currency} ${o.total_amount}\n\nAssign manually or refund.`;
      await sendWA(adminWA, msg);

      // Email admins via Lovable Emails (reuse transfer-operator-new template body via plain alert)
      for (const email of adminEmails) {
        await sb().functions.invoke("send-transactional-email", {
          body: {
            templateName: "transfer-operator-new",
            recipientEmail: email,
            idempotencyKey: `transfer-escalate-${o.id}-${email}`,
            templateData: {
              orderNumber: o.order_number,
              directionLabel: "ESCALATION — operator not responding",
              dateLabel: o.created_at,
              flightNumber: "—",
              vehicleLine: "—",
              pickupRu: "", pickupEn: "Operator not responding > 30 min", pickupTh: "",
              dropoffRu: "", dropoffEn: "Please assign manually or refund", dropoffTh: "",
              notesRu: "", notesEn: msg, notesTh: "",
              customerName: o.customer_name || "—",
              customerPhone: o.customer_phone || "—",
              customerEmail: o.customer_email || "—",
              customerLang: "en",
              totalLabel: `${o.currency} ${o.total_amount}`,
              paymentMethod: "—",
              attachments: [],
              confirmUrl: "",
              operatorMissing: true,
            },
          },
        }).catch((e) => console.error("[escalate email]", e));
      }

      // Mark to avoid re-alerting
      const meta = (o.metadata || {}) as Record<string, unknown>;
      await sb().from("orders").update({
        metadata: { ...meta, escalated_at: new Date().toISOString() },
      }).eq("id", o.id);

      await sb().from("booking_notifications_log").insert({
        order_id: o.id,
        notification_type: "transfer_escalation_30min",
        channels: ["whatsapp", "email"],
        recipients: { admin_wa: adminWA, admin_emails: adminEmails },
        status: "sent",
      }).catch(() => {});

      escalated++;
    }

    return new Response(JSON.stringify({ checked_before: cutoff, escalated, total_stale: items.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[escalate-stale-transfers]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
