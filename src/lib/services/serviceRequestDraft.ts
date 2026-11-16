/**
 * Keeps a service-request form across the sign-in redirect.
 *
 * The draft lives in sessionStorage (this tab only), is bound to one service
 * function, and is removed as soon as it is restored or the request is sent,
 * so contact details never outlive the journey they were typed for.
 */
export interface ServiceRequestDraft {
  name: string;
  phone: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  problemDescription: string;
  contactMethod: string;
}

const DRAFT_KEY_PREFIX = 'myuno:service-request-draft:';
const DRAFT_FIELDS: (keyof ServiceRequestDraft)[] = [
  'name', 'phone', 'address', 'preferredDate', 'preferredTime', 'problemDescription', 'contactMethod',
];
const MAX_FIELD_LENGTH = 2000;

const draftKey = (functionId: string) => `${DRAFT_KEY_PREFIX}${functionId}`;

export function saveServiceRequestDraft(functionId: string, draft: ServiceRequestDraft): void {
  try {
    sessionStorage.setItem(draftKey(functionId), JSON.stringify(draft));
  } catch {
    // Storage can be blocked or full; the form then simply starts empty again.
  }
}

/** Returns the stored draft once, then forgets it. Anything malformed is ignored. */
export function takeServiceRequestDraft(functionId: string): ServiceRequestDraft | null {
  try {
    const key = draftKey(functionId);
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (!DRAFT_FIELDS.every(field => typeof record[field] === 'string' && (record[field] as string).length <= MAX_FIELD_LENGTH)) return null;
    return Object.fromEntries(DRAFT_FIELDS.map(field => [field, record[field]])) as unknown as ServiceRequestDraft;
  } catch {
    return null;
  }
}

export function clearServiceRequestDraft(functionId: string): void {
  try {
    sessionStorage.removeItem(draftKey(functionId));
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
