import { createClient } from "npm:@supabase/supabase-js@2";
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Internal/cron guard
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    // 1. CRM tasks due within 1 hour that haven't been reminded
    const { data: crmTasks } = await supabase
      .from("crm_tasks")
      .select("id, title, assigned_to, property_id, due_date, reminder_at")
      .in("status", ["pending", "in_progress"])
      .not("assigned_to", "is", null)
      .lte("due_date", inOneHour.toISOString())
      .gte("due_date", now.toISOString());

    // 2. Operational tasks due today
    const today = now.toISOString().slice(0, 10);
    const { data: opsTasks } = await supabase
      .from("property_operational_tasks")
      .select("id, title, assigned_to, property_id, scheduled_date, scheduled_time")
      .in("status", ["pending", "in_progress"])
      .not("assigned_to", "is", null)
      .eq("scheduled_date", today);

    const notifications: any[] = [];

    // CRM task reminders
    for (const task of crmTasks || []) {
      if (!task.assigned_to) continue;
      notifications.push({
        owner_id: task.assigned_to,
        type: "task_reminder",
        title: `⏰ Скоро дедлайн: ${task.title}`,
        body: `Срок выполнения задачи истекает в ближайший час`,
        property_id: task.property_id || null,
        metadata: { task_id: task.id, task_source: "crm" },
        is_read: false,
      });
    }

    // Ops task reminders (morning of scheduled date)
    if (now.getHours() >= 7 && now.getHours() < 8) {
      for (const task of opsTasks || []) {
        if (!task.assigned_to) continue;
        notifications.push({
          owner_id: task.assigned_to,
          type: "task_reminder",
          title: `📋 Задача на сегодня: ${task.title}`,
          body: task.scheduled_time ? `Запланировано на ${task.scheduled_time}` : "Запланировано на сегодня",
          property_id: task.property_id || null,
          metadata: { task_id: task.id, task_source: "ops" },
          is_read: false,
        });
      }
    }

    // Deduplicate: don't send if already notified in last 4 hours
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const filteredNotifications: any[] = [];

    for (const n of notifications) {
      const { count } = await supabase
        .from("owner_notifications")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", n.owner_id)
        .eq("type", n.type)
        .gte("created_at", fourHoursAgo)
        .contains("metadata", { task_id: n.metadata.task_id });

      if ((count || 0) === 0) {
        filteredNotifications.push(n);
      }
    }

    if (filteredNotifications.length > 0) {
      await supabase.from("owner_notifications").insert(filteredNotifications);
    }

    return new Response(
      JSON.stringify({ sent: filteredNotifications.length, total_checked: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
