export const USER_ACTIONS = ['suspend','activate','deactivate','delete','add_role','remove_role'] as const;
export type UserAction = typeof USER_ACTIONS[number];
const ROLES = ['guest','user','tourist','resident','partner','owner','staff','admin','ombudsman','vendor','property_owner','uno_team','finance','support','sales','investor','broker','property_manager'] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export type UserRequest = { action: UserAction; user_id: string; role?: string; hard_delete: boolean };
export function parseUserRequest(body: unknown): UserRequest | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  const action = input.action as UserAction;
  const user_id = typeof input.user_id === 'string' ? input.user_id.toLowerCase() : '';
  const role = typeof input.role === 'string' ? input.role : undefined;
  if (!USER_ACTIONS.includes(action) || !UUID.test(user_id)) return null;
  if (input.hard_delete !== undefined && typeof input.hard_delete !== 'boolean') return null;
  if ((action === 'add_role' || action === 'remove_role') && (!role || !ROLES.some(r => r === role))) return null;
  return { action, user_id, role, hard_delete: input.hard_delete === true };
}
export function isRoleAction(action: UserAction): boolean { return action === 'add_role' || action === 'remove_role'; }
export function userMutationDenial(input: UserRequest, actorId: string, targetIsAdmin: boolean): string | null {
  if (input.hard_delete) return 'Permanent deletion requires a separately approved workflow';
  if (isRoleAction(input.action)) {
    if (input.role === 'admin' || input.role === 'uno_team') return 'Protected role changes require a dedicated approved workflow';
  } else {
    if (input.user_id === actorId.toLowerCase()) return 'Cannot perform this action on yourself';
    if (targetIsAdmin) return 'Platform administrator lifecycle is protected';
  }
  return null;
}
