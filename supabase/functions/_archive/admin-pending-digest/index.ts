/**
 * admin-pending-digest
 * Run via pg_cron daily at 09:00 ICT.
 * Sends Telegram + Email digest of:
 *   - projects pending moderation > 24h
 *   - developer applications pending > 48h
 *   - projects with stale data (no updates > 45 days)
 */

import { createClient } from "../_shared/supabase.ts";
import { sendEmail, buildEmailHtml, NOTIFY_CORS } from "../_shared/notify-utils.ts";
import { getAdminEmails } from "../_shared/admin-config.ts";

async function sendTelegram(text: string): Promise<boolean> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!token || !chatId) return false;
  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: NOTIFY_CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const day1Ago = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    const day2Ago = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
    const day45Ago = new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString();

    // 1. Projects pending > 24h
    const { data: pendingProjects } = await supabase
      .from("property_projects")
      .select("id, name_en, created_at, developer_id")
      .eq("is_approved", false)
      .lte("created_at", day1Ago)
      .order("created_at", { ascending: true })
      .limit(50);

    // 2. Developer applications pending > 48h
    const { data: pendingDevs } = await supabase
      .from("developers")
      .select("id, name_en, email, created_at")
      .eq("is_active", false)
      .eq("is_verified", false)
      .lte("created_at", day2Ago)
      .order("created_at", { ascending: true })
      .limit(50);

    // 3. Stale projects (approved but no updates > 45d)
    const { data: staleProjects } = await supabase
      .from("property_projects")
      .select("id, name_en, updated_at")
      .eq("is_approved", true)
      .lte("updated_at", day45Ago)
      .order("updated_at", { ascending: true })
      .limit(50);

    const counts = {
      pendingProjects: pendingProjects?.length || 0,
      pendingDevs: pendingDevs?.length || 0,
      staleProjects: staleProjects?.length || 0,
    };

    if (counts.pendingProjects + counts.pendingDevs + counts.staleProjects === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: "nothing to report" }), {
        headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    }

    // Telegram
    let tg = `📊 <b>Daily Newbuilds Digest</b>\n\n`;
    tg += `🏗️ Проекты в модерации > 24ч: <b>${counts.pendingProjects}</b>\n`;
    tg += `🏢 Заявки застройщиков > 48ч: <b>${counts.pendingDevs}</b>\n`;
    tg += `⏳ Проекты без обновлений > 45д: <b>${counts.staleProjects}</b>\n\n`;
    if (pendingProjects?.length) {
      tg += `<b>Проекты в очереди:</b>\n`;
      pendingProjects.slice(0, 10).forEach((p: any) => {
        tg += `• ${p.name_en}\n`;
      });
      tg += `\n`;
    }
    tg += `<a href="https://myuno.app/admin/newbuilds">Открыть консоль</a>`;
    await sendTelegram(tg);

    // Email
    const sections = [
      { label: "Проектов в модерации >24ч", value: String(counts.pendingProjects) },
      { label: "Заявок застройщиков >48ч", value: String(counts.pendingDevs) },
      { label: "Проектов без обновлений >45д", value: String(counts.staleProjects) },
    ];

    const html = buildEmailHtml({
      title: "Daily Newbuilds Digest",
      subtitle: now.toISOString().slice(0, 10),
      sections,
      ctaText: "Открыть консоль",
      ctaUrl: "https://myuno.app/admin/newbuilds",
    });

    const admins = await getAdminEmails();
    if (admins.length) {
      await sendEmail({
        to: admins,
        subject: `[myUNO Admin] Newbuilds Digest — ${counts.pendingProjects}P / ${counts.pendingDevs}D / ${counts.staleProjects}S`,
        html,
      });
    }

    return new Response(JSON.stringify({ ok: true, counts }), {
      headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin-pending-digest] error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
    });
  }
});
