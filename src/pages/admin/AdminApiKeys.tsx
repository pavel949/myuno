import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionHeader } from '@/components/ds';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Key, Shield, Globe, CheckCircle2, XCircle, ExternalLink, Copy, Save, RefreshCw, Lock, Settings2, Eye, EyeOff, Plus, Trash2, Pencil } from 'lucide-react';
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

const DEFAULT_CONFIG_KEYS = [
  { key: 'GOOGLE_MAPS_API_KEY', description: 'Google Maps (Places, Geocoding)', descriptionRu: 'Google Maps (Places, Геокодинг)' },
  { key: 'BYPASS_COMING_SOON', description: 'Bypass Coming Soon gate', descriptionRu: 'Обойти заглушку Coming Soon' },
  { key: 'PLATFORM_MAINTENANCE_MODE', description: 'Enable maintenance mode', descriptionRu: 'Режим обслуживания' },
];

export default function AdminApiKeys() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [configEdits, setConfigEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [revealedFrontend, setRevealedFrontend] = useState<Set<string>>(new Set());
  const [revealedConfigs, setRevealedConfigs] = useState<Set<string>>(new Set());

  // Add new config dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newConfigKey, setNewConfigKey] = useState('');
  const [newConfigValue, setNewConfigValue] = useState('');
  const [newConfigDesc, setNewConfigDesc] = useState('');

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

  const deleteConfig = async (key: string) => {
    setSaving(key);
    try {
      const { error } = await supabase.from('system_config').delete().eq('key', key);
      if (error) throw error;
      toast.success(isRu ? 'Удалено' : 'Deleted');
      fetchStatus();
    } catch (e) {
      toast.error(isRu ? 'Ошибка удаления' : 'Delete failed');
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const addNewConfig = async () => {
    if (!newConfigKey.trim()) return;
    setSaving(newConfigKey);
    try {
      const { error } = await supabase
        .from('system_config')
        .upsert({ 
          key: newConfigKey.trim().toUpperCase(), 
          value: newConfigValue, 
          description: newConfigDesc || null,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'key' });
      if (error) throw error;
      toast.success(isRu ? 'Добавлено' : 'Added');
      setNewConfigKey('');
      setNewConfigValue('');
      setNewConfigDesc('');
      setAddDialogOpen(false);
      fetchStatus();
    } catch (e) {
      toast.error(isRu ? 'Ошибка добавления' : 'Add failed');
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  const toggleReveal = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setFn(next);
  };

  const getConfigValue = (key: string) => {
    const edit = configEdits[key];
    if (edit !== undefined) return edit;
    const existing = configs.find(c => c.key === key);
    return existing?.value || '';
  };

  const maskValue = (value: string, revealed: boolean) => {
    if (revealed || !value) return value;
    if (value.length <= 8) return '••••••••';
    return value.slice(0, 4) + '•'.repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
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
                      ? <CheckCircle2 className="h-5 w-5 text-primary" />
                      : <XCircle className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{secret.key}</span>
                      {getManagedBadge(secret.managedBy)}
                      <Badge variant={secret.configured ? 'default' : 'destructive'} className="text-xs">
                        {secret.configured ? (isRu ? 'Настроен' : 'Active') : (isRu ? 'Не настроен' : 'Missing')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{secret.label} — {secret.description}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleReveal(revealedSecrets, setRevealedSecrets, secret.key)} title={isRu ? 'Показать статус' : 'Show status'}>
                      {revealedSecrets.has(secret.key) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
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
                {revealedSecrets.has(secret.key) && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="rounded-md bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
                      {secret.configured 
                        ? (isRu ? '✅ Ключ настроен и доступен в edge functions' : '✅ Key is configured and available in edge functions')
                        : (isRu ? '❌ Ключ отсутствует. Добавьте через Supabase Dashboard → Edge Functions → Secrets' : '❌ Key is missing. Add via Supabase Dashboard → Edge Functions → Secrets')}
                      {secret.url && !secret.configured && (
                        <span className="block mt-1">
                          {isRu ? 'Получить ключ: ' : 'Get key: '}
                          <a href={secret.url} target="_blank" rel="noopener noreferrer" className="underline text-primary">{secret.url}</a>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
          <Surface variant="card" padding="md" radius="lg" className="bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {isRu
                ? '⚠️ Backend секреты управляются через Supabase Dashboard → Edge Functions → Secrets. Значения никогда не передаются на клиент.'
                : '⚠️ Backend secrets are managed via Supabase Dashboard → Edge Functions → Secrets. Values are never exposed to the client.'}
            </p>
          </Surface>
        </TabsContent>

        {/* Frontend Variables Tab */}
        <TabsContent value="frontend" className="mt-4 space-y-3">
          {FRONTEND_VARS.map((v) => {
            const value = import.meta.env[v.key] as string | undefined;
            const isSet = !!value;
            const isRevealed = revealedFrontend.has(v.key);
            const displayValue = isSet 
              ? (isRevealed ? value : maskValue(value!, false))
              : (isRu ? 'Не задано' : 'Not set');
            return (
              <Card key={v.key}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {isSet 
                      ? <CheckCircle2 className="h-5 w-5 text-primary" />
                      : <XCircle className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium">{v.key}</span>
                      {getManagedBadge(v.managedBy)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                      {displayValue}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isSet && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleReveal(revealedFrontend, setRevealedFrontend, v.key)}>
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(isSet && isRevealed ? value! : v.key)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">{isRu ? 'Динамическая конфигурация' : 'Dynamic Configuration'}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                {isRu ? 'Добавить' : 'Add Key'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEFAULT_CONFIG_KEYS.map(({ key: configKey, description, descriptionRu }) => {
                const val = getConfigValue(configKey);
                const isRevealed = revealedConfigs.has(configKey);
                const hasValue = !!configs.find(c => c.key === configKey)?.value;
                return (
                  <div key={configKey} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="font-mono text-sm font-medium">{configKey}</label>
                        {hasValue && <Badge variant="secondary" className="text-xs">{isRu ? 'Задан' : 'Set'}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{isRu ? descriptionRu : description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={isRevealed ? 'text' : 'password'}
                          value={configEdits[configKey] !== undefined ? configEdits[configKey] : val}
                          onChange={(e) => setConfigEdits(prev => ({ ...prev, [configKey]: e.target.value }))}
                          placeholder={isRu ? 'Введите значение...' : 'Enter value...'}
                          className="font-mono text-sm pr-10"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => toggleReveal(revealedConfigs, setRevealedConfigs, configKey)}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={configEdits[configKey] === undefined || saving === configKey}
                        onClick={() => saveConfig(configKey)}
                      >
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {saving === configKey ? '...' : (isRu ? 'Сохранить' : 'Save')}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Additional configs from DB */}
              {configs
                .filter(c => !DEFAULT_CONFIG_KEYS.some(d => d.key === c.key))
                .map((config) => {
                  const isRevealed = revealedConfigs.has(config.key);
                  return (
                    <div key={config.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="font-mono text-sm font-medium">{config.key}</label>
                          <Badge variant="secondary" className="text-xs">{isRu ? 'Пользовательский' : 'Custom'}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteConfig(config.key)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {config.description && <p className="text-xs text-muted-foreground">{config.description}</p>}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={isRevealed ? 'text' : 'password'}
                            value={configEdits[config.key] !== undefined ? configEdits[config.key] : (config.value || '')}
                            onChange={(e) => setConfigEdits(prev => ({ ...prev, [config.key]: e.target.value }))}
                            className="font-mono text-sm pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => toggleReveal(revealedConfigs, setRevealedConfigs, config.key)}
                          >
                            {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={configEdits[config.key] === undefined || saving === config.key}
                          onClick={() => saveConfig(config.key)}
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          {saving === config.key ? '...' : (isRu ? 'Сохранить' : 'Save')}
                        </Button>
                      </div>
                    </div>
                  );
                })}
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

      {/* Add New Config Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRu ? 'Добавить конфигурацию' : 'Add Configuration'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isRu ? 'Ключ' : 'Key'}</Label>
              <Input
                value={newConfigKey}
                onChange={(e) => setNewConfigKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="MY_API_KEY"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Значение' : 'Value'}</Label>
              <Input
                value={newConfigValue}
                onChange={(e) => setNewConfigValue(e.target.value)}
                placeholder={isRu ? 'Введите значение...' : 'Enter value...'}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Описание (необязательно)' : 'Description (optional)'}</Label>
              <Input
                value={newConfigDesc}
                onChange={(e) => setNewConfigDesc(e.target.value)}
                placeholder={isRu ? 'Для чего этот ключ' : 'What this key is for'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={addNewConfig} disabled={!newConfigKey.trim()}>
              <Plus className="h-4 w-4 mr-1.5" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
