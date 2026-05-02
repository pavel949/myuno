/**
 * Shared helpers for Newbuilds (off-plan) alerts:
 * - templates for new units / construction updates / saved-search digest
 * - quiet-hours check
 * - send + log via nb_alert_log with idempotency
 */

import type { SupabaseClient } from "./supabase.ts";
import { sendWhatsApp } from "./whatsapp.ts";
import { Resend } from "npm:resend@2.0.0";

const SITE = "https://myuno.app";
const FROM = "myUNO <noreply@myuno.app>";

type Lang = "ru" | "en";

export interface AlertRecipient {
  user_id: string;
  email: string | null;
  whatsapp_phone: string | null;
  channel_email: boolean;
  channel_whatsapp: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  locale: Lang;
}

export interface UnitInfo {
  unit_id: string;
  unit_code: string | null;
  unit_type: string;
  bedrooms: number | null;
  area_sqm: number | null;
  price: number | null;
  currency: string | null;
}

export interface ProjectInfo {
  id: string;
  name_en: string;
  name_ru: string;
  slug?: string | null;
  district?: string | null;
  cover_image?: string | null;
}

/** Phuket TZ ≈ UTC+7. Returns local hour. */
export function isInQuietHours(start: number | null, end: number | null): boolean {
  if (start == null || end == null) return false;
  const utc = new Date().getUTCHours();
  const local = (utc + 7) % 24;
  if (start === end) return false;
  if (start < end) return local >= start && local < end;
  // wraps midnight, e.g. 22..7
  return local >= start || local < end;
}

export function projectUrl(project: ProjectInfo, utm = "alert"): string {
  const slug = project.slug || project.id;
  return `${SITE}/property/offplan/${slug}?utm_source=${utm}`;
}

function fmtMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null) return "—";
  const c = currency === "THB" ? "฿" : currency === "USD" ? "$" : currency || "";
  return `${c}${Math.round(amount).toLocaleString("en-US")}`;
}

// ─────────────── New units in favourite project ───────────────

