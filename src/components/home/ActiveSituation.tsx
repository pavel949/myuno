import React from 'react';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { useRoleSignals } from '@/hooks/useRoleSignals';
import { SignalStack } from './SignalStack';

interface ActiveSituationProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

/**
 * ActiveSituation — surface SignalStack only when there is a live signal.
 * Keeps the home screen quiet when the user has nothing in flight.
 */
export function ActiveSituation({ personas, onRoleSheetOpen }: ActiveSituationProps) {
  const { signals } = useRoleSignals(personas);
  // Only surface signals backed by real DB data — never render seed/demo
  // fallbacks on the home screen, so users don't see fake times like "08:40".
  const hasLiveSignal = personas.some(p => {
    const s = signals[p];
    return s?.isLive && (s.state === 'live' || s.state === 'warn');
  });

  if (!hasLiveSignal) return null;

  return <SignalStack personas={personas} onRoleSheetOpen={onRoleSheetOpen} />;
}
