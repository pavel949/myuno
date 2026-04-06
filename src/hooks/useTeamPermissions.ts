import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { typedFrom, type TeamMemberPermissionRow } from '@/lib/untypedTables';

export const MODULES = [
  { key: 'properties', labelEn: 'Properties', labelRu: 'Объекты' },
  { key: 'finance', labelEn: 'Finance', labelRu: 'Финансы' },
  { key: 'crm', labelEn: 'CRM & Sales', labelRu: 'CRM и продажи' },
  { key: 'tasks', labelEn: 'Tasks', labelRu: 'Задачи' },
  { key: 'bookings', labelEn: 'Bookings', labelRu: 'Бронирования' },
  { key: 'reports', labelEn: 'Reports', labelRu: 'Отчёты' },
  { key: 'staff', labelEn: 'Staff', labelRu: 'Команда' },
] as const;

export type ModuleKey = typeof MODULES[number]['key'];

export type TeamPermission = TeamMemberPermissionRow;

const permissionsTable = () => typedFrom('team_member_permissions');

export function useTeamPermissions() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['team-permissions', user?.id, companyId],
    queryFn: async () => {
      if (!user || !companyId) return [];
      const { data, error } = await permissionsTable()
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', companyId);
      if (error) throw error;
      return (data || []) as TeamMemberPermissionRow[];
    },
    enabled: !!user && !!companyId,
  });

  const canAccess = (module: ModuleKey, action: 'view' | 'edit' = 'view'): boolean => {
    if (activeCompany?.role === 'director' || activeCompany?.role === 'admin') return true;
    if (isLoading) return false;
    if (permissions.length === 0) return false;
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;
    return action === 'edit' ? perm.can_edit : perm.can_view;
  };

  return { permissions, isLoading, canAccess };
}

export function useMemberPermissions(userId: string | null) {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;

  return useQuery({
    queryKey: ['member-permissions', userId, companyId],
    queryFn: async () => {
      if (!userId || !companyId) return [];
      const { data, error } = await permissionsTable()
        .select('*')
        .eq('user_id', userId)
        .eq('company_id', companyId);
      if (error) throw error;
      return (data || []) as TeamMemberPermissionRow[];
    },
    enabled: !!userId && !!companyId,
  });
}

/**
 * Check if the current user can manage permissions in the active company.
 * Only directors can assign/modify permissions.
 */
export function useCanManagePermissions(): boolean {
  const { activeCompany } = useActiveCompany();
  return activeCompany?.role === 'director';
}

export function useUpdateMemberPermission() {
  const qc = useQueryClient();
  const { activeCompany } = useActiveCompany();
  const { user } = useAuth();
  const canManage = useCanManagePermissions();

  return useMutation({
    mutationFn: async (args: { userId: string; module: string; can_view: boolean; can_edit: boolean; can_export?: boolean; sub_permissions?: Record<string, boolean> }) => {
      const companyId = activeCompany?.company_id;
      if (!companyId || !user) throw new Error('No company');
      if (!canManage) throw new Error('Only directors can manage permissions');
      
      const { error } = await permissionsTable()
        .upsert({
          company_id: companyId,
          user_id: args.userId,
          module: args.module,
          can_view: args.can_view,
          can_edit: args.can_edit,
          can_export: args.can_export ?? false,
          sub_permissions: args.sub_permissions ?? {},
          granted_by: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,user_id,module' });
      if (error) throw error;
    },
    onSuccess: (_, args) => {
      qc.invalidateQueries({ queryKey: ['member-permissions', args.userId] });
    },
  });
}
