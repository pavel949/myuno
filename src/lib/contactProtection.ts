/**
 * Phone masking utility for contact protection.
 * Masks phone numbers for staff without full access rights.
 * Example: +66 812 345 678 → +66 8** *** *78
 */

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  // Keep first 4 and last 2 chars, mask the rest
  const clean = phone.replace(/\s/g, '');
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-2);
  const middleLen = Math.max(clean.length - 6, 1);
  return `${prefix}${'*'.repeat(middleLen)}${suffix}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
}
