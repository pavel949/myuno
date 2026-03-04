import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorProspectsPipeline } from '@/components/admin/prospects/VendorProspectsPipeline';
import { VendorProspectsTable } from '@/components/admin/prospects/VendorProspectsTable';
import { VendorProspectsStats } from '@/components/admin/prospects/VendorProspectsStats';
import { VendorProspectImport } from '@/components/admin/prospects/VendorProspectImport';
import { SectionHeader } from '@/components/ds';
import { PageContainer } from '@/components/uno/PageContainer';
import { Kanban, Table, BarChart3, Upload, Users } from 'lucide-react';

export default function AdminVendorProspects() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('pipeline');

  return (
    <PageContainer>
      <SectionHeader
        title={isRussian ? 'Привлечение вендоров' : 'Vendor Acquisition'}
        subtitle={isRussian ? 'AI-агент для привлечения и обработки потенциальных партнёров' : 'AI-powered vendor prospecting and outreach'}
        icon={Users}
        size="lg"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="pipeline" className="gap-2 data-[state=active]:bg-background">
            <Kanban className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Pipeline' : 'Pipeline'}</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2 data-[state=active]:bg-background">
            <Table className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Таблица' : 'Table'}</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Статистика' : 'Stats'}</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2 data-[state=active]:bg-background">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">{isRussian ? 'Импорт' : 'Import'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <VendorProspectsPipeline />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <VendorProspectsTable />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <VendorProspectsStats />
        </TabsContent>
        <TabsContent value="import" className="mt-4">
          <VendorProspectImport />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
