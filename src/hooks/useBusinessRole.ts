import { useState, useCallback, useMemo } from 'react';
import { type BusinessRole, BUSINESS_ROLES } from '@/lib/businessRoles';

const STORAGE_KEY = 'uno-business-role';

/**
 * Hook to manage the user's active business role for dashboard composition.
 * Persists selection in localStorage.
 */
export function useBusinessRole() {
  const [role, setRoleState] = useState<BusinessRole>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in BUSINESS_ROLES) return stored as BusinessRole;
    } catch {}
    return 'property_manager';
  });

  const setRole = useCallback((newRole: BusinessRole) => {
    setRoleState(newRole);
    try { localStorage.setItem(STORAGE_KEY, newRole); } catch {}
  }, []);

  const config = useMemo(() => BUSINESS_ROLES[role], [role]);

  return { role, setRole, config };
}
