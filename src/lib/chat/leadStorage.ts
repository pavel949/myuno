const LEAD_KEY = 'myuno_chat_lead_id';

export function getStoredLeadId(): string | null {
  try {
    return sessionStorage.getItem(LEAD_KEY);
  } catch {
    return null;
  }
}

export function setStoredLeadId(id: string): void {
  try {
    sessionStorage.setItem(LEAD_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getOrCreateLeadId(): string {
  const existing = getStoredLeadId();
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `lead_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  setStoredLeadId(id);
  return id;
}
