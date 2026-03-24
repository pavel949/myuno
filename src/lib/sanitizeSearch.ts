/**
 * Sanitize search input for PostgREST .or() / .ilike() filters.
 * 
 * Escapes characters that PostgREST interprets as filter operators:
 * commas (,), dots (.), parentheses, percent signs, etc.
 * This prevents filter injection attacks where a user could
 * inject additional filter conditions via the search input.
 */
export function sanitizeSearchTerm(term: string): string {
  // Remove characters that PostgREST interprets as filter operators
  // Keep alphanumeric, spaces, hyphens, and common Unicode (Cyrillic, Thai, etc.)
  return term
    .replace(/[,.()'\\]/g, '') // Remove PostgREST operator chars
    .replace(/%/g, '')          // Remove wildcard chars  
    .trim()
    .slice(0, 100);             // Limit length
}
