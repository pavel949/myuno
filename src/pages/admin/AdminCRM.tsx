import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminCrmDashboard } from '@/components/admin/crm/AdminCrmDashboard';
import { VendorProspectsPipeline } from '@/components/admin/prospects/VendorProspectsPipeline';
import { VendorProspectsTable } from '@/components/admin/prospects/VendorProspectsTable';
import { VendorProspectsStats } from '@/components/admin/prospects/VendorProspectsStats';
import { MCCLeadsTab } from '@/components/admin/marketing/MCCLeadsTab';
import { AdminOwnerProspects } from '@/components/admin/crm/AdminOwnerProspects';
import { AdminCrmActivityLog } from '@/components/admin/crm/AdminCrmActivityLog';
import { VendorOutreachPanel } from '@/components/admin/crm/VendorOutreachPanel';
import { BarChart3, Target, Users, Building2, Activity, Kanban, Table, Send } from 'lucide-react';

export default function AdminCRM() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [activeTab, setActiveTab] = useState('dashboard');
  const [vendorView, setVendorView] = useState<'pipeline' | 'table' | 'stats'>('pipeline');

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold">{isRu ? 'CRM — Привлечение' : 'CRM — Acquisition Hub'}</h1>
        <p className="text-muted-foreground text-sm">
          {isRu ? 'Единый центр привлечения вендоров, пользователей и собственников' : 'Unified hub for vendor, user & owner acquisition'}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Dashboard'}</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2 data-[state=active]:bg-background">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Вендоры' : 'Vendors'}</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Пользователи' : 'Users'}</span>
          </TabsTrigger>
          <TabsTrigger value="owners" className="gap-2 data-[state=active]:bg-background">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Собственники' : 'Owners'}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2 data-[state=active]:bg-background">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Активность' : 'Activity'}</span>
          </TabsTrigger>
          <TabsTrigger value="outreach" className="gap-2 data-[state=active]:bg-background">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{isRu ? 'Аутрич' : 'Outreach'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <AdminCrmDashboard />
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <div className="space-y-4">
            <div className="flex gap-1">
              <button onClick={() => setVendorView('pipeline')} className={`px-3 py-1.5 rounded text-sm ${vendorView === 'pipeline' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Kanban className="h-3.5 w-3.5 inline mr-1" />Pipeline
              </button>
              <button onClick={() => setVendorView('table')} className={`px-3 py-1.5 rounded text-sm ${vendorView === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Table className="h-3.5 w-3.5 inline mr-1" />{isRu ? 'Таблица' : 'Table'}
              </button>
              <button onClick={() => setVendorView('stats')} className={`px-3 py-1.5 rounded text-sm ${vendorView === 'stats' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <BarChart3 className="h-3.5 w-3.5 inline mr-1" />{isRu ? 'Статистика' : 'Stats'}
              </button>
            </div>
            {vendorView === 'pipeline' && <VendorProspectsPipeline />}
            {vendorView === 'table' && <VendorProspectsTable />}
            {vendorView === 'stats' && <VendorProspectsStats />}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <MCCLeadsTab />
        </TabsContent>

        <TabsContent value="owners" className="mt-4">
          <AdminOwnerProspects />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <AdminCrmActivityLog />
        </TabsContent>

        <TabsContent value="outreach" className="mt-4">
          <VendorOutreachPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
