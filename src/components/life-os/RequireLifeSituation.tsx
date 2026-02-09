/**
 * RequireLifeSituation — P0.3 Route Guard
 * Wraps vertical routes to enforce LifeSituation context.
 * If no context → shows LifeSituationGate instead of the route content.
 */
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LifeSituationGate } from './LifeSituationGate';

interface RequireLifeSituationProps {
  children: React.ReactNode;
}

export function RequireLifeSituation({ children }: RequireLifeSituationProps) {
  return (
    <LifeSituationGate allowBypass={true}>
      {children}
    </LifeSituationGate>
  );
}

export default RequireLifeSituation;
