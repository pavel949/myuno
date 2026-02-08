import { useState } from 'react';
import { resolveIcon } from '@/lib/iconMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot, 
  Search, 
  ChevronRight,
  Loader2,
  Save,
  Tag,
  FileText,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface IntakeConfig {
  id: string;
  vertical_id: string;
  target_table: string;
  name_en: string;
  name_ru: string;
  icon: string | null;
  keywords: string[];
  required_fields: string[];
  optional_fields: string[];
  field_labels: Record<string, { en: string; ru: string; type?: string; enumValues?: string[] }>;
  is_active: boolean;
  sort_order: number;
}

export default function AdminIntakeConfigs() {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  const queryClient = useQueryClient();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedConfig, setEditedConfig] = useState<IntakeConfig | null>(null);

  // Fetch all intake configs
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-intake-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sys_intake_configs')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as unknown as IntakeConfig[];
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (config: IntakeConfig) => {
      const { error } = await supabase
        .from('sys_intake_configs')
        .update({
          name_en: config.name_en,
          name_ru: config.name_ru,
          icon: config.icon,
          keywords: config.keywords,
          required_fields: config.required_fields,
          optional_fields: config.optional_fields,
          field_labels: config.field_labels,
          is_active: config.is_active,
        })
        .eq('id', config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-intake-configs'] });
      queryClient.invalidateQueries({ queryKey: ['intake-configs'] });
      toast.success(t('Config saved', 'Конфиг сохранён'));
    },
    onError: (err) => {
      toast.error(t('Failed to save', 'Ошибка сохранения'));
      console.error(err);
    }
  });

  const selectedConfig = configs.find(c => c.id === selectedId);

  // When selecting a config, copy to editedConfig
  const handleSelect = (config: IntakeConfig) => {
    setSelectedId(config.id);
    setEditedConfig({ ...config });
  };

  // Filter by search
  const filteredConfigs = configs.filter(c =>
    c.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name_ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vertical_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = configs.filter(c => c.is_active).length;

  const handleSave = () => {
    if (editedConfig) {
      updateMutation.mutate(editedConfig);
    }
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              {t('AI Intake Configs', 'Конфиги AI Intake')}
            </h1>
            <p className="text-muted-foreground">
              {t('Configure vertical detection and field extraction for AI Intake Agent', 
                 'Настройка детекции вертикалей и извлечения полей для AI Intake агента')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{configs.length}</p>
                  <p className="text-xs text-muted-foreground">{t('Verticals', 'Вертикалей')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Tag className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">{t('Active', 'Активных')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {configs.reduce((sum, c) => sum + c.keywords.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('Keywords', 'Ключевых слов')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Config List */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('Verticals', 'Вертикали')}</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search...', 'Поиск...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredConfigs.map((config) => (
                      <button
                        key={config.id}
                        onClick={() => handleSelect(config)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedId === config.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {(() => { const Icon = resolveIcon(config.icon || '📦'); return <Icon className="w-5 h-5" />; })()}
                          <div>
                            <p className="text-sm font-medium">
                              {language === 'ru' ? config.name_ru : config.name_en}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {config.vertical_id} → {config.target_table}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!config.is_active && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {t('Off', 'Выкл')}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {config.keywords.length}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel - Editor */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {editedConfig ? (
                    <>
                      {(() => { const Icon = resolveIcon(editedConfig.icon || '📦'); return <Icon className="w-5 h-5" />; })()}
                      {language === 'ru' ? editedConfig.name_ru : editedConfig.name_en}
                    </>
                  ) : (
                    t('Select a vertical', 'Выберите вертикаль')
                  )}
                </CardTitle>
                {editedConfig && (
                  <Button 
                    onClick={handleSave} 
                    disabled={updateMutation.isPending}
                    size="sm"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t('Save', 'Сохранить')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editedConfig ? (
                <Tabs defaultValue="general">
                  <TabsList className="mb-4">
                    <TabsTrigger value="general">{t('General', 'Общее')}</TabsTrigger>
                    <TabsTrigger value="keywords">{t('Keywords', 'Ключевые слова')}</TabsTrigger>
                    <TabsTrigger value="fields">{t('Fields', 'Поля')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label>{t('Active', 'Активна')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('Enable this vertical for AI detection', 'Включить эту вертикаль для AI детекции')}
                        </p>
                      </div>
                      <Switch
                        checked={editedConfig.is_active}
                        onCheckedChange={(checked) => 
                          setEditedConfig({ ...editedConfig, is_active: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Name (EN)', 'Название (EN)')}</Label>
                        <Input
                          value={editedConfig.name_en}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, name_en: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Name (RU)', 'Название (RU)')}</Label>
                        <Input
                          value={editedConfig.name_ru}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, name_ru: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Icon (emoji)', 'Иконка (emoji)')}</Label>
                        <Input
                          value={editedConfig.icon || ''}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, icon: e.target.value })
                          }
                          placeholder="🏠"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Target Table', 'Целевая таблица')}</Label>
                        <Input
                          value={editedConfig.target_table}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="keywords" className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {t('Keywords for AI Detection', 'Ключевые слова для AI детекции')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('One keyword per line. AI uses these to detect the vertical from text.',
                           'По одному ключевому слову на строку. AI использует их для определения вертикали из текста.')}
                      </p>
                      <Textarea
                        value={editedConfig.keywords.join('\n')}
                        onChange={(e) => 
                          setEditedConfig({ 
                            ...editedConfig, 
                            keywords: e.target.value.split('\n').filter(k => k.trim()) 
                          })
                        }
                        rows={12}
                        className="font-mono text-sm"
                        placeholder="yacht\nяхта\nboat\nлодка"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('Current count:', 'Текущее количество:')} {editedConfig.keywords.length}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Required Fields', 'Обязательные поля')}</Label>
                        <Textarea
                          value={editedConfig.required_fields.join('\n')}
                          onChange={(e) => 
                            setEditedConfig({ 
                              ...editedConfig, 
                              required_fields: e.target.value.split('\n').filter(f => f.trim()) 
                            })
                          }
                          rows={6}
                          className="font-mono text-sm"
                          placeholder="name_en\nprice"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Optional Fields', 'Опциональные поля')}</Label>
                        <Textarea
                          value={editedConfig.optional_fields.join('\n')}
                          onChange={(e) => 
                            setEditedConfig({ 
                              ...editedConfig, 
                              optional_fields: e.target.value.split('\n').filter(f => f.trim()) 
                            })
                          }
                          rows={6}
                          className="font-mono text-sm"
                          placeholder="description_en\namenities"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('Field Labels (JSON)', 'Метки полей (JSON)')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Labels for extracted fields in both languages',
                           'Метки для извлечённых полей на обоих языках')}
                      </p>
                      <Textarea
                        value={JSON.stringify(editedConfig.field_labels, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditedConfig({ ...editedConfig, field_labels: parsed });
                          } catch {
                            // Invalid JSON, don't update
                          }
                        }}
                        rows={10}
                        className="font-mono text-xs"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    {t('Select a vertical to edit', 'Выберите вертикаль для редактирования')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
