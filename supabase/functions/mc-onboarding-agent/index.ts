/**
 * MC Onboarding Agent
 *
 * Triggered fire-and-forget after new MC registration.
 * Requires x-internal-secret header — not callable from the frontend directly.
 *
 * Workflow:
 *  1. Validate input: { company_id, user_id, company_name, plan_type }
 *  2. Fetch owner phone from management_company_members (role = 'director' or 'owner')
 *  3. Call ai-generate-description to create a welcome description (RU)
 *  4. Send WhatsApp welcome message to owner
 *  5. Insert 3 onboarding tasks into crm_tasks
 *  6. Log each step to mc_agent_activity
 */

import { getCorsHeaders } from "../_shared/cors.ts";
import { requireInternalSecret } from "../_shared/internal-secret.ts";
import { createServiceClient } from "../_shared/supabase.ts";
import { sendWhatsApp } from "../_shared/whatsapp.ts";

const AGENT_NAME = "mc-onboarding-agent";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logActivity(
  supabase: ReturnType<typeof createServiceClient>,
  company_id: string,
  action_type: string,
  status: "ok" | "error" | "skipped",
  details: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from("mc_agent_activity").insert({
    company_id,
    agent_name: AGENT_NAME,
    action_type,
    status,
    details,
  });
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Internal-only endpoint
  const secretError = requireInternalSecret(req, corsHeaders);
  if (secretError) return secretError;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 1. Validate input ──────────────────────────────────────────────────────
  let body: {
    company_id: string;
    user_id: string;
    company_name: string;
    plan_type?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { company_id, user_id, company_name, plan_type = "free" } = body;

  if (!company_id || !user_id || !company_name) {
    return new Response(
      JSON.stringify({ error: "company_id, user_id, company_name are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[${AGENT_NAME}] Starting for company ${company_id} (${company_name})`);

  const supabase = createServiceClient();
  const results: Record<string, string> = {};

  // ── 2. Fetch owner phone ───────────────────────────────────────────────────
  let ownerPhone: string | null = null;

  try {
    const { data: member, error } = await supabase
      .from("management_company_members")
      .select("user_id")
      .eq("company_id", company_id)
      .in("role", ["owner", "director"])
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error || !member) {
      await logActivity(supabase, company_id, "fetch_owner_phone", "skipped", {
        reason: error?.message ?? "no owner member found",
      });
    } else {
      // Fetch phone from auth.users via RPC — service role can read this
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", member.user_id)
        .maybeSingle();

      ownerPhone = profile?.phone ?? null;

      await logActivity(supabase, company_id, "fetch_owner_phone", "ok", {
        has_phone: ownerPhone !== null,
      });
    }
  } catch (err) {
    await logActivity(supabase, company_id, "fetch_owner_phone", "error", {
      error: String(err),
    });
  }

  results.owner_phone = ownerPhone ? "found" : "not_found";

  // ── 3. Generate AI welcome description (RU) ────────────────────────────────
  let welcomeDescription: string | null = null;

  try {
    const descResp = await fetch(`${SUPABASE_URL}/functions/v1/ai-generate-description`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        type: "service",
        name: company_name,
        language: "ru",
        details: {
          benefits: ["управление недвижимостью", "Пхукет", "профессиональная команда"],
        },
      }),
    });

    if (descResp.ok) {
      const descData = await descResp.json();
      welcomeDescription = descData.description ?? null;
      await logActivity(supabase, company_id, "generate_description", "ok", {
        length: welcomeDescription?.length ?? 0,
      });
    } else {
      throw new Error(`ai-generate-description returned ${descResp.status}`);
    }
  } catch (err) {
    await logActivity(supabase, company_id, "generate_description", "error", {
      error: String(err),
    });
  }

  results.description = welcomeDescription ? "generated" : "skipped";

  // ── 4. Send WhatsApp welcome to owner ─────────────────────────────────────
  if (ownerPhone) {
    try {
      const intro = welcomeDescription
        ? `\n\n_${welcomeDescription.slice(0, 300)}..._`
        : "";

      const sent = await sendWhatsApp({
        to: ownerPhone,
        body:
          `🎉 *Добро пожаловать в myUNO!*\n\n` +
          `Ваша управляющая компания *${company_name}* успешно зарегистрирована.${intro}\n\n` +
          `📋 Мы создали для вас первые задачи — загляните в раздел «Задачи».\n\n` +
          `По вопросам: напишите нам в WhatsApp или откройте чат поддержки в приложении.`,
      });

      await logActivity(supabase, company_id, "send_whatsapp_welcome", sent ? "ok" : "error", {
        phone_present: true,
      });
      results.whatsapp = sent ? "sent" : "failed";
    } catch (err) {
      await logActivity(supabase, company_id, "send_whatsapp_welcome", "error", {
        error: String(err),
      });
      results.whatsapp = "error";
    }
  } else {
    results.whatsapp = "skipped_no_phone";
  }

  // ── 5. Insert onboarding tasks ─────────────────────────────────────────────
  const onboardingTasks = [
    {
      title: "Добавьте первый объект",
      description: "Добавьте вашу первую недвижимость, чтобы начать управление.",
      due_date: daysFromNow(1),
      priority: "high",
    },
    {
      title: "Пригласите команду",
      description: "Пригласите сотрудников — менеджеров, администраторов.",
      due_date: daysFromNow(3),
      priority: "medium",
    },
    {
      title: "Настройте каналы",
      description: "Подключите каналы продаж: Airbnb, Booking.com, WhatsApp.",
      due_date: daysFromNow(7),
      priority: "medium",
    },
  ];

  const taskRows = onboardingTasks.map((t) => ({
    company_id,
    title: t.title,
    description: t.description,
    task_type: "onboarding",
    priority: t.priority,
    status: "pending",
    due_date: t.due_date,
    assigned_to: user_id,
    created_by: user_id,
  }));

  try {
    const { error: tasksError } = await supabase.from("crm_tasks").insert(taskRows);

    if (tasksError) throw tasksError;

    await logActivity(supabase, company_id, "insert_onboarding_tasks", "ok", {
      count: taskRows.length,
    });
    results.tasks = `inserted_${taskRows.length}`;
  } catch (err) {
    await logActivity(supabase, company_id, "insert_onboarding_tasks", "error", {
      error: String(err),
    });
    results.tasks = "error";
  }

  console.log(`[${AGENT_NAME}] Done for ${company_id}:`, results);

  return new Response(JSON.stringify({ ok: true, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
