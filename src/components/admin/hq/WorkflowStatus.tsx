/**
 * WorkflowStatus — the five workflow tones used across HQ (Round 4A):
 * done · active · waiting · blocked · neutral, mapped onto DS StatusPill.
 */
import type { ReactNode } from 'react';
import { StatusPill } from '@/components/ui/status-pill';

export type WorkflowTone = 'done' | 'active' | 'waiting' | 'blocked' | 'neutral';

const TONE_TO_PILL = {
  done: 'active',
  active: 'info',
  waiting: 'warning',
  blocked: 'danger',
  neutral: 'inactive',
} as const;

interface WorkflowStatusProps {
  tone: WorkflowTone;
  children: ReactNode;
  className?: string;
}

export function WorkflowStatus({ tone, children, className }: WorkflowStatusProps) {
  return (
    <StatusPill status={TONE_TO_PILL[tone]} dot={false} className={className}>
      {children}
    </StatusPill>
  );
}
