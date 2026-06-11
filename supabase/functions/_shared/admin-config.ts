/**
 * Shared admin configuration for Edge Functions.
 * Reads admin contacts from system_settings table instead of hardcoding.
 */

import { createServiceClient } from "./supabase.ts";

const DEFAULTS = {
  admin_emails: ["pavel@ignatevestate.com", "pi@myuno.app"],
  admin_whatsapp: "66922407355",
  mail_from: "myUNO <noreply@resend.dev>",
};

/**
 * Returns the From address to use for outbound transactional emails.
 * Reads `system_settings.mail_from` (string). Falls back to Resend sandbox
 * sender so dev keeps working, but logs a warning so prod ops can spot it.
 * Set in DB to: `myUNO <transfers@yourverifieddomain.com>` once a Resend
 * domain is verified.
 */
export async function getMailFrom(): Promise<string> {
  try {
    const sb = createServiceClient();
    const { data } = await sb.from("system_settings").select("value").eq("key", "mail_from").maybeSingle();
    const v = data?.value;
    const parsed = typeof v === "string" ? v : (v ? JSON.parse(JSON.stringify(v)) : null);
    if (typeof parsed === "string" && parsed.includes("@")) return parsed;
  } catch (e) {
    console.warn("[admin-config] getMailFrom failed:", e);
  }
  console.warn("[admin-config] Using sandbox sender (resend.dev). Set system_settings.mail_from to a verified domain for production.");
  return DEFAULTS.mail_from;
}

let _cache: { emails: string[]; whatsapp: string; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadConfig() {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) return _cache;

  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("system_settings")
      .select("key, value")
      .in("key", ["admin_emails", "admin_whatsapp"]);

    let emails = DEFAULTS.admin_emails;
    let whatsapp = DEFAULTS.admin_whatsapp;

    (data || []).forEach((row: { key: string; value: unknown }) => {
      if (row.key === "admin_emails") {
        try {
          const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
          if (Array.isArray(parsed)) emails = parsed;
        } catch { /* use default */ }
      }
      if (row.key === "admin_whatsapp") {
        const val = String(row.value).replace(/[^0-9]/g, "");
        if (val) whatsapp = val;
      }
    });

    _cache = { emails, whatsapp, ts: Date.now() };
    return _cache;
  } catch {
    return { emails: DEFAULTS.admin_emails, whatsapp: DEFAULTS.admin_whatsapp, ts: Date.now() };
  }
}

export async function getAdminEmails(): Promise<string[]> {
  const config = await loadConfig();
  return config.emails;
}

export async function getAdminWhatsApp(): Promise<string> {
  const config = await loadConfig();
  return config.whatsapp;
}
