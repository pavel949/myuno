/**
 * @module useActiveCompany
 * @description Context for active management company selection.
 * Persists to localStorage so the choice survives page refreshes.
 * On company switch, invalidates ALL React Query cache to prevent data leaks.
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

export interface UserCompanyMembership {
  company_id: string;
  role: string;
  name_en: string;
  name_ru: string;
  logo: string | null;
}

interface ActiveCompanyContextValue {
  /** All companies the user belongs to */
  companies: UserCompanyMembership[];
  /** Currently selected company (or first available) */
  activeCompany: UserCompanyMembership | null;
  /** Switch to a different company — invalidates all cached data */
  setActiveCompanyId: (id: string) => void;
  isLoading: boolean;
}

const ActiveCompanyContext = createContext<ActiveCompanyContextValue>({
  companies: [],
  activeCompany: null,
  setActiveCompanyId: () => {},
  isLoading: true,
});

const STORAGE_KEY = 'uno-active-company-id';

/** Query keys that are NOT company-scoped and should survive a switch */
const PRESERVED_KEY_PREFIXES = ['user-companies', 'user-roles', 'user-context', 'profile'];

interface MCMemberRow {
  company_id: string;
  role: string;
  management_companies: {
    name_en: string;
    name_ru: string;
    logo: string | null;
  };
}

export function ActiveCompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['user-companies', user?.id],
    queryFn: async (): Promise<UserCompanyMembership[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('management_company_members')
        .select('company_id, role, management_companies!inner(name_en, name_ru, logo)')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return (data || []).map((m: MCMemberRow) => ({
        company_id: m.company_id,
        role: m.role,
        name_en: m.management_companies.name_en,
        name_ru: m.management_companies.name_ru,
        logo: m.management_companies.logo,
      })).sort((a, b) => a.name_en.localeCompare(b.name_en));
    },
    enabled: !!user,
  });

  const activeCompany = useMemo(() => {
    if (companies.length === 0) return null;
    const found = selectedId ? companies.find(c => c.company_id === selectedId) : null;
    return found || companies[0];
  }, [companies, selectedId]);

  const setActiveCompanyId = useCallback((id: string) => {
    if (id === selectedId) return; // no-op if same company
    
    setSelectedId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* best-effort, ignore storage errors */ }

    // Invalidate all company-scoped queries to prevent stale data from another MC
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (!Array.isArray(key) || key.length === 0) return true;
        const prefix = String(key[0]);
        return !PRESERVED_KEY_PREFIXES.includes(prefix);
      },
    });
  }, [selectedId, queryClient]);

  // Sync if the stored id doesn't match any company
  useEffect(() => {
    if (!isLoading && companies.length > 0 && activeCompany) {
      if (selectedId !== activeCompany.company_id) {
        setSelectedId(activeCompany.company_id);
      }
    }
  }, [isLoading, companies, activeCompany, selectedId]);

  return React.createElement(
    ActiveCompanyContext.Provider,
    { value: { companies, activeCompany, setActiveCompanyId, isLoading } },
    children
  );
}

export function useActiveCompany() {
  return useContext(ActiveCompanyContext);
}
