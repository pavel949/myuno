import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface AdminWorkspaceTab {
  value: string;
  labelEn: string;
  labelRu: string;
  content: ReactNode;
}

interface AdminTabbedWorkspaceProps {
  titleEn: string;
  titleRu: string;
  subtitleEn: string;
  subtitleRu: string;
  tabs: AdminWorkspaceTab[];
}

export function resolveAdminWorkspaceTab(requested: string | null, tabs: Pick<AdminWorkspaceTab, 'value'>[]): string {
  return tabs.some((tab) => tab.value === requested) ? requested! : tabs[0]?.value ?? '';
}

/** Shared URL-addressable tabs for consolidated admin workspaces. */
export function AdminTabbedWorkspace({
  titleEn,
  titleRu,
  subtitleEn,
  subtitleRu,
  tabs,
}: AdminTabbedWorkspaceProps) {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';
  const title = isRu ? titleRu : titleEn;
  const activeTab = resolveAdminWorkspaceTab(searchParams.get('tab'), tabs);

  const selectTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === tabs[0]?.value) next.delete('tab');
    else next.set('tab', value);
    setSearchParams(next);
  };

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={isRu ? subtitleRu : subtitleEn} />
      <Tabs value={activeTab} onValueChange={selectTab} className="w-full">
        <TabsList aria-label={`${title} sections`} className="flex h-auto w-full flex-wrap justify-start gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="min-h-11 flex-none px-3 sm:flex-1">
              {isRu ? tab.labelRu : tab.labelEn}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-2">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
}
