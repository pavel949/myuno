import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ds';
import { Users, Shield } from 'lucide-react';
import { ControlUsersTab } from '@/components/admin/control/ControlUsersTab';
import { ControlRolesTab } from '@/components/admin/control/ControlRolesTab';

export default function AdminUsersAccess() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto w-full">
      <SectionHeader
        title={isRu ? 'Пользователи и доступ' : 'Users & Access'}
        subtitle={isRu ? 'Управление пользователями, ролями и правами' : 'Manage users, roles and permissions'}
        icon={Users}
        size="lg"
      />

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            {isRu ? 'Пользователи' : 'Users'}
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1.5">
            <Shield className="h-4 w-4" />
            {isRu ? 'Роли и RBAC' : 'Roles & RBAC'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <ControlUsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <ControlRolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
