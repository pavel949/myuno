/**
 * @module useActiveCompany
 * @description Context for active management company selection.
 * Persists to localStorage so the choice survives page refreshes.
 */

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  /** Switch to a different company */
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

export function ActiveCompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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
      return (data || []).map((m: any) => ({
        company_id: m.company_id,
        role: m.role,
        name_en: m.management_companies.name_en,
        name_ru: m.management_companies.name_ru,
        logo: m.management_companies.logo,
      }));
    },
    enabled: !!user,
  });

  const activeCompany = useMemo(() => {
    if (companies.length === 0) return null;
    const found = selectedId ? companies.find(c => c.company_id === selectedId) : null;
    return found || companies[0];
  }, [companies, selectedId]);

  const setActiveCompanyId = (id: string) => {
    setSelectedId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
  };

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
