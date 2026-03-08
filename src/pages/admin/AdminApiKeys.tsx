import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionHeader } from '@/components/ds';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Shield, Globe, CheckCircle2, XCircle, ExternalLink, Copy, Save, RefreshCw, Lock, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecretStatus {
  key: string;
  label: string;
  description: string;
  url: string;
  managedBy: string;
  configured: boolean;
}

interface SystemConfig {
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

const FRONTEND_VARS = [
  { key: 'VITE_SUPABASE_URL', label: 'Backend URL', managedBy: 'system' },
  { key: 'VITE_SUPABASE_PUBLISHABLE_KEY', label: 'Backend Anon Key', managedBy: 'system' },
  { key: 'VITE_SUPABASE_PROJECT_ID', label: 'Project ID', managedBy: 'system' },
  { key: 'VITE_GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key', managedBy: 'manual' },
  { key: 'VITE_BYPASS_COMING_SOON', label: 'Bypass Coming Soon Gate', managedBy: 'manual' },
];

export default function AdminApiKeys() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [configEdits, setConfigEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-secrets-status');
      if (error) throw error;
      setSecrets(data.secrets || []);
      setConfigs(data.configs || []);
    } catch (e) {
      toast.error(isRu ? 'Не удалось загрузить статус' : 'Failed to load status');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const saveConfig = async (key: string) => {
    const value = configEdits[key];
    if (value === undefined) return;
    setSaving(key);
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
      toast.success(isRu ? 'Сохранено' : 'Saved');
      setConfigEdits(prev => { const n = { ...prev }; delete n[key]; return n; });
      fetchStatus();
    } catch (e) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  const getConfigValue = (key: string) => {
    const edit = configEdits[key];
    if (edit !== undefined) return edit;
    const existing = configs.find(c => c.key === key);
    return existing?.value || '';
  };

  const getManagedBadge = (managedBy: string) => {
    switch (managedBy) {
      case 'system': return <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />{isRu ? 'Системный' : 'System'}</Badge>;
      case 'connector': return <Badge variant="outline" className="text-xs"><Settings2 className="h-3 w-3 mr-1" />{isRu ? 'Коннектор' : 'Connector'}</Badge>;
      default: return <Badge variant="outline" className="text-xs">{isRu ? 'Ручной' : 'Manual'}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1536px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <SectionHeader
          title={isRu ? 'API ключи и секреты' : 'API Keys & Secrets'}
          subtitle={isRu ? 'Статус всех интеграций и конфигурации' : 'Status of all integrations and configuration'}
          icon={Key}
          size="lg"
        />
        <Button variant="outline" size="sm" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {isRu ? 'Обновить' : 'Refresh'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Surface variant="card" padding="md" radius="lg">
          <div className="text-2xl font-bold text-foreground">{secrets.filter(s => s.configured).length}</div>
          <div className="text-sm text-muted-foreground">{isRu ? 'Настроено' : 'Configured'}</div>
        </Surface>
        <Surface variant="card" padding="md" radius="lg">
          <div className="text-2xl font-bold text-destructive">{secrets.filter(s => !s.configured).length}</div>
          <div className="text-sm text-muted-foreground">{isRu ? 'Отсутствует' : 'Missing'}</div>
        </Surface>
        <Surface variant="card" padding="md" radius="lg">
          <div className="text-2xl font-bold text-foreground">{configs.length}</div>
          <div className="text-sm text-muted-foreground">{isRu ? 'Конфигов' : 'Configs'}</div>
        </Surface>
        <Surface variant="card" padding="md" radius="lg">
          <div className="text-2xl font-bold text-foreground">{FRONTEND_VARS.filter(v => !!import.meta.env[v.key]).length}/{FRONTEND_VARS.length}</div>
          <div className="text-sm text-muted-foreground">{isRu ? 'Env-переменных' : 'Env Vars'}</div>
        </Surface>
      </div>

      <Tabs defaultValue="backend" className="w-full">
        <TabsList>
          <TabsTrigger value="backend" className="gap-1.5">
            <Shield className="h-4 w-4" />
            {isRu ? 'Backend секреты' : 'Backend Secrets'}
          </TabsTrigger>
          <TabsTrigger value="frontend" className="gap-1.5">
            <Globe className="h-4 w-4" />
            {isRu ? 'Frontend переменные' : 'Frontend Variables'}
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            {isRu ? 'Конфигурация' : 'System Config'}
          </TabsTrigger>
        </TabsList>

        {/* Backend Secrets Tab */}
        <TabsContent value="backend" className="mt-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
          ) : (
            secrets.map((secret) => (
              <Card key={secret.key}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {secret.configured 
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <XCircle className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{secret.key}</span>
                      {getManagedBadge(secret.managedBy)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{secret.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(secret.key)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {secret.url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={secret.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          <Surface variant="card" padding="md" radius="lg" className="bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? '⚠️ Backend секреты управляются через Lovable Cloud → Settings → Secrets. Здесь отображается только их статус (настроен/не настроен).'
                : '⚠️ Backend secrets are managed via Lovable Cloud → Settings → Secrets. Only their status (configured/missing) is shown here.'}
            </p>
          </Surface>
        </TabsContent>

        {/* Frontend Variables Tab */}
        <TabsContent value="frontend" className="mt-4 space-y-3">
          {FRONTEND_VARS.map((v) => {
            const value = import.meta.env[v.key];
            const isSet = !!value;
            const masked = isSet ? (value.length > 20 ? value.slice(0, 8) + '•••' + value.slice(-4) : '••••••') : '';
            return (
              <Card key={v.key}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {isSet 
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <XCircle className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{v.key}</span>
                      {getManagedBadge(v.managedBy)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {isSet ? masked : (isRu ? 'Не задано' : 'Not set')}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(v.key)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          <Surface variant="card" padding="md" radius="lg" className="bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? '⚠️ Frontend переменные задаются в .env файле проекта и доступны только на этапе сборки.'
                : '⚠️ Frontend variables are set in the project .env file and are only available at build time.'}
            </p>
          </Surface>
        </TabsContent>

        {/* System Config Tab */}
        <TabsContent value="config" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isRu ? 'Динамическая конфигурация' : 'Dynamic Configuration'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['GOOGLE_MAPS_API_KEY', 'BYPASS_COMING_SOON', 'PLATFORM_MAINTENANCE_MODE'].map((configKey) => (
                <div key={configKey} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="font-mono text-sm font-medium block mb-1">{configKey}</label>
                    <Input
                      value={getConfigValue(configKey)}
                      onChange={(e) => setConfigEdits(prev => ({ ...prev, [configKey]: e.target.value }))}
                      placeholder={isRu ? 'Введите значение...' : 'Enter value...'}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    className="mt-5"
                    disabled={configEdits[configKey] === undefined || saving === configKey}
                    onClick={() => saveConfig(configKey)}
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    {saving === configKey ? '...' : (isRu ? 'Сохранить' : 'Save')}
                  </Button>
                </div>
              ))}

              {/* Show any additional configs from DB */}
              {configs
                .filter(c => !['GOOGLE_MAPS_API_KEY', 'BYPASS_COMING_SOON', 'PLATFORM_MAINTENANCE_MODE'].includes(c.key))
                .map((config) => (
                  <div key={config.key} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <label className="font-mono text-sm font-medium block mb-1">{config.key}</label>
                      <Input
                        value={getConfigValue(config.key)}
                        onChange={(e) => setConfigEdits(prev => ({ ...prev, [config.key]: e.target.value }))}
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="mt-5"
                      disabled={configEdits[config.key] === undefined || saving === config.key}
                      onClick={() => saveConfig(config.key)}
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {saving === config.key ? '...' : (isRu ? 'Сохранить' : 'Save')}
                    </Button>
                  </div>
                ))}
            </CardContent>
          </Card>
          <Surface variant="card" padding="md" radius="lg" className="bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Эти значения хранятся в базе данных и доступны приложению в реальном времени без пересборки.'
                : 'These values are stored in the database and available to the app in real-time without rebuilding.'}
            </p>
          </Surface>
        </TabsContent>
      </Tabs>
    </div>
  );
}
