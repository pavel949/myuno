/** Scheduled service-only worker. Invoke with Authorization: Bearer <WORKER_SECRET>.
 * Requires help_notification_outbox migration and configured admin contacts.
 * Provider acceptance is not end-user delivery confirmation.
 */
import { createServiceClient } from "../_shared/supabase.ts";
import { getConfiguredAdminContacts, getMailFrom } from "../_shared/admin-config.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

Deno.serve(async (req) => {
  const expected = Deno.env.get("HELP_NOTIFICATION_WORKER_SECRET");
  if (!expected || req.headers.get("Authorization") !== `Bearer ${expected}`) {
    return new Response("unauthorized", { status: 401 });
  }
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  const sb = createServiceClient();
  const { data: jobs, error } = await sb.rpc("claim_help_notifications");
  if (error) return new Response("claim_failed", { status: 503 });
  let accepted = 0, rejected = 0;
  for (const job of jobs ?? []) {
    let outcome = "rejected", reference: string | null = null;
    try {
      const { data: lead, error: readError } = await sb.from("help_requests")
        .select("id,topic,subject,message,urgency,contact_email,contact_phone,source_route")
        .eq("id", job.request_id).single();
      if (readError || !lead) throw new Error("lead_unavailable");
      const contacts = await getConfiguredAdminContacts();
      const body = [
        "myUNO / Ignatev Estate", `ID: ${lead.id}`, `Topic: ${lead.topic}`,
        `Subject: ${lead.subject || ""}`, `Urgency: ${lead.urgency}`,
        `Email: ${lead.contact_email || ""}`, `Phone: ${lead.contact_phone || ""}`,
        `Source: ${lead.source_route || ""}`, lead.message,
      ].join("\n");
      if (job.channel === "whatsapp") {
        if (!contacts.whatsapp) throw new Error("whatsapp_unconfigured");
        if (!await sendWhatsApp({ to: contacts.whatsapp, body })) throw new Error("whatsapp_not_accepted");
        reference = "ultramsg_http_accepted";
      } else {
        const key = Deno.env.get("RESEND_API_KEY");
        if (!key || !contacts.emails.length) throw new Error("email_unconfigured");
        const sender = await getMailFrom();
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: sender, to: contacts.emails,
            subject: `[myUNO / Ignatev Estate] ${lead.topic}: ${lead.id}`,
            text: body, reply_to: lead.contact_email || undefined }),
        });
        if (!response.ok) throw new Error(`resend_http_${response.status}`);
        const result = await response.json().catch(() => ({}));
        reference = String(result.id || "resend_http_accepted");
      }
      outcome = "accepted";
      accepted++;
    } catch (error) {
      console.error("help notification failed", job.job_id, String(error));
      rejected++;
    }
    const { data: finished, error: finishError } = await sb.rpc("finish_help_notification", {
      p_id: job.job_id, p_token: job.lease_token, p_outcome: outcome, p_reference: reference,
    });
    if (finishError || !finished) console.error("help notification finish uncertain", job.job_id, finishError);
  }
  return Response.json({ claimed: (jobs ?? []).length, accepted, rejected });
});
