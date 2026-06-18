import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionHeader } from '@/components/ds';
import { Surface } from '@/components/ui/surface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, MapPin, Languages, History, FileText, FolderTree, Database, Bot, Brain, TestTube, Users, Scale, FileEdit, Key, Flag, Building2 } from 'lucide-react';
import { ControlSystemTab } from '@/components/admin/control/ControlSystemTab';
import { ControlAuditTab } from '@/components/admin/control/ControlAuditTab';
import { ControlLogsTab } from '@/components/admin/control/ControlLogsTab';
import { FeatureFlagManager } from '@/components/admin/settings/FeatureFlagManager';
import { OrgProfileEditor } from '@/components/admin/settings/OrgProfileEditor';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface QuickLink {
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
}

const quickLinks: QuickLink[] = [
  { icon: MapPin, label: 'Cities & Regions', labelRu: 'Города', path: '/admin/cities' },
  { icon: Languages, label: 'Translations', labelRu: 'Переводы', path: '/admin/translations' },
  { icon: FolderTree, label: 'Taxonomy', labelRu: 'Таксономии', path: '/admin/taxonomy' },
  { icon: Database, label: 'Data Import', labelRu: 'Импорт данных', path: '/admin/data-import' },
  { icon: Brain, label: 'AI Command Center', labelRu: 'AI Центр', path: '/admin/ai-ops' },
  { icon: Bot, label: 'AI Agents', labelRu: 'AI Агенты', path: '/admin/ai-agents' },
  { icon: Users, label: 'UNO Team', labelRu: 'Команда UNO', path: '/admin/uno-team' },
  { icon: TestTube, label: 'QA Tests', labelRu: 'QA Тесты', path: '/admin/qa-test-runner' },
  { icon: Scale, label: 'Legal Documents', labelRu: 'Юр. документы', path: '/admin/legal-documents' },
  { icon: FileEdit, label: 'Vendor Content', labelRu: 'Контент вендоров', path: '/admin/vendor-content' },
  { icon: Key, label: 'API Keys & Secrets', labelRu: 'API ключи', path: '/admin/api-keys' },
];

export default function AdminSystemSettings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto w-full">
      <SectionHeader
        title={isRu ? 'Настройки системы' : 'System Settings'}
        subtitle={isRu ? 'Конфигурация, логи и системные инструменты' : 'Configuration, logs and system tools'}
        icon={Settings}
        size="lg"
      />

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {quickLinks.map((link) => (
          <Surface
            key={link.path}
            variant="card"
            padding="sm"
            radius="lg"
            className="cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2"
            onClick={() => navigate(link.path)}
          >
            <link.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">
              {isRu ? link.labelRu : link.label}
            </span>
          </Surface>
        ))}
      </div>

      {/* Tabs for System, Audit, Logs */}
      <Tabs defaultValue="system" className="w-full">
        <TabsList>
          <TabsTrigger value="system" className="gap-1.5">
            <Settings className="h-4 w-4" />
            {isRu ? 'Система' : 'System'}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <History className="h-4 w-4" />
            {isRu ? 'Аудит' : 'Audit'}
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <FileText className="h-4 w-4" />
            {isRu ? 'Логи' : 'Logs'}
          </TabsTrigger>
          <TabsTrigger value="flags" className="gap-1.5">
            <Flag className="h-4 w-4" />
            {isRu ? 'Флаги' : 'Flags'}
          </TabsTrigger>
          <TabsTrigger value="org" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            {isRu ? 'Организация' : 'Organization'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="mt-4">
          <ErrorBoundary>
            <ControlSystemTab />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <ErrorBoundary>
            <ControlAuditTab />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <ErrorBoundary>
            <ControlLogsTab />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="flags" className="mt-4">
          <ErrorBoundary>
            <FeatureFlagManager />
          </ErrorBoundary>
        </TabsContent>
        <TabsContent value="org" className="mt-4">
          <ErrorBoundary>
            <OrgProfileEditor />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
