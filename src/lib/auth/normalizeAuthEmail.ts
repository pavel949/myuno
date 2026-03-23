/**
 * Supabase Auth stores emails in normalized form; trim + lowercase avoids
 * "valid email but login fails" when the user copies spaces or different casing.
 */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
