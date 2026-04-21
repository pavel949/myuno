/**
 * useActionLock — generic per-entity action lock.
 *
 * Use in any list/card UI to prevent double-clicks on async actions
 * (delete, open, archive, etc.). Tracks a set of "locked" keys (usually
 * entity ids, optionally namespaced like `delete:abc-123`) and exposes:
 *
 *   - isLocked(key)  → boolean
 *   - lock(key)      → mark a key busy
 *   - unlock(key)    → release a key
 *   - withLock(key, fn) → lock around an async fn (auto-unlock in finally)
 *
 * Stable identities — safe to put in deps and pass to memoized children.
 */
import { useCallback, useRef, useState } from 'react';

export interface ActionLockApi {
  /** Is the given key currently locked? */
  isLocked: (key: string) => boolean;
  /** Mark key as busy. No-op if already locked. */
  lock: (key: string) => void;
  /** Release key. No-op if not locked. */
  unlock: (key: string) => void;
  /**
   * Run an async function while the key is locked. Returns the function's
   * result, or `undefined` if the key was already locked (action skipped).
   * Always unlocks in a `finally` block, even on error.
   */
  withLock: <T>(key: string, fn: () => Promise<T>) => Promise<T | undefined>;
  /** Read-only snapshot of currently locked keys (for debugging / advanced UI). */
  lockedKeys: ReadonlySet<string>;
}

export function useActionLock(): ActionLockApi {
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  // Mirror in a ref so withLock's async path uses the latest set without
  // depending on render cycles.
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  const isLocked = useCallback((key: string) => lockedRef.current.has(key), []);

  const lock = useCallback((key: string) => {
    setLocked((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const unlock = useCallback((key: string) => {
    setLocked((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const withLock = useCallback(
    async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
      if (lockedRef.current.has(key)) return undefined;
      // Optimistically update both ref + state so concurrent calls see lock immediately
      lockedRef.current = new Set(lockedRef.current).add(key);
      setLocked(lockedRef.current);
      try {
        return await fn();
      } finally {
        const next = new Set(lockedRef.current);
        next.delete(key);
        lockedRef.current = next;
        setLocked(next);
      }
    },
    [],
  );

  return { isLocked, lock, unlock, withLock, lockedKeys: locked };
}
