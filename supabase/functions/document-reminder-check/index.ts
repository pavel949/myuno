import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabase = createServiceClient();
    const now = new Date();
    const results: any[] = [];

    // Find active reminders where expires_at is within any of the reminder_days_before windows
    const { data: reminders, error } = await supabase
      .from("document_reminders")
      .select("*")
      .eq("is_active", true)
      .gte("expires_at", now.toISOString().split("T")[0]);

    if (error) {
      console.error("Query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const reminder of (reminders || [])) {
      const expiresAt = new Date(reminder.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays: number[] = reminder.reminder_days_before || [30, 7, 1];

      // Check if we should notify for any threshold
      const shouldNotify = reminderDays.some((d: number) => daysUntilExpiry <= d);
      if (!shouldNotify) continue;

      // Check cooldown: don't notify more than once per day
      if (reminder.last_notified_at) {
        const lastNotified = new Date(reminder.last_notified_at);
        const hoursSinceNotify = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);
        if (hoursSinceNotify < 24) continue;
      }

      // Create notification
      const isUrgent = daysUntilExpiry <= 7;
      await supabase.from("notifications").insert({
        user_id: reminder.owner_id,
        type: "status",
        title: isUrgent
          ? `⚠️ ${reminder.document_name} expires in ${daysUntilExpiry} days!`
          : `📋 ${reminder.document_name} expires in ${daysUntilExpiry} days`,
        body: isUrgent
          ? "Take action now to avoid complications."
          : "Plan ahead to renew your document.",
        is_read: false,
      });

      // Update last notified
      await supabase
        .from("document_reminders")
        .update({ last_notified_at: now.toISOString() })
        .eq("id", reminder.id);

      results.push({ id: reminder.id, document: reminder.document_name, daysUntilExpiry });
    }

    return new Response(JSON.stringify({ processed: results.length, reminders: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("document-reminder-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
