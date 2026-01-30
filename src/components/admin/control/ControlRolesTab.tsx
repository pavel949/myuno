import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Star, Store } from 'lucide-react';

const roles = [
  { key: 'admin', label: 'Admin', labelRu: 'Администратор', icon: Shield, color: 'bg-red-500', count: 2 },
  { key: 'uno_team', label: 'UNO Team', labelRu: 'Команда UNO', icon: Star, color: 'bg-purple-500', count: 5 },
  { key: 'vendor', label: 'Vendor', labelRu: 'Продавец', icon: Store, color: 'bg-blue-500', count: 45 },
  { key: 'user', label: 'User', labelRu: 'Пользователь', icon: Users, color: 'bg-gray-500', count: 1250 },
];

export function ControlRolesTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <Card key={role.key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg ${role.color} flex items-center justify-center`}>
                      <role.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{isRussian ? role.labelRu : role.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {role.count} {isRussian ? 'польз.' : 'users'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isRussian 
                ? 'Управление ролями через таблицу user_roles. Используйте функцию has_role() для проверки прав.'
                : 'Roles are managed via user_roles table. Use has_role() function for permission checks.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
