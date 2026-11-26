/**
 * HQ access policy — Design Bible Round 4A · H4 "People & access".
 *
 * One declarative view / edit / approve matrix per platform role and HQ area.
 * This is the reference shown to admins in /admin/users (Roles tab). Server
 * enforcement lives in RLS and in `public.hq_can_approve` (migration
 * 20261125120000_hq_dual_approvals.sql); `APPROVAL_ROLES` below must stay in
 * lockstep with that function — a unit test guards the pairing.
 */
import type { AppRole } from '@/types/auth';

export type HqArea =
  | 'reservations'
  | 'calendar'
  | 'guest_messages'
  | 'pricing'
  | 'refunds'
  | 'payouts'
  | 'clearview'
  | 'content'
  | 'people';

export interface HqPermission {
  view: boolean;
  edit: boolean;
  approve: boolean;
}

export const HQ_AREAS: { id: HqArea; labelEn: string; labelRu: string }[] = [
  { id: 'reservations', labelEn: 'Reservations', labelRu: 'Бронирования' },
  { id: 'calendar', labelEn: 'Calendar & blocks', labelRu: 'Календарь и блокировки' },
  { id: 'guest_messages', labelEn: 'Guest messages', labelRu: 'Сообщения гостей' },
  { id: 'pricing', labelEn: 'Pricing', labelRu: 'Цены' },
  { id: 'refunds', labelEn: 'Refunds', labelRu: 'Возвраты' },
  { id: 'payouts', labelEn: 'Payouts', labelRu: 'Выплаты' },
  { id: 'clearview', labelEn: 'ClearView', labelRu: 'ClearView' },
  { id: 'content', labelEn: 'Content', labelRu: 'Контент' },
  { id: 'people', labelEn: 'People & access', labelRu: 'Люди и доступ' },
];

/** Entities whose approval needs two distinct people (see hq_dual_approvals). */
export type DualApprovalEntity = 'payout_run' | 'clearview_report';

/** Mirrors `public.hq_can_approve`. */
export const APPROVAL_ROLES: Record<DualApprovalEntity, AppRole[]> = {
  payout_run: ['admin', 'finance'],
  clearview_report: ['admin'],
};

/** Payout runs above this total (THB) need two approvers. */
export const DUAL_APPROVAL_THRESHOLD_THB = 1_000_000;

const P = (view: boolean, edit: boolean, approve: boolean): HqPermission => ({ view, edit, approve });
const NONE = P(false, false, false);

type Matrix = Record<HqArea, HqPermission>;

const fill = (base: HqPermission, overrides: Partial<Matrix> = {}): Matrix => {
  const out = {} as Matrix;
  for (const a of HQ_AREAS) out[a.id] = overrides[a.id] ?? base;
  return out;
};

/** HQ-relevant roles only; consumer roles have no HQ access. */
export const HQ_ROLE_MATRIX: Partial<Record<AppRole, Matrix>> = {
  admin: fill(P(true, true, true)),
  ombudsman: fill(P(true, false, false), { refunds: P(true, true, false) }),
  finance: fill(NONE, {
    reservations: P(true, false, false),
    pricing: P(true, false, false),
    refunds: P(true, true, true),
    payouts: P(true, true, true),
  }),
  uno_team: fill(NONE, {
    reservations: P(true, true, false),
    calendar: P(true, true, false),
    guest_messages: P(true, true, false),
    pricing: P(true, false, false),
    refunds: P(true, false, false),
    content: P(true, true, false),
  }),
  staff: fill(NONE, {
    reservations: P(true, true, false),
    calendar: P(true, true, false),
    guest_messages: P(true, true, false),
  }),
  support: fill(NONE, {
    reservations: P(true, false, false),
    guest_messages: P(true, true, false),
    refunds: P(true, false, false),
  }),
  sales: fill(NONE, { reservations: P(true, false, false), pricing: P(true, false, false), content: P(true, false, false) }),
};

export const HQ_ROLES = Object.keys(HQ_ROLE_MATRIX) as AppRole[];

export function permissionFor(role: AppRole, area: HqArea): HqPermission {
  return HQ_ROLE_MATRIX[role]?.[area] ?? NONE;
}

/** Area that each dual-approval entity belongs to in the matrix. */
const ENTITY_AREA: Record<DualApprovalEntity, HqArea> = { payout_run: 'payouts', clearview_report: 'clearview' };

export function canApprove(roles: readonly AppRole[], entity: DualApprovalEntity): boolean {
  return roles.some((r) => APPROVAL_ROLES[entity].includes(r));
}

export { ENTITY_AREA };
