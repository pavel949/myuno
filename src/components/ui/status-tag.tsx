import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "done" | "active" | "waiting" | "blocked" | "neutral";

interface StatusTagProps extends ComponentPropsWithoutRef<"span"> {
  tone: StatusTone;
}

export function StatusTag({ tone, className, ...props }: StatusTagProps) {
  return <span {...props} className={cn("ds-status-tag", className)} data-tone={tone} />;
}

// Visual grouping for recorded workflow values. Callers keep the original state label.
const recordedTones: Partial<Record<string, StatusTone>> = {
  approved: 'done',
  completed: 'done',
  checked_out: 'done',
  paid: 'done',
  verified: 'done',
  checked_in: 'active',
  in_progress: 'active',
  en_route: 'active',
  pending: 'waiting',
  pending_payment: 'waiting',
  awaiting_payment: 'waiting',
  awaiting_approval: 'waiting',
  waiting: 'waiting',
  blocked: 'blocked',
  rejected: 'blocked',
  failed: 'blocked',
  expired: 'blocked',
};

export function recordedStatusTone(status: string | null | undefined): StatusTone {
  return status && Object.prototype.hasOwnProperty.call(recordedTones, status) ? recordedTones[status] ?? 'neutral' : 'neutral';
}
