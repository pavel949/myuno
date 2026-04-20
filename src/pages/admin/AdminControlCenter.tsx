import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, BarChart3, DollarSign, Settings, FileText, History } from 'lucide-react';
import { ControlUsersTab } from '@/components/admin/control/ControlUsersTab';
import { ControlRolesTab } from '@/components/admin/control/ControlRolesTab';
import { ControlAnalyticsTab } from '@/components/admin/control/ControlAnalyticsTab';
import { ControlFinanceTab } from '@/components/admin/control/ControlFinanceTab';
import { ControlSystemTab } from '@/components/admin/control/ControlSystemTab';
import { ControlLogsTab } from '@/components/admin/control/ControlLogsTab';
import { ControlAuditTab } from '@/components/admin/control/ControlAuditTab';
import { PageShell, PageHeader } from '@/components/page';

export default function AdminControlCenter() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: isRussian ? 'Пользователи' : 'Users', icon: Users },
    { id: 'roles', label: isRussian ? 'Роли' : 'Roles', icon: Shield },
    { id: 'analytics', label: isRussian ? 'Аналитика' : 'Analytics', icon: BarChart3 },
    { id: 'finance', label: isRussian ? 'Финансы' : 'Finance', icon: DollarSign },
    { id: 'audit', label: isRussian ? 'Аудит' : 'Audit', icon: History },
    { id: 'system', label: isRussian ? 'Система' : 'System', icon: Settings },
    { id: 'logs', label: isRussian ? 'Логи' : 'Logs', icon: FileText },
  ];

  return (
    <PageShell width="wide">
      <PageHeader
        title={isRussian ? 'Центр управления' : 'Control Center'}
        subtitle={isRussian ? 'Пользователи, аналитика, настройки системы' : 'Users, analytics, system settings'}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 data-[state=active]:bg-background"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <ControlUsersTab />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <ControlRolesTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <ControlAnalyticsTab />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <ControlFinanceTab />
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <ControlSystemTab />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <ControlAuditTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <ControlLogsTab />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
