/** Strict platform recipients: missing, malformed or failed settings never select a legacy fallback. */
export function configuredAdminContacts(rows: Array<{ key: string; value: unknown }>) {
  const values = new Map(rows.map(row => [row.key, row.value]));
  let rawEmails = values.get('admin_emails');
  if (typeof rawEmails === 'string') { try { rawEmails = JSON.parse(rawEmails); } catch { rawEmails = null; } }
  const emails = Array.isArray(rawEmails) && rawEmails.length <= 20 &&
    rawEmails.every(value => typeof value === 'string' && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value))
    ? [...new Set(rawEmails as string[])] : [];
  const rawPhone = values.get('admin_whatsapp');
  const phone = typeof rawPhone === 'string' && /^\+?[0-9 ()-]+$/.test(rawPhone) ? rawPhone.replace(/[^0-9]/g, '') : '';
  return { emails, whatsapp: /^[0-9]{8,15}$/.test(phone) ? phone : '' };
}
