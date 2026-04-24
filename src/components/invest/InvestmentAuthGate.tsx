import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { openAuthSheet, isOpen } = useAuthSheet();

  useEffect(() => {
    if (isLoading || user || isOpen) return;
    openAuthSheet({
      intent: 'investment',
      onSuccess: () => {
        // Stay on the page — useAuth() will flip and unblur content.
      },
    });
  }, [user, isLoading, isOpen, openAuthSheet, navigate]);

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
