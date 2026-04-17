/**
 * Attribution Engine — core mechanics for the Developer Module
 *
 * R2: Every lead that comes through the Platform belongs to the Broker
 *     for 365 days from first touch.
 *
 * How it works:
 *  1. Cookie `myuno_attr_id` is set on first visit to /newbuilds/*
 *  2. On any form submit we compute a contact fingerprint
 *     sha256(normalised_email + digits_phone + passport)
 *  3. We look for an existing lead_attributions record matching
 *     cookie OR email_hash OR phone_hash
 *  4. If found → update last_touch_at + append touchpoint
 *  5. If not found → create new attribution record
 *  6. First qualified touchpoint on a project triggers an RLN record
 */

import { supabase } from '@/integrations/supabase/client';

// Typed helper for untyped tables
type SupabaseFrom = ReturnType<typeof supabase.from>;
function from(table: string): SupabaseFrom {
  return (supabase.from as (t: string) => SupabaseFrom)(table);
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

const COOKIE_NAME = 'myuno_attr_id';
const COOKIE_DAYS = 365;

export function getAttributionCookieId(): string {
  const existing = getCookie(COOKIE_NAME);
  if (existing) return existing;
  const id = crypto.randomUUID();
  setCookie(COOKIE_NAME, id, COOKIE_DAYS);
  return id;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── Fingerprinting ──────────────────────────────────────────────────────────

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeFingerprint(opts: {
  email?: string;
  phone?: string;
  passport?: string;
}): Promise<{ fingerprint: string; emailHash: string | null; phoneHash: string | null }> {
  const emailNorm = opts.email ? normaliseEmail(opts.email) : '';
  const phoneNorm = opts.phone ? digitsOnly(opts.phone) : '';
  const passportNorm = opts.passport?.trim().toUpperCase() ?? '';

  const combined = emailNorm + phoneNorm + passportNorm;
  const fingerprint = combined ? await sha256(combined) : '';
  const emailHash = emailNorm ? await sha256(emailNorm) : null;
  const phoneHash = phoneNorm ? await sha256(phoneNorm) : null;

  return { fingerprint, emailHash, phoneHash };
}

// ─── Core attribution write ──────────────────────────────────────────────────

export interface TouchpointPayload {
  type: 'form_submit' | 'viewing_booked' | 'calc_run' | 'page_view' | 'soft_hold';
  projectId?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface AttributionResult {
  attributionId: string;
  isNew: boolean;
  rlnTriggered: boolean;
}

export async function recordAttribution(opts: {
  email?: string;
  phone?: string;
  passport?: string;
  projectId?: string;
  touchpoint: TouchpointPayload;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}): Promise<AttributionResult> {
  const cookieId = getAttributionCookieId();

  const { fingerprint, emailHash, phoneHash } = await computeFingerprint({
    email: opts.email,
    phone: opts.phone,
    passport: opts.passport,
  });

  const now = new Date().toISOString();
  const newTouchpoint = {
    type: opts.touchpoint.type,
    at: now,
    project_id: opts.projectId ?? null,
    metadata: opts.touchpoint.metadata ?? {},
  };

  // ── Try to find existing attribution by cookie ──
  let existing: Record<string, unknown> | null = null;

  const { data: byCookie } = await from('lead_attributions')
    .select('id, touchpoints, expires_at')
    .eq('attribution_cookie_id', cookieId)
    .maybeSingle();

  existing = byCookie as Record<string, unknown> | null;

  // ── Fallback: hash match ──
  if (!existing && (emailHash || phoneHash)) {
    const conditions: string[] = [];
    if (emailHash) conditions.push(`email_hash.eq.${emailHash}`);
    if (phoneHash) conditions.push(`phone_hash.eq.${phoneHash}`);

    const { data: byHash } = await from('lead_attributions')
      .select('id, touchpoints, expires_at')
      .or(conditions.join(','))
      .order('first_touch_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    existing = byHash as Record<string, unknown> | null;
  }

  let attributionId: string;
  let isNew = false;
  let rlnTriggered = false;

  if (existing) {
    attributionId = existing.id as string;
    const prevTouchpoints = (existing.touchpoints as unknown[]) ?? [];

    await from('lead_attributions')
      .update({
        last_touch_at: now,
        touchpoints: [...prevTouchpoints, newTouchpoint],
        ...(fingerprint ? { contact_fingerprint: fingerprint } : {}),
        ...(emailHash ? { email_hash: emailHash } : {}),
        ...(phoneHash ? { phone_hash: phoneHash } : {}),
        attribution_cookie_id: cookieId,
      })
      .eq('id', attributionId);
  } else {
    isNew = true;
    const { data: created, error } = await from('lead_attributions')
      .insert({
        attribution_cookie_id: cookieId,
        project_id: opts.projectId ?? null,
        contact_fingerprint: fingerprint || null,
        email_hash: emailHash,
        phone_hash: phoneHash,
        first_touch_at: now,
        last_touch_at: now,
        attribution_days: 365,
        utm_source: opts.utmSource ?? null,
        utm_medium: opts.utmMedium ?? null,
        utm_campaign: opts.utmCampaign ?? null,
        referrer: typeof document !== 'undefined' ? (document.referrer || null) : null,
        touchpoints: [newTouchpoint],
        claimed_by_broker: true,
      })
      .select('id')
      .single();

    if (error || !created) throw new Error(error?.message ?? 'Attribution insert failed');
    attributionId = (created as { id: string }).id;

    if (opts.projectId && ['form_submit', 'viewing_booked', 'calc_run'].includes(opts.touchpoint.type)) {
      rlnTriggered = await triggerRln({ attributionId, projectId: opts.projectId, email: opts.email, phone: opts.phone });
    }
  }

  return { attributionId, isNew, rlnTriggered };
}

// ─── RLN (Registered Lead Notice) ───────────────────────────────────────────

async function triggerRln(opts: {
  attributionId: string;
  projectId: string;
  email?: string;
  phone?: string;
}): Promise<boolean> {
  try {
    const { data: project } = await supabase
      .from('property_projects')
      .select('id, name_en, developer_id, developer_name')
      .eq('id', opts.projectId)
      .maybeSingle();

    if (!project) return false;

    const { data: existingRln } = await from('rln_events')
      .select('id')
      .eq('lead_attribution_id', opts.attributionId)
      .eq('project_id', opts.projectId)
      .maybeSingle();

    if (existingRln) return false;

    const year = new Date().getFullYear();
    const { count } = await from('rln_events').select('id', { count: 'exact', head: true });
    const seq = String((count ?? 0) + 1).padStart(5, '0');
    const rlnNumber = `RLN-${year}-${seq}`;

    let developerEmail: string | null = null;
    if (project.developer_id) {
      const { data: dev } = await from('developers')
        .select('email')
        .eq('id', project.developer_id)
        .maybeSingle();
      developerEmail = (dev as { email: string | null } | null)?.email ?? null;
    }

    await from('rln_events').insert({
      lead_attribution_id: opts.attributionId,
      project_id: opts.projectId,
      developer_id: project.developer_id ?? null,
      rln_number: rlnNumber,
      sent_to_email: developerEmail ?? 'sales@myuno.app',
      sent_at: new Date().toISOString(),
    });

    // Fire-and-forget: notify Edge Function
    supabase.functions.invoke('notify-rln', {
      body: {
        rln_number: rlnNumber,
        project_name: project.name_en,
        developer_name: project.developer_name,
        developer_email: developerEmail,
        lead_email: opts.email ?? null,
        lead_phone: opts.phone ?? null,
        attribution_id: opts.attributionId,
      },
    }).catch(() => { /* best-effort */ });

    return true;
  } catch {
    return false;
  }
}
