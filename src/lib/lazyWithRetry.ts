import { lazy, ComponentType } from 'react';

/**
 * Wraps React.lazy() with retry logic for unstable network connections.
 * Retries the dynamic import up to `retries` times with exponential backoff.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  baseDelay = 1000
) {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        importFn()
          .then(resolve)
          .catch((err: unknown) => {
            if (remaining <= 0) return reject(err);
            const delay = baseDelay * (retries - remaining + 1);
            setTimeout(() => attempt(remaining - 1), delay);
          });
      };
      attempt(retries);
    });
  });
}
