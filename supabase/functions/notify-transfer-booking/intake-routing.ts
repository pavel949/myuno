/** myUNO admin recipients only. Supplier contacts are deliberately not inputs. */
export function transferAdminTargets(emails: readonly string[], primary: string, secondary: unknown) {
  return {
    emails: [...new Set(emails.map(value => value.trim()).filter(Boolean))],
    whatsapp: [...new Set([primary, typeof secondary === 'string' ? secondary : '']
      .map(value => value.replace(/[^0-9]/g, '')).filter(value => /^\d{9,15}$/.test(value)))],
  };
}

export type TransferEmailOutcome = 'queued' | 'suppressed' | 'failed';
export type TransferWhatsAppOutcome = 'accepted' | 'not_configured' | 'failed';

export function transferEmailOutcome(data: unknown, error: unknown): TransferEmailOutcome {
  if (error || !data || typeof data !== 'object') return 'failed';
  const result = data as Record<string, unknown>;
  if (result.success === false && result.reason === 'email_suppressed') return 'suppressed';
  return result.success === true && result.queued === true ? 'queued' : 'failed';
}

export function transferWhatsAppOutcome(ok: boolean, data: unknown): TransferWhatsAppOutcome {
  if (!ok || !data || typeof data !== 'object') return 'failed';
  const result = data as Record<string, unknown>;
  const validId = (typeof result.id === 'number' && Number.isFinite(result.id) && result.id > 0)
    || (typeof result.id === 'string' && result.id.trim().length > 0);
  return !result.error && validId && (result.sent === true || result.sent === 'true') ? 'accepted' : 'failed';
}

/** Queued/accepted means handoff only, never recipient delivery or booking confirmation. */
export function transferAdminHandoff(email: readonly TransferEmailOutcome[], whatsapp: readonly TransferWhatsAppOutcome[]) {
  const anyAccepted = email.includes('queued') || whatsapp.includes('accepted');
  const complete = email.length > 0 && whatsapp.length > 0
    && email.every(value => value === 'queued') && whatsapp.every(value => value === 'accepted');
  return { anyAccepted, status: complete ? 'pending' : anyAccepted ? 'partial' : 'failed' } as const;
}
