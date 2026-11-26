import { PageShell } from '@/components/page/PageShell';
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ds';
import { Users, Shield } from 'lucide-react';
import { ControlUsersTab } from '@/components/admin/control/ControlUsersTab';
import { ControlRolesTab } from '@/components/admin/control/ControlRolesTab';
import { useSearchParams } from 'react-router-dom';
import { pickLang } from '@/lib/i18n/pickLang';

export default function AdminUsersAccess() {
  const { language } = useLanguage();
  const local = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [search, setSearch] = useSearchParams();
  const activeTab = search.get('tab') === 'roles' ? 'roles' : 'users';
  const changeTab = (tab: string) => {
    const next = new URLSearchParams(search);
    if (tab === 'roles') next.set('tab', 'roles');
    else next.delete('tab');
    setSearch(next, { replace: true });
  };

  return (
    <PageShell width="workspace" className="space-y-4">
      <SectionHeader
        title={local('Пользователи и доступ', 'People & access', 'ผู้ใช้และการเข้าถึง')}
        subtitle={local('Управление аккаунтами и назначенными ролями', 'Manage accounts and assigned roles', 'จัดการบัญชีและบทบาทที่ได้รับมอบหมาย')}
        icon={Users}
        size="lg"
      />

      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <TabsList
          className="flex h-auto w-full flex-wrap justify-start gap-1"
          aria-label={local('Разделы управления доступом', 'Access management sections', 'ส่วนการจัดการการเข้าถึง')}
        >
          <TabsTrigger value="users" className="min-h-11 gap-1.5">
            <Users className="size-4" aria-hidden="true" />
            {local('Пользователи', 'Users', 'ผู้ใช้')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="min-h-11 gap-1.5">
            <Shield className="size-4" aria-hidden="true" />
            {local('Роли и доступ', 'Roles & access', 'บทบาทและการเข้าถึง')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <ControlUsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <ControlRolesTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
