/**
 * LifeOS Admin Control Center
 * Per LIFE OS Contract: Orchestration layer, not replacement
 * 
 * Modules:
 * 1. Situations - Registry management
 * 2. Mappings - Core control (entity→situation)
 * 3. Resolver Preview - Safety testing
 * 4. Health - Monitoring & governance
 * 5. Quality - Trust monitoring
 * 6. Audit - Change history
 * 7. AI Insights - Read-only analysis (NO AUTO-EXECUTION)
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Link2, Eye, ShieldCheck, History, Activity, Brain, Route } from 'lucide-react';
import { LifeOSSituationsTab } from '@/components/admin/lifeos/LifeOSSituationsTab';
import { LifeOSMappingsTab } from '@/components/admin/lifeos/LifeOSMappingsTab';
import { LifeOSResolverPreviewTab } from '@/components/admin/lifeos/LifeOSResolverPreviewTab';
import { LifeOSQualityTab } from '@/components/admin/lifeos/LifeOSQualityTab';
import { LifeOSAuditTab } from '@/components/admin/lifeos/LifeOSAuditTab';
import { LifeOSHealthTab } from '@/components/admin/lifeos/LifeOSHealthTab';
import { ManualModeBadge } from '@/components/admin/lifeos/ManualModeBadge';
import { LifeOSAIPanel } from '@/components/admin/lifeos/LifeOSAIPanel';
import { LifeOSRoutesTab } from '@/components/admin/lifeos/LifeOSRoutesTab';

export default function AdminLifeOS() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('mappings');

  const tabs = [
    { 
      id: 'situations', 
      label: isRussian ? 'Ситуации' : 'Situations', 
      icon: Sparkles,
      description: isRussian ? 'Реестр' : 'Registry'
    },
    { 
      id: 'mappings', 
      label: isRussian ? 'Маппинги' : 'Mappings', 
      icon: Link2,
      description: isRussian ? 'Ядро' : 'Core'
    },
    { 
      id: 'routes', 
      label: isRussian ? 'Маршруты' : 'Routes', 
      icon: Route,
      description: isRussian ? 'Путь' : 'Path'
    },
    { 
      id: 'preview', 
      label: isRussian ? 'Предпросмотр' : 'Preview', 
      icon: Eye,
      description: isRussian ? 'Тест' : 'Test'
    },
    { 
      id: 'health', 
      label: isRussian ? 'Здоровье' : 'Health', 
      icon: Activity,
      description: isRussian ? 'Мониторинг' : 'Monitor'
    },
    { 
      id: 'quality', 
      label: isRussian ? 'Качество' : 'Quality', 
      icon: ShieldCheck,
      description: isRussian ? 'Доверие' : 'Trust'
    },
    { 
      id: 'audit', 
      label: isRussian ? 'Аудит' : 'Audit', 
      icon: History,
      description: isRussian ? 'Журнал' : 'Log'
    },
    { 
      id: 'ai', 
      label: isRussian ? 'ИИ Аналитик' : 'AI Insights', 
      icon: Brain,
      description: isRussian ? 'Только чтение' : 'Read-Only'
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              LifeOS {isRussian ? 'Управление' : 'Control'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRussian 
                ? 'Оркестрация каталога по жизненным ситуациям'
                : 'Catalog orchestration by life situations'}
            </p>
          </div>
        </div>
        <ManualModeBadge />
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

        <TabsContent value="situations" className="mt-4">
          <LifeOSSituationsTab />
        </TabsContent>

        <TabsContent value="mappings" className="mt-4">
          <LifeOSMappingsTab />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <LifeOSResolverPreviewTab />
        </TabsContent>

        <TabsContent value="routes" className="mt-4">
          <LifeOSRoutesTab />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <LifeOSHealthTab />
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <LifeOSQualityTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <LifeOSAuditTab />
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <LifeOSAIPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
