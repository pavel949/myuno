import React, { createContext, useContext, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  LayoutDashboard,
  Megaphone,
  Users,
  GitBranch,
  Sparkles,
  BarChart3,
  Zap,
  Globe,
  UserCog,
  Search,
  Target,
  User,
  Magnet,
  LayoutTemplate,
} from 'lucide-react';
import { MCCMagnetsTab } from '@/components/admin/marketing/MCCMagnetsTab';
import { MCCLandingBuilderTab } from '@/components/admin/marketing/MCCLandingBuilderTab';
import { MCCControlTowerTab } from '@/components/admin/marketing/MCCControlTowerTab';
import { MCCOverviewTab } from '@/components/admin/marketing/MCCOverviewTab';
import { MCCCampaignsTab } from '@/components/admin/marketing/MCCCampaignsTab';
import { MCCLeadsTab } from '@/components/admin/marketing/MCCLeadsTab';
import { MCCFunnelsTab } from '@/components/admin/marketing/MCCFunnelsTab';
import { MCCContentLabTab } from '@/components/admin/marketing/MCCContentLabTab';
import { MCCAnalyticsTab } from '@/components/admin/marketing/MCCAnalyticsTab';
import { MCCAutomationTab } from '@/components/admin/marketing/MCCAutomationTab';
import { MCCLandingControlTab } from '@/components/admin/marketing/MCCLandingControlTab';
import { MCCUserStatesTab } from '@/components/admin/marketing/MCCUserStatesTab';
import { MCCFunnelDiagnosticsTab } from '@/components/admin/marketing/MCCFunnelDiagnosticsTab';
import { MCCCampaignCenterTab } from '@/components/admin/marketing/MCCCampaignCenterTab';
import { MCCUserTimelineTab } from '@/components/admin/marketing/MCCUserTimelineTab';

// ── Cross-tab navigation context ──
interface MCCNavContext {
  navigateTo: (tab: string, context?: Record<string, string>) => void;
  navContext: Record<string, string>;
}

const MCCNavigationContext = createContext<MCCNavContext>({
  navigateTo: () => {},
  navContext: {},
});

export function useMCCNavigation() {
  return useContext(MCCNavigationContext);
}

export default function MarketingDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [activeTab, setActiveTab] = React.useState('control-tower');
  const [navContext, setNavContext] = React.useState<Record<string, string>>({});

  const navigateTo = useCallback((tab: string, context?: Record<string, string>) => {
    if (context) setNavContext(context);
    setActiveTab(tab);
  }, []);

  const tabs = [
    { id: 'control-tower', label: 'Control Tower', icon: Activity },
    { id: 'overview', label: isRu ? 'Обзор' : 'Overview', icon: LayoutDashboard },
    { id: 'landings', label: isRu ? 'Лендинги' : 'Landings', icon: Globe },
    { id: 'builder', label: isRu ? 'Конструктор' : 'Builder', icon: LayoutTemplate },
    { id: 'magnets', label: isRu ? 'Магниты' : 'Magnets', icon: Magnet },
    { id: 'states', label: isRu ? 'Состояния' : 'States', icon: UserCog },
    { id: 'funnel-diag', label: isRu ? 'Воронка' : 'Funnel Diag', icon: Search },
    { id: 'campaigns', label: isRu ? 'Кампании' : 'Campaigns', icon: Megaphone },
    { id: 'campaign-rules', label: isRu ? 'Правила L1' : 'Rules L1', icon: Target },
    { id: 'leads', label: isRu ? 'Лиды' : 'Leads', icon: Users },
    { id: 'timeline', label: isRu ? 'Таймлайн' : 'Timeline', icon: User },
    { id: 'funnels', label: isRu ? 'Воронки' : 'Funnels', icon: GitBranch },
    { id: 'content', label: isRu ? 'Контент' : 'Content', icon: Sparkles },
    { id: 'analytics', label: isRu ? 'Аналитика' : 'Analytics', icon: BarChart3 },
    { id: 'automation', label: isRu ? 'Автоматизация' : 'Automation', icon: Zap },
  ];

  return (
    <MCCNavigationContext.Provider value={{ navigateTo, navContext }}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
                Marketing Command Center
              </span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Lead Factory • Growth OS • AI Marketing Brain
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="gap-1.5 data-[state=active]:bg-background text-xs"
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="control-tower" className="mt-4"><MCCControlTowerTab /></TabsContent>
          <TabsContent value="overview" className="mt-4"><MCCOverviewTab /></TabsContent>
          <TabsContent value="landings" className="mt-4"><MCCLandingControlTab /></TabsContent>
          <TabsContent value="builder" className="mt-4"><MCCLandingBuilderTab /></TabsContent>
          <TabsContent value="magnets" className="mt-4"><MCCMagnetsTab /></TabsContent>
          <TabsContent value="states" className="mt-4"><MCCUserStatesTab /></TabsContent>
          <TabsContent value="funnel-diag" className="mt-4"><MCCFunnelDiagnosticsTab /></TabsContent>
          <TabsContent value="campaigns" className="mt-4"><MCCCampaignsTab /></TabsContent>
          <TabsContent value="campaign-rules" className="mt-4"><MCCCampaignCenterTab /></TabsContent>
          <TabsContent value="leads" className="mt-4"><MCCLeadsTab /></TabsContent>
          <TabsContent value="timeline" className="mt-4"><MCCUserTimelineTab /></TabsContent>
          <TabsContent value="funnels" className="mt-4"><MCCFunnelsTab /></TabsContent>
          <TabsContent value="content" className="mt-4"><MCCContentLabTab /></TabsContent>
          <TabsContent value="analytics" className="mt-4"><MCCAnalyticsTab /></TabsContent>
          <TabsContent value="automation" className="mt-4"><MCCAutomationTab /></TabsContent>
        </Tabs>
      </div>
    </MCCNavigationContext.Provider>
  );
}
