import { useState } from 'react';
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
  MessageSquare, 
  Search, 
  ChevronRight,
  Loader2,
  Save,
  FormInput,
  Users,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadConfig {
  id: string;
  vertical_id: string;
  icon: string | null;
  name_en: string;
  name_ru: string;
  short_desc_en: string | null;
  short_desc_ru: string | null;
  cta_text_en: string | null;
  cta_text_ru: string | null;
  popularity_score: number;
  request_types: Array<{ value: string; labelEn: string; labelRu: string }>;
  fields: Array<{ 
    key: string; 
    type: string; 
    labelEn: string; 
    labelRu: string; 
    required?: boolean;
    options?: Array<{ value: string; labelEn: string; labelRu: string }>;
  }>;
  is_active: boolean;
}

export default function AdminLeadConfigs() {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  const queryClient = useQueryClient();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editedConfig, setEditedConfig] = useState<LeadConfig | null>(null);

  // Fetch all lead configs
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-lead-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sys_lead_configs')
        .select('*')
        .order('popularity_score', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as LeadConfig[];
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (config: LeadConfig) => {
      const { error } = await supabase
        .from('sys_lead_configs')
        .update({
          name_en: config.name_en,
          name_ru: config.name_ru,
          icon: config.icon,
          short_desc_en: config.short_desc_en,
          short_desc_ru: config.short_desc_ru,
          cta_text_en: config.cta_text_en,
          cta_text_ru: config.cta_text_ru,
          popularity_score: config.popularity_score,
          request_types: config.request_types,
          fields: config.fields,
          is_active: config.is_active,
        })
        .eq('id', config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lead-configs'] });
      queryClient.invalidateQueries({ queryKey: ['lead-configs'] });
      toast.success(t('Config saved', 'Конфиг сохранён'));
    },
    onError: (err) => {
      toast.error(t('Failed to save', 'Ошибка сохранения'));
      console.error(err);
    }
  });

  // When selecting a config, copy to editedConfig
  const handleSelect = (config: LeadConfig) => {
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
  const totalFields = configs.reduce((sum, c) => sum + (c.fields?.length || 0), 0);

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
              <MessageSquare className="h-6 w-6 text-primary" />
              {t('Lead Form Configs', 'Конфиги лид-форм')}
            </h1>
            <p className="text-muted-foreground">
              {t('Configure lead form fields and request types for each vertical', 
                 'Настройка полей лид-форм и типов запросов для каждой вертикали')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
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
                  <TrendingUp className="h-5 w-5 text-green-500" />
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
                  <FormInput className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalFields}</p>
                  <p className="text-xs text-muted-foreground">{t('Form Fields', 'Полей форм')}</p>
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
                          <span className="text-lg">{config.icon || '📝'}</span>
                          <div>
                            <p className="text-sm font-medium">
                              {language === 'ru' ? config.name_ru : config.name_en}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {config.vertical_id} • Score: {config.popularity_score}
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
                            {config.fields?.length || 0}
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
                      <span>{editedConfig.icon || '📝'}</span>
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
                    <TabsTrigger value="request_types">{t('Request Types', 'Типы запросов')}</TabsTrigger>
                    <TabsTrigger value="fields">{t('Form Fields', 'Поля формы')}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label>{t('Active', 'Активна')}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t('Show this vertical in lead forms', 'Показывать эту вертикаль в лид-формах')}
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
                        <Label>{t('Popularity Score', 'Популярность')}</Label>
                        <Input
                          type="number"
                          value={editedConfig.popularity_score}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, popularity_score: parseInt(e.target.value) || 0 })
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('Short Description (EN)', 'Краткое описание (EN)')}</Label>
                        <Input
                          value={editedConfig.short_desc_en || ''}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, short_desc_en: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('Short Description (RU)', 'Краткое описание (RU)')}</Label>
                        <Input
                          value={editedConfig.short_desc_ru || ''}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, short_desc_ru: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t('CTA Text (EN)', 'CTA Текст (EN)')}</Label>
                        <Input
                          value={editedConfig.cta_text_en || ''}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, cta_text_en: e.target.value })
                          }
                          placeholder="Get a Quote"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('CTA Text (RU)', 'CTA Текст (RU)')}</Label>
                        <Input
                          value={editedConfig.cta_text_ru || ''}
                          onChange={(e) => 
                            setEditedConfig({ ...editedConfig, cta_text_ru: e.target.value })
                          }
                          placeholder="Получить предложение"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="request_types" className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {t('Request Types (JSON Array)', 'Типы запросов (JSON массив)')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Options shown in the "Request Type" dropdown',
                           'Опции, показываемые в выпадающем списке "Тип запроса"')}
                      </p>
                      <Textarea
                        value={JSON.stringify(editedConfig.request_types || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditedConfig({ ...editedConfig, request_types: parsed });
                          } catch {
                            // Invalid JSON
                          }
                        }}
                        rows={12}
                        className="font-mono text-xs"
                        placeholder='[{"value": "rent", "labelEn": "Rent", "labelRu": "Аренда"}]'
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="fields" className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        {t('Form Fields (JSON Array)', 'Поля формы (JSON массив)')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('Dynamic fields for the lead form',
                           'Динамические поля для лид-формы')}
                      </p>
                      <Textarea
                        value={JSON.stringify(editedConfig.fields || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditedConfig({ ...editedConfig, fields: parsed });
                          } catch {
                            // Invalid JSON
                          }
                        }}
                        rows={16}
                        className="font-mono text-xs"
                        placeholder='[{"key": "budget", "type": "select", "labelEn": "Budget", "labelRu": "Бюджет", "required": true}]'
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('Supported types: text, select, number, date, textarea',
                           'Поддерживаемые типы: text, select, number, date, textarea')}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
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
