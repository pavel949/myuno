import React from 'react';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { SignalStack } from './SignalStack';

interface ActiveSituationProps {
  personas: UserPersona[];
  onRoleSheetOpen: () => void;
}

/** Both Home variants share real-only signals and honest source states. */
export function ActiveSituation(props: ActiveSituationProps) {
  return <SignalStack {...props} />;
}
