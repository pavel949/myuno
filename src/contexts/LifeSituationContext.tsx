/**
 * LifeSituationContext - Session-based life situation context
 * Per UX Contract §3: Life Situation = CONTEXT, not filter
 * - Stores life_situation_code in session state
 * - Applies to all screens while active
 * - Can be dismissed anytime (✕)
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LifeSituationContextValue {
  /** Active life situation code (null = no context) */
  activeCode: string | null;
  /** Active life situation title (for display) */
  activeTitle: string | null;
  /** Active life situation color */
  activeColor: string | null;
  /** Set active life situation */
  setLifeSituation: (code: string, title: string, color: string) => void;
  /** Clear active life situation */
  clearLifeSituation: () => void;
  /** Check if a specific situation is active */
  isActive: (code: string) => boolean;
}

const LifeSituationContext = createContext<LifeSituationContextValue | undefined>(undefined);

interface LifeSituationProviderProps {
  children: ReactNode;
}

export function LifeSituationProvider({ children }: LifeSituationProviderProps) {
  const [activeCode, setActiveCode] = useState<string | null>(() => {
    // Persist across page reloads within session
    return sessionStorage.getItem('life-situation-code');
  });
  const [activeTitle, setActiveTitle] = useState<string | null>(() => {
    return sessionStorage.getItem('life-situation-title');
  });
  const [activeColor, setActiveColor] = useState<string | null>(() => {
    return sessionStorage.getItem('life-situation-color');
  });

  const setLifeSituation = useCallback((code: string, title: string, color: string) => {
    setActiveCode(code);
    setActiveTitle(title);
    setActiveColor(color);
    sessionStorage.setItem('life-situation-code', code);
    sessionStorage.setItem('life-situation-title', title);
    sessionStorage.setItem('life-situation-color', color);
  }, []);

  const clearLifeSituation = useCallback(() => {
    setActiveCode(null);
    setActiveTitle(null);
    setActiveColor(null);
    sessionStorage.removeItem('life-situation-code');
    sessionStorage.removeItem('life-situation-title');
    sessionStorage.removeItem('life-situation-color');
  }, []);

  const isActive = useCallback((code: string) => {
    return activeCode === code;
  }, [activeCode]);

  return (
    <LifeSituationContext.Provider
      value={{
        activeCode,
        activeTitle,
        activeColor,
        setLifeSituation,
        clearLifeSituation,
        isActive,
      }}
    >
      {children}
    </LifeSituationContext.Provider>
  );
}

export function useLifeSituationContext() {
  const context = useContext(LifeSituationContext);
  if (!context) {
    throw new Error('useLifeSituationContext must be used within LifeSituationProvider');
  }
  return context;
}
