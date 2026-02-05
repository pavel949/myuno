// Auth components barrel export
export { RoleGuard, withRoleGuard, AdminGuard, VendorGuard, OwnerGuard, TeamGuard, AuthGuard } from './RoleGuard';
export { AccessDenied, RoleRequiredGate } from './AccessDenied';
export { 
  RoleScopeBadge, 
  RoleScopeDisplay, 
  RoleScopeLegend, 
  RoleScopeLegendInline,
  ROLE_SCOPE_CODES,
} from './RoleScopeLegend';
export { 
  RoleTransitionCard, 
  AvailableRoleTransitions, 
  PendingRoleStatus,
} from './RoleTransitionGuide';
