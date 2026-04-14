import { useState, useCallback, useMemo } from 'react';
import { 
  type BusinessRole, 
  BUSINESS_ROLES, 
  getBusinessRoleForMCRole,
  type MCCompanyRole,
  MC_ROLE_LABELS,
} from '@/lib/businessRoles';
import { useActiveCompany } from '@/hooks/useActiveCompany';

const STORAGE_KEY = 'uno-business-role';

/**
 * Hook to manage the user's active business role for dashboard composition.
 * 
 * When the user is a member of an MC, the default business role is automatically
 * derived from their company role (director → general, manager → property_manager, etc.)
 * The user can still manually override via the BusinessRoleSwitcher.
 */
export function useBusinessRole() {
  const { activeCompany } = useActiveCompany();
  const mcRole = activeCompany?.role as MCCompanyRole | undefined;

  // Derive default from MC role
  const defaultRole = useMemo(() => getBusinessRoleForMCRole(mcRole), [mcRole]);

  const [overrideRole, setOverrideState] = useState<BusinessRole | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in BUSINESS_ROLES) return stored as BusinessRole;
    } catch { /* ignored */ }
    return null;
  });

  // Use override if set, otherwise auto-derive from MC role
  const role = overrideRole ?? defaultRole;

  const setRole = useCallback((newRole: BusinessRole) => {
    setOverrideState(newRole);
    try { localStorage.setItem(STORAGE_KEY, newRole); } catch { /* ignored */ }
  }, []);

  const config = useMemo(() => BUSINESS_ROLES[role], [role]);

  // MC role label info for display
  const mcRoleLabel = useMemo(() => {
    if (!mcRole) return null;
    return MC_ROLE_LABELS[mcRole] || null;
  }, [mcRole]);

  return { role, setRole, config, mcRole, mcRoleLabel, defaultRole };
}
