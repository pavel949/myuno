/**
 * @module errorUtils
 * @description Utility to safely extract error messages from unknown catch values.
 * 
 * USAGE:
 *   } catch (e: unknown) {
 *     toast.error(getErrorMessage(e));
 *   }
 * 
 * Replaces the unsafe `catch (e: any) { toast.error(e.message) }` pattern.
 */

/**
 * Extract a human-readable message from an unknown error value.
 * Handles Error objects, strings, and Supabase error shapes.
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

/**
 * Type guard to check if a value is an Error-like object with a message property.
 */
export function isErrorWithMessage(value: unknown): value is { message: string } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'message' in value &&
    typeof (value as { message: unknown }).message === 'string'
  );
}
