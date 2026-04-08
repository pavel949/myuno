import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useUserRoles, ROLE_CONFIG } from '@/hooks/useUserRoles';
import { useQuery } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Shield, Building2, Key } from 'lucide-react';
import type { AppRole } from '@/types/auth';

interface MCMembership {
  company_id: string;
  role: string;
  company_name: string;
}

/**
 * Read-only display of user's platform roles, MC memberships, and module permissions.
 * Shown on profile page. Changes only via admin or MC director.
 */
export function UserRolesPermissions() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeRoles } = useUserRoles();
  const isRu = language === 'ru';

  // Fetch MC memberships
  const { data: memberships = [] } = useQuery({
    queryKey: ['user-mc-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('management_company_members')
        .select('company_id, role, management_companies!inner(name_en, name_ru)')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) return [];
      return (data || []).map((m: any) => ({
        company_id: m.company_id,
        role: m.role,
        company_name: isRu ? m.management_companies?.name_ru : m.management_companies?.name_en,
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch module permissions for active companies
  const { data: permissions = [] } = useQuery({
    queryKey: ['user-module-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await typedFrom('team_member_permissions')
        .select('company_id, module, can_view, can_edit, can_export')
        .eq('user_id', user.id);
      if (error) return [];
      return data || [];
    },
    enabled: !!user?.id && memberships.length > 0,
  });

  // Hide technical/system roles that don't carry meaning for end users
  const HIDDEN_ROLES: AppRole[] = ['user', 'staff', 'owner'];
  const visibleRoles = activeRoles.filter(r => !HIDDEN_ROLES.includes(r));

  if (visibleRoles.length === 0 && memberships.length === 0) return null;

  const roleLabel = (role: AppRole) => {
    const cfg = ROLE_CONFIG[role];
    return cfg ? (isRu ? cfg.labelRu : cfg.labelEn) : role;
  };

  const mcRoleLabel = (role: string) => {
    const map: Record<string, { en: string; ru: string }> = {
      director: { en: 'Director', ru: 'Директор' },
      admin: { en: 'Admin', ru: 'Администратор' },
      manager: { en: 'Manager', ru: 'Менеджер' },
      staff: { en: 'Staff', ru: 'Сотрудник' },
      accountant: { en: 'Accountant', ru: 'Бухгалтер' },
    };
    return map[role] ? (isRu ? map[role].ru : map[role].en) : role;
  };

  return (
    <div className="space-y-3">
      {/* Platform Roles */}
      {visibleRoles.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">
              {isRu ? 'Роли на платформе' : 'Platform Roles'}
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleRoles.map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {roleLabel(role)}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isRu ? 'Роли назначаются администратором' : 'Roles are assigned by administrators'}
          </p>
        </SectionCard>
      )}

      {/* MC Memberships */}
      {memberships.length > 0 && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-4 h-4 text-teal" />
            <h3 className="text-sm font-semibold">
              {isRu ? 'Управляющие компании' : 'Management Companies'}
            </h3>
          </div>
          <div className="space-y-2">
            {memberships.map((m) => (
              <div key={m.company_id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <span className="text-sm font-medium truncate">{m.company_name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {mcRoleLabel(m.role)}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Module Permissions (only for non-director staff) */}
      {permissions.length > 0 && memberships.some(m => !['director', 'admin'].includes(m.role)) && (
        <SectionCard>
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold">
              {isRu ? 'Доступы к модулям' : 'Module Access'}
            </h3>
          </div>
          <div className="space-y-1">
            {(permissions as any[]).map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1">
                <span className="font-medium capitalize">{p.module}</span>
                <div className="flex gap-1 ml-auto">
                  {p.can_view && <Badge variant="secondary" className="text-[10px] px-1.5">{isRu ? 'Просмотр' : 'View'}</Badge>}
                  {p.can_edit && <Badge variant="secondary" className="text-[10px] px-1.5">{isRu ? 'Редакт.' : 'Edit'}</Badge>}
                  {p.can_export && <Badge variant="secondary" className="text-[10px] px-1.5">{isRu ? 'Экспорт' : 'Export'}</Badge>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isRu ? 'Управляется директором компании' : 'Managed by company director'}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
