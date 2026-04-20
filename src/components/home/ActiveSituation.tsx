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
  const hasLiveSignal = personas.some(p => {
    const s = signals[p];
    return s && (s.state === 'live' || s.state === 'warn');
  });

  if (!hasLiveSignal) return null;

  return <SignalStack personas={personas} onRoleSheetOpen={onRoleSheetOpen} />;
}
