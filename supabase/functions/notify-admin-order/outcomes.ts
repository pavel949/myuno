/** Provider acceptance is not recipient delivery. Never serialize provider errors/PII. */
export type NotificationOutcome = 'accepted' | 'failed' | 'not_configured';

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

export function classifyEmailAcceptance(response: unknown): NotificationOutcome {
  const result = record(response);
  const data = record(result?.data);
  return !result?.error && typeof data?.id === 'string' && data.id.trim().length > 0
    ? 'accepted' : 'failed';
}

export function classifyWhatsAppAcceptance(httpOk: boolean, response: unknown): NotificationOutcome {
  const result = record(response);
  const id = result?.id;
  const hasId = (typeof id === 'string' && id.trim().length > 0) || (typeof id === 'number' && Number.isFinite(id) && id > 0);
  return httpOk && !result?.error && hasId && (result?.sent === true || result?.sent === 'true')
    ? 'accepted' : 'failed';
}
