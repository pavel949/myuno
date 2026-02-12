/**
 * Sanitizes form payload before sending to database.
 * Converts empty strings to null to prevent DB constraint violations.
 * Preserves booleans, numbers, arrays, and objects as-is.
 */
export function sanitizePayload<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.trim() === '') {
      result[key] = null;
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}
