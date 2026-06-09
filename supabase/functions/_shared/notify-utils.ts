/**
 * Shared notification utilities for Edge Functions.
 *
 * Consolidates CORS, Resend email sending, and WhatsApp messaging
 * patterns used across 17+ notification functions.
 */

import { Resend } from "npm:resend@2.0.0";

// ── CORS ────────────────────────────────────────────────────────────────

export const NOTIFY_CORS = {
  "Access-Control-Allow-Origin": "https://myuno.app",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Resend Email ────────────────────────────────────────────────────────

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) throw new Error("RESEND_API_KEY not configured");
    _resend = new Resend(key);
  }
  return _resend;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: opts.from ?? "myUNO <onboarding@resend.dev>",
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      reply_to: opts.replyTo,
    });
    if (error) {
      console.error("[sendEmail] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendEmail] Error:", msg);
    return { success: false, error: msg };
  }
}

// ── Email HTML builder ──────────────────────────────────────────────────

export interface EmailSection {
  label: string;
  value: string;
}

/**
 * Build a standard myUNO notification email.
 * Accepts title, color theme, and key-value detail sections.
 */
export function buildEmailHtml(options: {
  title: string;
  subtitle?: string;
  color?: string; // gradient start color, default green
  sections: EmailSection[];
  ctaText?: string;
  ctaUrl?: string;
  footer?: string;
}): string {
  const { title, subtitle, color = "#10b981", sections, ctaText, ctaUrl, footer } = options;

  const detailRows = sections
    .map(
      (s) => `
      <div style="margin-bottom:10px">
        <div style="font-weight:bold;color:#6b7280;font-size:12px;text-transform:uppercase">${esc(s.label)}</div>
        <div style="font-size:16px">${esc(s.value)}</div>
      </div>`
    )
    .join("");

  const ctaBlock =
    ctaText && ctaUrl
      ? `<div style="text-align:center;margin:20px 0">
           <a href="${esc(ctaUrl)}" style="background:${color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(ctaText)}</a>
         </div>`
      : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,${color} 0%,${darken(color)} 100%);color:white;padding:20px;border-radius:10px 10px 0 0">
      <h2 style="margin:0">${esc(title)}</h2>
      ${subtitle ? `<p style="margin:5px 0 0;opacity:0.9">${esc(subtitle)}</p>` : ""}
    </div>
    <div style="background:#f9fafb;padding:20px;border:1px solid #e5e7eb">
      <div style="background:white;padding:15px;border-radius:8px">
        ${detailRows}
      </div>
      ${ctaBlock}
    </div>
    <div style="background:#374151;color:white;padding:15px;border-radius:0 0 10px 10px;text-align:center;font-size:12px">
      ${footer ?? "myUNO Platform — Phuket, Thailand"}
    </div>
  </div>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function darken(hex: string): string {
  // Simple darkening: reduce each channel by ~20%
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const d = (c: string) => Math.max(0, Math.round(parseInt(c, 16) * 0.8)).toString(16).padStart(2, "0");
  return `#${d(m[1])}${d(m[2])}${d(m[3])}`;
}

// ── Handler factory ─────────────────────────────────────────────────────

export type NotifyHandler = (body: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;

/**
 * Create a Deno.serve handler for a notification function.
 * Handles CORS, JSON parsing, error catching.
 */
export function createNotifyHandler(name: string, handler: NotifyHandler) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: NOTIFY_CORS });
    }
    try {
      const body = await req.json();
      console.log(`[${name}] Processing notification`);
      const result = await handler(body);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[${name}] Error:`, msg);
      return new Response(JSON.stringify({ success: false, error: msg }), {
        status: 500,
        headers: { ...NOTIFY_CORS, "Content-Type": "application/json" },
      });
    }
  };
}
