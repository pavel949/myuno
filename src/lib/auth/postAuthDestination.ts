import { APP_ROUTES } from '@/lib/config/routes';
import type { AppRole } from '@/types/auth';

interface PostAuthDestinationOptions {
  redirectPath: string;
  activeRole: AppRole;
  availableRoles: AppRole[];
  needsAccountType: boolean;
  hasMCMembership?: boolean;
  isMCPortal: boolean;
}

/** Navigation only. Workspace guards and server authorization remain authoritative. */
export function postAuthDestination({ redirectPath, activeRole, availableRoles, needsAccountType, isMCPortal, hasMCMembership = false }: PostAuthDestinationOptions): { path: string; activateRole?: AppRole } {
  // An invited employee already has an assigned work identity. Do not make them
  // create a customer/company identity just because primary_role is still empty.
  const employeeRole = needsAccountType
    ? hasMCMembership ? 'property_manager'
      : availableRoles.includes('uno_team') ? 'uno_team'
      : availableRoles.includes('staff') ? 'staff'
      : undefined
    : undefined;
  const role = employeeRole || activeRole;
  const activateRole = employeeRole && employeeRole !== activeRole ? employeeRole : undefined;

  if (needsAccountType && !employeeRole) {
    return { path: redirectPath !== APP_ROUTES.HOME
      ? `${APP_ROUTES.AUTH_ACCOUNT_TYPE}?redirect=${encodeURIComponent(redirectPath)}`
      : APP_ROUTES.AUTH_ACCOUNT_TYPE };
  }
  if (redirectPath !== APP_ROUTES.HOME) return { path: redirectPath, activateRole };

  const path = role === 'uno_team' ? APP_ROUTES.TEAM_CONTENT
    : role === 'staff' ? '/staff'
    : role === 'admin' ? '/admin'
    : role === 'vendor' ? '/vendor'
    : role === 'investor' ? '/invest'
    : role === 'property_manager' ? APP_ROUTES.MC_PROPERTIES
    : role === 'owner' ? (isMCPortal ? '/my-property' : '/mc')
    : isMCPortal ? '/my-property'
    : APP_ROUTES.HOME;
  return { path, activateRole };
}
