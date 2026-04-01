const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createServiceClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createServiceClient();

    // Find visa records expiring in 30, 14, or 7 days
    const today = new Date();
    const checkDays = [
      { days: 30, field: "reminder_sent_30d" },
      { days: 14, field: "reminder_sent_14d" },
      { days: 7, field: "reminder_sent_7d" },
    ];

    let totalSent = 0;

    for (const check of checkDays) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + check.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      const { data: records, error } = await supabase
        .from("visa_records")
        .select("id, user_id, visa_type, expiry_date")
        .eq("status", "active")
        .eq("expiry_date", dateStr)
        .eq(check.field, false);

      if (error) {
        console.error(`Error fetching records for ${check.days}d:`, error);
        continue;
      }

      if (!records || records.length === 0) continue;

      for (const record of records) {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(
          record.user_id
        );
        const email = userData?.user?.email;
        if (!email) continue;

        // Send reminder email via Resend
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "myUNO <noreply@myuno.app>",
                to: [email],
                subject: `⚠️ Visa expires in ${check.days} days`,
                html: `<h2>Visa Expiry Reminder</h2>
                  <p>Your <strong>${record.visa_type}</strong> visa expires on <strong>${record.expiry_date}</strong> — that's ${check.days} days from now.</p>
                  <p>Visit <a href="https://myuno.app/visa">VisaTrack</a> to manage your visa status.</p>
                  <p>— myUNO Team</p>`,
              }),
            });
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
          }
        }

        // Mark reminder as sent
        await supabase
          .from("visa_records")
          .update({ [check.field]: true })
          .eq("id", record.id);

        totalSent++;
      }
    }

    // Also mark expired visas
    const { error: expireError } = await supabase
      .from("visa_records")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expiry_date", today.toISOString().split("T")[0]);

    if (expireError) console.error("Expire update error:", expireError);

    return new Response(
      JSON.stringify({ success: true, reminders_sent: totalSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Visa reminder error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
