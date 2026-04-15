/**
 * Daily Reconciliation Cron
 *
 * Compares confirmed/completed orders against ledger_entries.
 * Flags discrepancies and notifies admin.
 *
 * Schedule: daily at 06:00 ICT (23:00 UTC previous day)
 * Invoke: POST /daily-reconciliation with service_role key
 */

import { createServiceClient } from "../_shared/supabase.ts";
import { getAdminEmails } from "../_shared/admin-config.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROUNDING_TOLERANCE = 1; // 1 THB tolerance for rounding differences

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    console.log(`[daily-reconciliation] Starting reconciliation run for ${today}`);

    // Check if reconciliation already ran today
    const { data: existingRun } = await supabase
      .from("reconciliation_alerts")
      .select("id")
      .eq("run_date", today)
      .limit(1);

    if (existingRun && existingRun.length > 0) {
      console.log("[daily-reconciliation] Already ran today, skipping");
      return new Response(
        JSON.stringify({ message: "Already ran today", run_date: today }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    // 1. Get all confirmed/completed orders from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, order_number, order_type, total_amount, currency, status, paid_at")
      .in("status", ["confirmed", "completed", "checked_out"])
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[daily-reconciliation] Failed to fetch orders:", ordersError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch orders", details: ordersError.message }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (!orders || orders.length === 0) {
      console.log("[daily-reconciliation] No confirmed orders in last 30 days");
      return new Response(
        JSON.stringify({ message: "No orders to reconcile", run_date: today }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    console.log(`[daily-reconciliation] Found ${orders.length} confirmed/completed orders`);

    // 2. Get all ledger entries for these orders
    const orderIds = orders.map((o) => o.id);
    const { data: ledgerEntries, error: ledgerError } = await supabase
      .from("ledger_entries")
      .select("order_id, amount, entry_type")
      .in("order_id", orderIds);

    if (ledgerError) {
      console.error("[daily-reconciliation] Failed to fetch ledger entries:", ledgerError.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch ledger entries", details: ledgerError.message }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 500 },
      );
    }

    // 3. Group ledger entries by order_id
    const ledgerByOrder = new Map<string, { total: number; entries: number }>();
    for (const entry of ledgerEntries || []) {
      if (!entry.order_id) continue;
      const existing = ledgerByOrder.get(entry.order_id) || { total: 0, entries: 0 };
      existing.total += Number(entry.amount) || 0;
      existing.entries += 1;
      ledgerByOrder.set(entry.order_id, existing);
    }

    // 4. Compare and find discrepancies
    const alerts: Array<{
      alert_type: string;
      order_id: string;
      order_amount: number | null;
      ledger_amount: number | null;
      difference: number | null;
      details: Record<string, unknown>;
      run_date: string;
    }> = [];

    for (const order of orders) {
      const ledger = ledgerByOrder.get(order.id);

      if (!ledger) {
        // Missing ledger entries for a confirmed order
        alerts.push({
          alert_type: "missing_ledger",
          order_id: order.id,
          order_amount: order.total_amount,
          ledger_amount: null,
          difference: null,
          details: {
            order_number: order.order_number,
            order_type: order.order_type,
            status: order.status,
            currency: order.currency,
            paid_at: order.paid_at,
          },
          run_date: today,
        });
      } else {
        // Check amount mismatch (allow rounding tolerance)
        const diff = Math.abs(Number(order.total_amount) - ledger.total);
        if (diff > ROUNDING_TOLERANCE) {
          alerts.push({
            alert_type: "amount_mismatch",
            order_id: order.id,
            order_amount: order.total_amount,
            ledger_amount: ledger.total,
            difference: diff,
            details: {
              order_number: order.order_number,
              order_type: order.order_type,
              ledger_entry_count: ledger.entries,
              currency: order.currency,
            },
            run_date: today,
          });
        }
      }
    }

    console.log(`[daily-reconciliation] Found ${alerts.length} discrepancies`);

    // 5. Insert alerts if any
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from("reconciliation_alerts")
        .insert(alerts);

      if (insertError) {
        console.error("[daily-reconciliation] Failed to insert alerts:", insertError.message);
      }
    }

    // 6. Notify admin if discrepancies found
    if (alerts.length > 0) {
      const missingCount = alerts.filter((a) => a.alert_type === "missing_ledger").length;
      const mismatchCount = alerts.filter((a) => a.alert_type === "amount_mismatch").length;

      const adminEmails = await getAdminEmails();
      const resendKey = Deno.env.get("RESEND_API_KEY");

      if (resendKey && adminEmails.length > 0) {
        const subject = `⚠️ myUNO Reconciliation: ${alerts.length} issue${alerts.length > 1 ? "s" : ""} found`;
        const body = [
          `Daily reconciliation for ${today} found ${alerts.length} discrepancies:`,
          "",
          missingCount > 0 ? `• ${missingCount} orders missing ledger entries` : "",
          mismatchCount > 0 ? `• ${mismatchCount} orders with amount mismatches` : "",
          "",
          `Total orders checked: ${orders.length}`,
          `Healthy: ${orders.length - alerts.length}`,
          "",
          "Review at: https://myuno.app/admin/finance",
        ].filter(Boolean).join("\n");

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "myUNO System <noreply@myuno.app>",
              to: adminEmails,
              subject,
              text: body,
            }),
          });
          console.log("[daily-reconciliation] Admin notification sent");
        } catch (emailError) {
          console.error("[daily-reconciliation] Failed to send notification:", emailError);
        }
      }
    }

    // 7. Response
    const summary = {
      run_date: today,
      orders_checked: orders.length,
      healthy: orders.length - alerts.length,
      missing_ledger: alerts.filter((a) => a.alert_type === "missing_ledger").length,
      amount_mismatch: alerts.filter((a) => a.alert_type === "amount_mismatch").length,
      is_clean: alerts.length === 0,
    };

    console.log("[daily-reconciliation] Complete:", JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[daily-reconciliation] Error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" }, status: 500 },
    );
  }
});
