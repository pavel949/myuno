import React, { createContext, useContext, ReactNode } from 'react';
import { useHints, UseHintsReturn } from '@/hooks/useHints';

const HintContext = createContext<UseHintsReturn | null>(null);

interface HintProviderProps {
  children: ReactNode;
}

export function HintProvider({ children }: HintProviderProps) {
  const hints = useHints();
  
  return (
    <HintContext.Provider value={hints}>
      {children}
    </HintContext.Provider>
  );
}

export function useHintContext(): UseHintsReturn {
  const context = useContext(HintContext);
  if (!context) {
    throw new Error('useHintContext must be used within a HintProvider');
  }
  return context;
}

// Optional hook that won't throw if used outside provider
export function useOptionalHintContext(): UseHintsReturn | null {
  return useContext(HintContext);
}
