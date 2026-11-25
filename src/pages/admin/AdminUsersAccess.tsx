import { PageShell } from '@/components/page/PageShell';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ds';
import { Users, Shield, Grid3x3 } from 'lucide-react';
import { ControlUsersTab } from '@/components/admin/control/ControlUsersTab';
import { ControlRolesTab } from '@/components/admin/control/ControlRolesTab';
import { AccessMatrix } from '@/components/admin/hq/AccessMatrix';

export default function AdminUsersAccess() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <PageShell width="workspace" className="space-y-4">
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
          <TabsTrigger value="matrix" className="gap-1.5">
            <Grid3x3 className="h-4 w-4" />
            {isRu ? 'Матрица доступа' : 'Access matrix'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <ControlUsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <ControlRolesTab />
        </TabsContent>
        <TabsContent value="matrix" className="mt-4">
          <AccessMatrix />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
