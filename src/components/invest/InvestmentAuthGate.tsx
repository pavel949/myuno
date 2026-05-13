import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthSheet } from '@/contexts/AuthSheetContext';
import { cn } from '@/lib/utils';

interface InvestmentAuthGateProps {
  children: React.ReactNode;
}

/**
 * Gate for investment-only content. Routes unauthenticated users through the
 * unified AuthSheet (single source of truth for auth UI) instead of a custom
 * dialog + custom auth form. Content stays blurred until login completes.
 */
export function InvestmentAuthGate({ children }: InvestmentAuthGateProps) {
  const { user, isLoading } = useAuth();
  const { openAuthSheet, isOpen } = useAuthSheet();
  /** Avoid stale closures when deciding whether to auto-open after the sheet closes. */
  const userRef = useRef(user);
  const isOpenRef = useRef(isOpen);
  userRef.current = user;
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (isLoading || user || isOpen) return;

    /**
     * After a successful login, `onSuccess` closes the sheet before `user` is visible
     * in context for a frame or two. Without a deferred re-check we immediately call
     * `openAuthSheet` again and the sheet appears stuck. Re-check refs after a tick.
     */
    const id = window.setTimeout(() => {
      if (userRef.current || isOpenRef.current) return;
      openAuthSheet({
        intent: 'investment',
        onSuccess: () => {
          // Stay on the page — useAuth() will flip and unblur content.
        },
      });
    }, 150);

    return () => window.clearTimeout(id);
  }, [user, isLoading, isOpen, openAuthSheet]);

  return (
    <div
      className={cn(
        'transition-all duration-300',
        !user && !isLoading && 'blur-sm pointer-events-none select-none'
      )}
    >
      {children}
    </div>
  );
}
