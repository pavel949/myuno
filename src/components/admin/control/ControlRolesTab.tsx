import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Star, Store, Building2, UserCog, Headphones } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const roleConfigs = [
  { key: 'admin', label: 'Admin', labelRu: 'Администратор', icon: Shield, color: 'bg-destructive' },
  { key: 'uno_team', label: 'myUNO Team', labelRu: 'Команда myUNO', icon: Headphones, color: 'bg-success' },
  { key: 'staff', label: 'Staff', labelRu: 'Сотрудник', icon: UserCog, color: 'bg-accent-amber' },
  { key: 'vendor', label: 'Service Provider', labelRu: 'Поставщик услуг', icon: Store, color: 'bg-accent-purple' },
  { key: 'property_owner', label: 'Property Owner', labelRu: 'Собственник недвижимости', icon: Building2, color: 'bg-accent-teal' },
  { key: 'user', label: 'User', labelRu: 'Пользователь', icon: Users, color: 'bg-info' },
];

export function ControlRolesTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Single query — fetch all role assignments, count in JS (1 DB call instead of 6)
  const { data: roleCounts, isLoading } = useQuery({
    queryKey: ['admin-role-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role');

      if (error) throw error;

      return (data || []).reduce<Record<string, number>>((acc, row) => {
        acc[row.role] = (acc[row.role] ?? 0) + 1;
        return acc;
      }, {});
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {isRussian ? 'Роли и права' : 'Roles & Permissions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleConfigs.map((role) => {
              const Icon = role.icon;
              const count = roleCounts?.[role.key] || 0;
              
              return (
                <Card key={role.key} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-none ${role.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{isRussian ? role.labelRu : role.label}</p>
                        {isLoading ? (
                          <Skeleton className="h-4 w-16 mt-1" />
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {count} {isRussian ? 'польз.' : 'users'}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {role.key}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-none space-y-2">
            <p className="text-sm font-medium">
              {isRussian ? 'Архитектура ролей' : 'Role Architecture'}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {isRussian ? 'Роли хранятся в таблице user_roles (безопасно)' : 'Roles stored in user_roles table (secure)'}</li>
              <li>• {isRussian ? 'Используйте has_role() для проверки прав' : 'Use has_role() for permission checks'}</li>
              <li>• {isRussian ? 'RLS политики защищают данные' : 'RLS policies protect data'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
