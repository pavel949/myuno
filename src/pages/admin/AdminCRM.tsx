import { PageHeader } from '@/components/page/PageHeader';
import { PageShell } from '@/components/page/PageShell';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminCrmDashboard } from '@/components/admin/crm/AdminCrmDashboard';
import { VendorProspectsPipeline } from '@/components/admin/prospects/VendorProspectsPipeline';
import { VendorProspectsTable } from '@/components/admin/prospects/VendorProspectsTable';
import { VendorProspectsStats } from '@/components/admin/prospects/VendorProspectsStats';
import { AdminOwnerProspects } from '@/components/admin/crm/AdminOwnerProspects';
import { AdminCrmActivityLog } from '@/components/admin/crm/AdminCrmActivityLog';
import { VendorOutreachPanel } from '@/components/admin/crm/VendorOutreachPanel';
import { BarChart3, Target, Building2, Activity, Kanban, Table, Send } from 'lucide-react';
import { CompanySwitcher } from '@/components/crm/CompanySwitcher';

const CRM_TABS = ['dashboard', 'vendors', 'owners', 'activity', 'outreach'];

export default function AdminCRM() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') ?? '';
  const activeTab = CRM_TABS.includes(requestedTab) ? requestedTab : 'dashboard';

  const setActiveTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'dashboard') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next);
  };
  const [vendorView, setVendorView] = useState<'pipeline' | 'table' | 'stats'>('pipeline');

  return (
    <PageShell width="workspace" className="space-y-4">
      <PageHeader
        title={isRu ? 'CRM — Привлечение' : 'CRM — Acquisition Hub'}
        subtitle={isRu ? 'Привлечение поставщиков и собственников' : 'Supplier and owner acquisition'}
        actions={<CompanySwitcher />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="dashboard" className="min-h-11 flex-none gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>{isRu ? 'Обзор' : 'Dashboard'}</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="min-h-11 flex-none gap-2">
            <Target className="h-4 w-4" />
            <span>{isRu ? 'Вендоры' : 'Vendors'}</span>
          </TabsTrigger>
          <TabsTrigger value="owners" className="min-h-11 flex-none gap-2">
            <Building2 className="h-4 w-4" />
            <span>{isRu ? 'Собственники' : 'Owners'}</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="min-h-11 flex-none gap-2">
            <Activity className="h-4 w-4" />
            <span>{isRu ? 'Активность' : 'Activity'}</span>
          </TabsTrigger>
          <TabsTrigger value="outreach" className="min-h-11 flex-none gap-2">
            <Send className="h-4 w-4" />
            <span>{isRu ? 'Аутрич' : 'Outreach'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <AdminCrmDashboard />
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-1">
              <button type="button" aria-pressed={vendorView === 'pipeline'} onClick={() => setVendorView('pipeline')} className={`min-h-11 px-3 rounded-none text-sm ${vendorView === 'pipeline' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Kanban className="h-3.5 w-3.5 inline mr-1" />{isRu ? 'Воронка' : 'Pipeline'}
              </button>
              <button type="button" aria-pressed={vendorView === 'table'} onClick={() => setVendorView('table')} className={`min-h-11 px-3 rounded-none text-sm ${vendorView === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <Table className="h-3.5 w-3.5 inline mr-1" />{isRu ? 'Таблица' : 'Table'}
              </button>
              <button type="button" aria-pressed={vendorView === 'stats'} onClick={() => setVendorView('stats')} className={`min-h-11 px-3 rounded-none text-sm ${vendorView === 'stats' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <BarChart3 className="h-3.5 w-3.5 inline mr-1" />{isRu ? 'Статистика' : 'Stats'}
              </button>
            </div>
            {vendorView === 'pipeline' && <VendorProspectsPipeline />}
            {vendorView === 'table' && <VendorProspectsTable />}
            {vendorView === 'stats' && <VendorProspectsStats />}
          </div>
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
    </PageShell>
  );
}
