/**
 * App logger: logs only in development (VITE_DEV / import.meta.env.DEV).
 * In production, log/warn/debug are no-ops to avoid leaking data and policy compliance.
 * Use for debugging and diagnostics; for errors use createErrorHandler from errorHandler.ts.
 */
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  /** Always emitted (e.g. for critical errors); prefer errorHandler for user-facing errors. */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
