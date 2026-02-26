import { createServiceClient } from "../_shared/supabase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret for cron calls
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = Deno.env.get("INTERNAL_SECRET");
    if (expectedSecret && internalSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceClient();
    const resendKey = Deno.env.get("RESEND_API_KEY");

    // Get last month range
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = firstOfLastMonth.toISOString().slice(0, 10);
    const lastMonthEnd = new Date(firstOfThisMonth.getTime() - 86400000).toISOString().slice(0, 10);

    const monthName = firstOfLastMonth.toLocaleString("ru-RU", { month: "long", year: "numeric" });

    // Get all properties with owners
    const { data: properties, error: propErr } = await supabase
      .from("owner_properties")
      .select("id, title, title_ru, owner_id");

    if (propErr || !properties?.length) {
      return new Response(JSON.stringify({ message: "No properties found", error: propErr }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by owner
    const ownerProperties: Record<string, typeof properties> = {};
    for (const p of properties) {
      if (!p.owner_id) continue;
      if (!ownerProperties[p.owner_id]) ownerProperties[p.owner_id] = [];
      ownerProperties[p.owner_id].push(p);
    }

    let sentCount = 0;

    for (const [ownerId, props] of Object.entries(ownerProperties)) {
      const propIds = props.map((p) => p.id);

      // Fetch financials for last month
      const { data: financials } = await supabase
        .from("property_financials")
        .select("amount, transaction_type, property_id")
        .in("property_id", propIds)
        .gte("transaction_date", lastMonthStart)
        .lte("transaction_date", lastMonthEnd);

      const totalIncome = (financials || [])
        .filter((f: any) => f.transaction_type === "income")
        .reduce((s: number, f: any) => s + (f.amount || 0), 0);
      const totalExpense = (financials || [])
        .filter((f: any) => f.transaction_type === "expense")
        .reduce((s: number, f: any) => s + (f.amount || 0), 0);

      // Fetch bookings
      const { data: bookings } = await supabase
        .from("property_bookings")
        .select("id")
        .in("property_id", propIds)
        .gte("check_in_date", lastMonthStart)
        .lte("check_in_date", lastMonthEnd);

      const bookingCount = bookings?.length || 0;

      // Get owner email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", ownerId)
        .single();

      if (!profile?.email || !resendKey) continue;

      // Send email via Resend
      const emailBody = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px;">
          <h1 style="font-size: 20px; color: #1a1a1a;">📊 Отчёт за ${monthName}</h1>
          <p style="color: #666;">Здравствуйте, ${profile.full_name || ""}!</p>
          <p style="color: #666;">Вот краткая сводка по вашим объектам за прошедший месяц:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #16a34a;">฿${totalIncome.toLocaleString()}</div>
                <div style="font-size: 12px; color: #666;">Доход</div>
              </td>
              <td style="width: 12px;"></td>
              <td style="padding: 12px; background: #fef2f2; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc2626;">฿${totalExpense.toLocaleString()}</div>
                <div style="font-size: 12px; color: #666;">Расходы</div>
              </td>
            </tr>
          </table>
          
          <p style="color: #666;">
            <strong>Объектов:</strong> ${props.length}<br/>
            <strong>Бронирований:</strong> ${bookingCount}<br/>
            <strong>Чистая прибыль:</strong> ฿${(totalIncome - totalExpense).toLocaleString()}
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            Подробности — в вашем личном кабинете myUNO.
          </p>
        </div>
      `;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "myUNO <noreply@ignatevestate.com>",
          to: [profile.email],
          subject: `📊 Отчёт за ${monthName} — myUNO`,
          html: emailBody,
        }),
      });

      const resBody = await res.text();
      console.log(`Email to ${profile.email}: ${res.status}`, resBody);

      if (res.ok) {
        sentCount++;
        // Log as notification
        await supabase.from("owner_notifications").insert(
          propIds.map((pid: string) => ({
            owner_id: ownerId,
            property_id: pid,
            type: "monthly_report",
            title: `Месячный отчёт за ${monthName}`,
            body: `Доход: ฿${totalIncome.toLocaleString()}, Расходы: ฿${totalExpense.toLocaleString()}`,
          }))
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Digest error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