export function renderNewUnitsEmail(opts: {
  project: ProjectInfo;
  units: UnitInfo[];
  lang: Lang;
}): { subject: string; html: string } {
  const { project, units, lang } = opts;
  const isRu = lang === "ru";
  const name = isRu ? project.name_ru : project.name_en;
  const url = projectUrl(project, "email-new-unit");

  const subject = isRu
    ? `Новые юниты в ${name}`
    : `New units available in ${name}`;

  const t = isRu
    ? { hi: "Здравствуйте,", lead: `В ЖК «${name}», который вы добавили в избранное, появились новые юниты:`, cta: "Посмотреть проект", foot: "Вы получаете это письмо, потому что добавили проект в избранное в myUNO. Управлять уведомлениями можно в личном кабинете." }
    : { hi: "Hello,", lead: `New units became available in ${name}, a project you have favourited:`, cta: "View project", foot: "You are receiving this because you favourited this project on myUNO. Manage alerts in your account." };

  const rows = units.slice(0, 8).map((u) => {
    const beds = u.bedrooms != null ? `${u.bedrooms}BR` : "";
    const area = u.area_sqm != null ? `${u.area_sqm} m²` : "";
    const code = u.unit_code ? ` · ${u.unit_code}` : "";
    return `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${u.unit_type}${code} ${beds} ${area}</td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;text-align:right;">${fmtMoney(u.price, u.currency)}</td></tr>`;
  }).join("");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f9fc;padding:24px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    ${project.cover_image ? `<img src="${project.cover_image}" alt="" style="width:100%;height:180px;object-fit:cover;display:block;"/>` : ""}
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 12px;font-size:20px;">${t.hi}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">${t.lead}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${rows}</table>
      <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#4A5899;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${t.cta}</a></p>
      <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.5;">${t.foot}</p>
    </div>
  </div></body></html>`;

  return { subject, html };
}

export function renderNewUnitsWhatsApp(opts: {
  project: ProjectInfo;
  units: UnitInfo[];
  lang: Lang;
}): string {
  const { project, units, lang } = opts;
  const isRu = lang === "ru";
  const name = isRu ? project.name_ru : project.name_en;
  const url = projectUrl(project, "wa-new-unit");
  const head = isRu ? `*Новые юниты в ${name}*` : `*New units in ${name}*`;
  const lines = units.slice(0, 4).map((u) => {
    const beds = u.bedrooms != null ? `${u.bedrooms}BR ` : "";
    return `• ${u.unit_type} ${beds}— ${fmtMoney(u.price, u.currency)}`;
  }).join("\n");
  const more = units.length > 4 ? (isRu ? `\n…и ещё ${units.length - 4}` : `\n…and ${units.length - 4} more`) : "";
  return `${head}\n${lines}${more}\n\n${url}`;
}

// ─────────────── Construction progress update ───────────────

export function renderProgressEmail(opts: {
  project: ProjectInfo;
  update: { id: string; title: string; content: string | null; progress_at_time: number | null };
  lang: Lang;
}): { subject: string; html: string } {
  const { project, update, lang } = opts;
  const isRu = lang === "ru";
  const name = isRu ? project.name_ru : project.name_en;
  const url = projectUrl(project, "email-progress");
  const subject = isRu ? `Обновление по стройке: ${name}` : `Construction update: ${name}`;
  const t = isRu
    ? { cta: "Открыть проект", foot: "Вы добавили этот ЖК в избранное в myUNO." }
    : { cta: "Open project", foot: "You favourited this project on myUNO." };
  const progress = update.progress_at_time != null ? `<p style="margin:0 0 16px;font-size:14px;color:#059669;font-weight:600;">${update.progress_at_time}%</p>` : "";
  const body = update.content ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(update.content)}</p>` : "";
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f9fc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:28px 24px;">
    <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(update.title)}</h2>
    <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${name}</p>
    ${progress}
    ${body}
    <p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#4A5899;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">${t.cta}</a></p>
    <p style="margin:0;font-size:12px;color:#6b7280;">${t.foot}</p>
  </div></body></html>`;
  return { subject, html };
}

export function renderProgressWhatsApp(opts: {
  project: ProjectInfo;
  update: { title: string; progress_at_time: number | null };
  lang: Lang;
}): string {
  const { project, update, lang } = opts;
  const isRu = lang === "ru";
  const name = isRu ? project.name_ru : project.name_en;
  const url = projectUrl(project, "wa-progress");
  const head = isRu ? `*Обновление по стройке: ${name}*` : `*Construction update: ${name}*`;
  const pct = update.progress_at_time != null ? `\n${update.progress_at_time}%` : "";
  return `${head}\n${update.title}${pct}\n\n${url}`;
}

// ─────────────── Saved search digest ───────────────

export function renderSavedSearchDigestEmail(opts: {
  searchName: string;
  projects: ProjectInfo[];
  lang: Lang;
}): { subject: string; html: string } {
  const { searchName, projects, lang } = opts;
  const isRu = lang === "ru";
  const subject = isRu
    ? `${projects.length} новых проектов по поиску «${searchName}»`
    : `${projects.length} new projects matching “${searchName}”`;
  const t = isRu
    ? { lead: `По вашему сохранённому поиску найдены новые проекты:`, cta: "Открыть", manage: "Управлять сохранёнными поисками", foot: "Вы получаете это письмо, потому что сохранили поиск в myUNO." }
    : { lead: `New projects matched your saved search:`, cta: "Open", manage: "Manage saved searches", foot: "You are receiving this because you saved a search on myUNO." };

  const cards = projects.slice(0, 6).map((p) => {
    const name = isRu ? p.name_ru : p.name_en;
    const url = projectUrl(p, "email-saved-search");
    const dist = p.district ? ` · ${p.district}` : "";
    return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
      <div style="font-size:15px;color:#1f2937;font-weight:600;">${escapeHtml(name)}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:2px;">${escapeHtml(dist.replace(' · ',''))}</div>
      <a href="${url}" style="font-size:13px;color:#4A5899;text-decoration:none;">${t.cta} →</a>
    </td></tr>`;
  }).join("");

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f9fc;padding:24px;color:#1f2937;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:28px 24px;">
    <h2 style="margin:0 0 6px;font-size:18px;">«${escapeHtml(searchName)}»</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#374151;">${t.lead}</p>
    <table style="width:100%;border-collapse:collapse;">${cards}</table>
    <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">
      <a href="${SITE}/account/saved-searches" style="color:#4A5899;">${t.manage}</a><br/>${t.foot}
    </p>
  </div></body></html>`;
  return { subject, html };
}

export function renderSavedSearchDigestWhatsApp(opts: {
  searchName: string;
  projects: ProjectInfo[];
  lang: Lang;
}): string {
  const { searchName, projects, lang } = opts;
  const isRu = lang === "ru";
  const head = isRu
    ? `*${projects.length} новых проектов по поиску «${searchName}»*`
    : `*${projects.length} new projects for “${searchName}”*`;
  const lines = projects.slice(0, 4).map((p) => {
    const name = isRu ? p.name_ru : p.name_en;
    return `• ${name}${p.district ? ` (${p.district})` : ""}`;
  }).join("\n");
  return `${head}\n${lines}\n\n${SITE}/account/saved-searches`;
}

// ─────────────── Send + log ───────────────

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" })[m]!);
}

export interface SendArgs {
  supabase: SupabaseClient;
  resend: Resend | null;
  recipient: AlertRecipient;
  alert_type: "new_unit" | "progress" | "price_change" | "saved_search_match";
  ref_id: string;
  project_id: string | null;
  email?: { subject: string; html: string };
  whatsapp?: string;
}

export async function sendAndLog(args: SendArgs): Promise<{ email: boolean; whatsapp: boolean }> {
  const result = { email: false, whatsapp: false };
  const { supabase, resend, recipient, alert_type, ref_id, project_id, email, whatsapp } = args;

  // Quiet hours → skip (cron will retry next cycle once outside window)
  if (isInQuietHours(recipient.quiet_hours_start, recipient.quiet_hours_end)) {
    return result;
  }

  // EMAIL
  if (email && recipient.channel_email && recipient.email && resend) {
    // Idempotency: try INSERT first; if conflict — already sent
    const { error: dupErr } = await supabase.from("nb_alert_log").insert({
      user_id: recipient.user_id,
      project_id,
      alert_type,
      ref_id,
      channel: "email",
      status: "sent",
      payload: { subject: email.subject },
    });
    if (!dupErr) {
      try {
        await resend.emails.send({
          from: FROM,
          to: [recipient.email],
          subject: email.subject,
          html: email.html,
        });
        result.email = true;
      } catch (e) {
        console.error("[nb-alerts] email send failed", e);
        await supabase.from("nb_alert_log")
          .update({ status: "failed", error_message: String(e) })
          .eq("user_id", recipient.user_id)
          .eq("alert_type", alert_type)
          .eq("ref_id", ref_id)
          .eq("channel", "email");
      }
    }
  }

  // WHATSAPP
  if (whatsapp && recipient.channel_whatsapp && recipient.whatsapp_phone) {
    const { error: dupErr } = await supabase.from("nb_alert_log").insert({
      user_id: recipient.user_id,
      project_id,
      alert_type,
      ref_id,
      channel: "whatsapp",
      status: "sent",
      payload: { len: whatsapp.length },
    });
    if (!dupErr) {
      const ok = await sendWhatsApp({ to: recipient.whatsapp_phone, body: whatsapp });
      result.whatsapp = ok;
      if (!ok) {
        await supabase.from("nb_alert_log")
          .update({ status: "failed", error_message: "whatsapp_send_failed" })
          .eq("user_id", recipient.user_id)
          .eq("alert_type", alert_type)
          .eq("ref_id", ref_id)
          .eq("channel", "whatsapp");
      }
    }
  }

  return result;
}
