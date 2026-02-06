import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  GitBranch, 
  Sparkles,
  BarChart3,
  Zap,
  Globe,
  UserCog
} from 'lucide-react';
import { MCCOverviewTab } from '@/components/admin/marketing/MCCOverviewTab';
import { MCCCampaignsTab } from '@/components/admin/marketing/MCCCampaignsTab';
import { MCCLeadsTab } from '@/components/admin/marketing/MCCLeadsTab';
import { MCCFunnelsTab } from '@/components/admin/marketing/MCCFunnelsTab';
import { MCCContentLabTab } from '@/components/admin/marketing/MCCContentLabTab';
import { MCCAnalyticsTab } from '@/components/admin/marketing/MCCAnalyticsTab';
import { MCCAutomationTab } from '@/components/admin/marketing/MCCAutomationTab';
import { MCCLandingControlTab } from '@/components/admin/marketing/MCCLandingControlTab';
import { MCCUserStatesTab } from '@/components/admin/marketing/MCCUserStatesTab';

export default function MarketingDashboard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [activeTab, setActiveTab] = React.useState('overview');

  const tabs = [
    { 
      id: 'overview', 
      label: isRu ? 'Обзор' : 'Overview', 
      icon: LayoutDashboard,
    },
    { 
      id: 'landings', 
      label: isRu ? 'Лендинги' : 'Landings', 
      icon: Globe,
    },
    { 
      id: 'states', 
      label: isRu ? 'Состояния' : 'User States', 
      icon: UserCog,
    },
    { 
      id: 'campaigns', 
      label: isRu ? 'Кампании' : 'Campaigns', 
      icon: Megaphone,
    },
    { 
      id: 'leads', 
      label: isRu ? 'Лиды' : 'Leads', 
      icon: Users,
    },
    { 
      id: 'funnels', 
      label: isRu ? 'Воронки' : 'Funnels', 
      icon: GitBranch,
    },
    { 
      id: 'content', 
      label: isRu ? 'Контент' : 'Content Lab', 
      icon: Sparkles,
    },
    { 
      id: 'analytics', 
      label: isRu ? 'Аналитика' : 'Analytics', 
      icon: BarChart3,
    },
    { 
      id: 'automation', 
      label: isRu ? 'Автоматизация' : 'Automation', 
      icon: Zap,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">
              Marketing Command Center
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Lead Factory • Growth OS • AI Marketing Brain' : 'Lead Factory • Growth OS • AI Marketing Brain'}
          </p>
        </div>
      </div>

      {/* Tabs */}
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

        <TabsContent value="overview" className="mt-4">
          <MCCOverviewTab />
        </TabsContent>

        <TabsContent value="landings" className="mt-4">
          <MCCLandingControlTab />
        </TabsContent>

        <TabsContent value="states" className="mt-4">
          <MCCUserStatesTab />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <MCCCampaignsTab />
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <MCCLeadsTab />
        </TabsContent>

        <TabsContent value="funnels" className="mt-4">
          <MCCFunnelsTab />
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <MCCContentLabTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <MCCAnalyticsTab />
        </TabsContent>

        <TabsContent value="automation" className="mt-4">
          <MCCAutomationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
