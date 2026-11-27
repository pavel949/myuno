import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Settings, 
  Database, 
  ChevronRight,
  Loader2,
  FolderTree,
  Bot,
  FileText
} from 'lucide-react';
import { 
  useTaxonomyDefinitions, 
  VERTICAL_CONFIG,
  TaxonomyVertical,
  TaxonomyWithCount 
} from '@/hooks/useTaxonomyDefinitions';
import TaxonomyValueEditor from '@/components/admin/taxonomy/TaxonomyValueEditor';
import TaxonomyBulkActions from '@/components/admin/taxonomy/TaxonomyBulkActions';
import TaxonomySchemaEditor from '@/components/admin/taxonomy/TaxonomySchemaEditor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function AdminTaxonomyManager() {
  const { language } = useLanguage();
  const t = (en: string, ru: string) => language === 'ru' ? ru : en;
  
  const { definitions, groupedByVertical, isLoading, isError, refetch, create, isCreating } = useTaxonomyDefinitions();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ type_key: '', name_en: '', name_ru: '', vertical: 'general' });
  const [createError, setCreateError] = useState('');
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'values'>('browse');

  const selectedDefinition = definitions.find(d => d.type_key === selectedType);

  // Filter types by search
  const filteredGroups = Object.entries(groupedByVertical).reduce((acc, [vertical, types]) => {
    const typesArray = types as TaxonomyWithCount[];
    const filtered = typesArray.filter((t: TaxonomyWithCount) => 
      t.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name_ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type_key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[vertical as TaxonomyVertical] = filtered;
    }
    return acc;
  }, {} as Record<TaxonomyVertical, TaxonomyWithCount[]>);

  const totalValues = definitions.reduce((sum, d) => sum + d.value_count, 0);

  const navigate = useNavigate();

  const createType = async (event: React.FormEvent) => {
    event.preventDefault();
    const key = draft.type_key.trim();
    if (!/^[a-z][a-z0-9_]*$/.test(key) || definitions.some(item => item.type_key === key)) {
      setCreateError(t('Use a unique key containing lowercase Latin letters, numbers and underscores.', 'Укажите уникальный ключ: латинские буквы в нижнем регистре, цифры и подчёркивания.'));
      return;
    }
    setCreateError('');
    try {
      await create({ ...draft, type_key: key, name_en: draft.name_en.trim(), name_ru: draft.name_ru.trim(),
        icon: '', supports_hierarchy: false, metadata_schema: {}, is_system: false, sort_order: 0, is_active: true });
      setSelectedType(key);
      setActiveTab('values');
      setCreating(false);
      setDraft({ type_key: '', name_en: '', name_ru: '', vertical: 'general' });
    } catch {
      setCreateError(t('Could not create the type. Your entries have been preserved; refresh the list before retrying.', 'Не удалось создать тип. Введённые данные сохранены; обновите список перед повторной попыткой.'));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Dialog open={creating} onOpenChange={open => { if (!isCreating) setCreating(open); }}>
        <DialogContent><DialogHeader><DialogTitle>{t('New taxonomy type', 'Новый тип справочника')}</DialogTitle></DialogHeader>
          <form onSubmit={createType} className="space-y-4">
            {(['type_key', 'name_en', 'name_ru'] as const).map((field, index) => <div key={field} className="space-y-2">
              <Label htmlFor={`taxonomy-${field}`}>{[t('Key', 'Ключ'), t('English name', 'Название на английском'), t('Russian name', 'Название на русском')][index]}</Label>
              <Input id={`taxonomy-${field}`} required maxLength={120} disabled={isCreating} value={draft[field]} onChange={event => setDraft(previous => ({ ...previous, [field]: event.target.value }))} />
            </div>)}
            <div className="space-y-2"><Label htmlFor="taxonomy-vertical">{t('Vertical', 'Направление')}</Label>
              <select id="taxonomy-vertical" className="min-h-11 w-full border border-input bg-background px-3" disabled={isCreating} value={draft.vertical} onChange={event => setDraft(previous => ({ ...previous, vertical: event.target.value }))}>
                {Object.entries(VERTICAL_CONFIG).map(([key, config]) => <option key={key} value={key}>{language === 'ru' ? config.labelRu : config.labelEn}</option>)}
              </select>
            </div>
            {createError && <p role="alert" className="text-sm text-destructive">{createError}</p>}
            <Button type="submit" className="min-h-11" disabled={isCreating}>{isCreating ? t('Saving…', 'Сохранение…') : t('Create type', 'Создать тип')}</Button>
          </form>
        </DialogContent>
      </Dialog>
      {isError && <div role="alert" className="space-y-2"><p>{t('Could not load taxonomy definitions.', 'Не удалось загрузить справочники.')}</p><Button variant="outline" onClick={() => refetch()}>{t('Retry', 'Повторить')}</Button></div>}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('Taxonomy', 'Таксономия')}</h1>
            <p className="text-muted-foreground">{t('Single source of truth for all platform categories', 'Единый источник всех категорий платформы')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings/forms?tab=intake')}>
              <Bot className="h-4 w-4 mr-2" />
              {t('Data intake settings', 'Настройки приёма данных')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings/forms')}>
              <FileText className="h-4 w-4 mr-2" />
              {t('Request forms', 'Формы заявок')}
            </Button>
          </div>
        </div>
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{definitions.length}</p>
                <p className="text-xs text-muted-foreground">{t('Types', 'Типов')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-success/10">
                <FolderTree className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalValues}</p>
                <p className="text-xs text-muted-foreground">{t('Values', 'Значений')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-info/10">
                <span className="text-xl">🏠</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(groupedByVertical).length}</p>
                <p className="text-xs text-muted-foreground">{t('Verticals', 'Вертикалей')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-none bg-accent-purple/10">
                <Settings className="h-5 w-5 text-accent-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {definitions.filter(d => d.supports_hierarchy).length}
                </p>
                <p className="text-xs text-muted-foreground">{t('Hierarchical', 'С иерархией')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Type Browser */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('Taxonomy Types', 'Типы справочников')}</CardTitle>
              <Button size="sm" variant="outline" className="min-h-11" disabled={isLoading || isError} onClick={() => { setCreateError(''); setCreating(true); }}>
                <Plus className="h-4 w-4 mr-1" />
                {t('Add', 'Добавить')}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search types...', 'Поиск типов...')}
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
                <div className="space-y-4 p-4">
                  {Object.entries(filteredGroups).map(([vertical, types]) => {
                    const config = VERTICAL_CONFIG[vertical as TaxonomyVertical];
                    return (
                      <div key={vertical}>
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <span className="text-lg">{config?.icon || '📁'}</span>
                          <span className="text-sm font-medium text-muted-foreground">
                            {language === 'ru' ? config?.labelRu : config?.labelEn}
                          </span>
                          <Badge variant="secondary" className="text-xs ml-auto">
                            {types.length}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          {types.map((type) => (
                            <button
                              key={type.id}
                              onClick={() => {
                                setSelectedType(type.type_key);
                                setActiveTab('values');
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-left transition-colors ${
                                selectedType === type.type_key
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{type.icon || '📋'}</span>
                                <div>
                                  <p className="text-sm font-medium">
                                    {language === 'ru' ? type.name_ru : type.name_en}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {type.type_key}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {type.value_count}
                                </Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Panel - Value Editor */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {selectedDefinition ? (
                    <>
                      <span>{selectedDefinition.icon || '📋'}</span>
                      {language === 'ru' ? selectedDefinition.name_ru : selectedDefinition.name_en}
                    </>
                  ) : (
                    t('Select a taxonomy type', 'Выберите тип справочника')
                  )}
                </CardTitle>
                {selectedDefinition && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDefinition.type_key} • {selectedDefinition.value_count} {t('values', 'значений')}
                  </p>
                )}
              </div>
              {selectedDefinition && <TaxonomyBulkActions typeKey={selectedType!} />}
            </div>
          </CardHeader>
          <CardContent>
            {selectedType ? (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="values">{t('Values', 'Значения')}</TabsTrigger>
                  <TabsTrigger value="settings">{t('Settings', 'Настройки')}</TabsTrigger>
                </TabsList>
                <TabsContent value="values">
                  <TaxonomyValueEditor typeKey={selectedType} />
                </TabsContent>
                <TabsContent value="settings">
                  <TaxonomySchemaEditor typeKey={selectedType} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderTree className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {t('Select a taxonomy type from the left panel', 'Выберите тип справочника слева')}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-2">
                  {t('You can add, edit, and reorder values', 'Вы можете добавлять, редактировать и сортировать значения')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
