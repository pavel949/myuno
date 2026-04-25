import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

/**
 * Guest Referral Engine — triggered after positive checkout
 * 
 * 1. Finds guests who checked out with high ratings
 * 2. Generates unique referral code
 * 3. Sends referral invite email via Resend
 * 4. Creates cross-sell suggestions for high-value guests
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;

    const supabase = createServiceClient();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
    const results = { referrals_created: 0, cross_sells: 0, emails_sent: 0 };

    // 1. Find completed bookings from yesterday without referral codes
    const { data: completedBookings } = await supabase
      .from("property_bookings")
      .select("id, guest_user_id, guest_name, guest_email, property_id, total_amount, check_out")
      .eq("check_out", yesterday)
      .in("status", ["completed", "checked_out"])
      .limit(50);

    if (!completedBookings?.length) {
      return new Response(
        JSON.stringify({ success: true, message: "No completed bookings yesterday", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    for (const booking of completedBookings) {
      if (!booking.guest_user_id) continue;

      // Check if referral already exists
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("id")
        .eq("booking_id", booking.id)
        .single();

      if (existing) continue;

      // Generate unique code
      const code = `UNO-${booking.guest_name?.split(" ")[0]?.toUpperCase().slice(0, 4) || "GUEST"}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Create referral code
      const { error: refErr } = await supabase.from("referral_codes").insert({
        guest_user_id: booking.guest_user_id,
        booking_id: booking.id,
        referral_code: code,
        discount_percent: 10,
        max_uses: 5,
        expires_at: new Date(now.getTime() + 90 * 86400000).toISOString(), // 90 days
      });

      if (!refErr) results.referrals_created++;

      // Send referral email
      if (RESEND_API_KEY && booking.guest_email) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "myUNO <notify@www.myuno.app>",
              to: [booking.guest_email],
              subject: "Share the Love — Get 10% Off Your Next Stay! 🌴",
              html: `
                <div style="font-family:'Inter',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;">
                  <h1 style="font-size:22px;color:#1a1a2e;margin:0 0 16px;">Thank you for staying with us!</h1>
                  <p style="font-size:15px;color:#4a4a6a;line-height:1.6;">
                    We hope you enjoyed your stay. Share this code with friends and family — they'll get <strong>10% off</strong> their first booking, and you'll earn rewards too!
                  </p>
                  <div style="background:#f0f4ff;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                    <p style="font-size:12px;color:#6b7280;margin:0 0 8px;">YOUR REFERRAL CODE</p>
                    <p style="font-size:28px;font-weight:700;color:#2563eb;margin:0;letter-spacing:2px;">${code}</p>
                  </div>
                  <p style="font-size:13px;color:#9ca3af;text-align:center;">Valid for 90 days • Up to 5 uses</p>
                  <p style="font-size:12px;color:#9ca3af;margin-top:32px;text-align:center;">myUNO — Your lifestyle concierge in Thailand</p>
                </div>
              `,
            }),
          });

          if (emailRes.ok) results.emails_sent++;
        } catch (emailErr) {
          console.error("Referral email failed:", emailErr);
        }
      }

      // Cross-sell for high-value guests (> 50,000 THB)
      if ((booking.total_amount || 0) > 50000) {
        await supabase.from("ai_task_suggestions").insert({
          title: `High-value guest: ${booking.guest_name} — explore investment interest`,
          description: `Guest spent ${booking.total_amount} THB. Consider reaching out about property investment or long-term rental.`,
          priority: "medium",
          action_type: "followup",
          impact_score: 70,
          target_entity_type: "booking",
          target_entity_id: booking.id,
          status: "pending",
          source_agent: "guest-referral-engine",
        });
        results.cross_sells++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("guest-referral-engine error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
