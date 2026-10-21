/** Literal substring search for the two admin queues. The global legacy sanitizer is unchanged. */
export const adminSearchTerm = (value: string) => value.trim().slice(0, 100);

// Columns are a fixed application-owned allowlist; user input can only be a quoted value.
const columns = {
  providers: ['name', 'description_en', 'business_category', 'email'],
  applications: ['business_name', 'contact_name', 'contact_email'],
} as const;

export function adminLiteralSearchOr(kind: keyof typeof columns, value: string): string | null {
  const term = adminSearchTerm(value);
  if (!term) return null;
  // PostgREST translates '*' to LIKE '%', even inside a quoted value. For
  // literal stars use an escaped (never user-authored) regular expression.
  if (term.includes('*')) {
    const literal = term.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
    return columns[kind].map(column => `${column}.imatch.${JSON.stringify(literal)}`).join(',');
  }
  // PostgreSQL LIKE escaping first, PostgREST quoted-value escaping second.
  // URL encoding is performed once by the Supabase client.
  const pattern = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
  const quoted = JSON.stringify(pattern);
  return columns[kind].map(column => `${column}.ilike.${quoted}`).join(',');
}
