import { PageHeader, PageShell } from '@/components/page';
import React, { useState } from 'react';
import { 
  BookOpen, Plus, Globe, Edit2, Trash2, 
  Eye, EyeOff, Loader2, ChevronDown, Search,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCities } from '@/hooks/useCities';
import { KNOWLEDGE_SECTIONS } from '@/hooks/useLocationKnowledge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';

interface KnowledgeItem {
  id: string;
  city_id: string;
  section: string;
  slug: string;
  title_en: string;
  title_ru: string;
  content_en: string | null;
  content_ru: string | null;
  summary_en: string | null;
  summary_ru: string | null;
  icon: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  city_id: string;
  section: string;
  slug: string;
  title_en: string;
  title_ru: string;
  content_en: string;
  content_ru: string;
  summary_en: string;
  summary_ru: string;
  icon: string;
  sort_order: number;
  is_published: boolean;
}

const initialFormData: FormData = {
  city_id: '',
  section: 'overview',
  slug: '',
  title_en: '',
  title_ru: '',
  content_en: '',
  content_ru: '',
  summary_en: '',
  summary_ru: '',
  icon: '',
  sort_order: 0,
  is_published: true,
};

type PublicationFilter = 'all' | 'published' | 'unpublished';

function getArticleLanguages(item: Pick<KnowledgeItem, 'title_en' | 'title_ru' | 'content_en' | 'content_ru'>) {
  return [
    { code: 'EN', hasBody: Boolean(item.title_en?.trim() && item.content_en?.trim()) },
    { code: 'RU', hasBody: Boolean(item.title_ru?.trim() && item.content_ru?.trim()) },
  ];
}

export default function AdminLocationKnowledge() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const t = (values: LangValues) => pickLang(language, values);
  const isRu = language === 'ru';
  const { cities } = useCities();
  
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['overview']);

  // Fetch knowledge items
  const { data: items = [], isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['admin-location-knowledge', user?.id, selectedCityId],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      let query = supabase
        .from('location_knowledge')
        .select('*')
        .order('section')
        .order('sort_order');

      if (selectedCityId) {
        query = query.eq('city_id', selectedCityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeItem[];
    },
  });

  const query = searchQuery.trim().toLocaleLowerCase();
  const hasFilters = Boolean(query) || publicationFilter !== 'all';
  const matchingItems = items.filter((item) => {
    if (publicationFilter === 'published' && !item.is_published) return false;
    if (publicationFilter === 'unpublished' && item.is_published) return false;
    return !query || [item.title_en, item.title_ru, item.slug].some(value => value?.toLocaleLowerCase().includes(query));
  });
  const groupedItems = matchingItems.reduce<Record<string, KnowledgeItem[]>>((groups, item) => {
    (groups[item.section] ??= []).push(item);
    return groups;
  }, Object.create(null));
  const sections = [...new Set([...KNOWLEDGE_SECTIONS.map(section => section.id), ...Object.keys(groupedItems)])];
  const publishedCount = items.filter(item => item.is_published).length;
  const publicationOptions: { value: PublicationFilter; label: string; count: number }[] = [
    { value: 'all', label: t({ en: 'All articles', ru: 'Все статьи', th: 'บทความทั้งหมด' }), count: items.length },
    { value: 'published', label: t({ en: 'Published', ru: 'Опубликовано', th: 'เผยแพร่แล้ว' }), count: publishedCount },
    { value: 'unpublished', label: t({ en: 'Unpublished', ru: 'Не опубликовано', th: 'ยังไม่เผยแพร่' }), count: items.length - publishedCount },
  ];
  const formatDate = new Intl.DateTimeFormat(language, { dateStyle: 'medium' });

  const refreshArticleLists = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ['location-knowledge'] });
  };

  const getCityName = (cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    return city ? `${city.flag} ${city.name_en}` : cityId;
  };

  const getSectionLabel = (sectionId: string) => {
    const section = KNOWLEDGE_SECTIONS.find(s => s.id === sectionId);
    return section ? (isRu ? section.labelRu : section.labelEn) : sectionId;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      ...initialFormData,
      city_id: selectedCityId || cities[0]?.id || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      city_id: item.city_id,
      section: item.section,
      slug: item.slug,
      title_en: item.title_en,
      title_ru: item.title_ru,
      content_en: item.content_en || '',
      content_ru: item.content_ru || '',
      summary_en: item.summary_en || '',
      summary_ru: item.summary_ru || '',
      icon: item.icon || '',
      sort_order: item.sort_order,
      is_published: item.is_published,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.city_id || !formData.section || !formData.slug || !formData.title_en) {
      toast.error(isRu ? 'Заполните обязательные поля' : 'Fill in required fields');
      return;
    }

    setIsSaving(true);
    
    try {
      const data = {
        city_id: formData.city_id,
        section: formData.section,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        content_en: formData.content_en || null,
        content_ru: formData.content_ru || null,
        summary_en: formData.summary_en || null,
        summary_ru: formData.summary_ru || null,
        icon: formData.icon || null,
        sort_order: formData.sort_order,
        is_published: formData.is_published,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('location_knowledge')
          .update(data)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success(isRu ? 'Статья обновлена' : 'Article updated');
      } else {
        const { error } = await supabase
          .from('location_knowledge')
          .insert([data]);

        if (error) throw error;
        toast.success(isRu ? 'Статья добавлена' : 'Article added');
      }

      setIsDialogOpen(false);
      refreshArticleLists();
    } catch (error: unknown) {
      console.error('Error saving:', error);
      toast.error((error instanceof Error ? error.message : '') || (isRu ? 'Ошибка сохранения' : 'Error saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (item: KnowledgeItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('location_knowledge')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      
      toast.success(isRu ? 'Статья удалена' : 'Article deleted');
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
      refreshArticleLists();
    } catch (error: unknown) {
      console.error('Error deleting:', error);
      toast.error((error instanceof Error ? error.message : '') || (isRu ? 'Ошибка удаления' : 'Error deleting'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublished = async (item: KnowledgeItem) => {
    try {
      const { error } = await supabase
        .from('location_knowledge')
        .update({ is_published: !item.is_published })
        .eq('id', item.id);

      if (error) throw error;
      
      toast.success(
        item.is_published 
          ? (isRu ? 'Статья скрыта' : 'Article hidden')
          : (isRu ? 'Статья опубликована' : 'Article published')
      );
      refreshArticleLists();
    } catch (error: unknown) {
      console.error('Error toggling:', error);
      toast.error((error instanceof Error ? error.message : '') || (isRu ? 'Ошибка' : 'Error'));
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <PageShell width="workspace" className="space-y-6">
      <PageHeader
        title={t({ en: 'Location knowledge', ru: 'База знаний локаций', th: 'ข้อมูลพื้นที่' })}
        subtitle={t({ en: 'Manage city guides and their translations.', ru: 'Управляйте путеводителями по городам и их переводами.', th: 'จัดการคู่มือเมืองและคำแปล' })}
        actions={(
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t({ en: 'Add article', ru: 'Добавить статью', th: 'เพิ่มบทความ' })}
          </Button>
        )}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCityId || 'all'} onValueChange={(v) => setSelectedCityId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-auto" aria-label={t({ en: 'Filter by city', ru: 'Фильтр по городу', th: 'กรองตามเมือง' })}>
            <SelectValue placeholder={isRu ? 'Все города' : 'All cities'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все города' : 'All cities'}</SelectItem>
            {cities.map(city => (
              <SelectItem key={city.id} value={city.id}>
                {city.flag} {city.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label={t({ en: 'Search articles', ru: 'Поиск статей', th: 'ค้นหาบทความ' })}
            placeholder={isRu ? 'Поиск статей...' : 'Search articles...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="ghost" size="icon" aria-label={t({ en: 'Refresh articles', ru: 'Обновить статьи', th: 'โหลดบทความอีกครั้ง' })} onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </Button>
      </div>

      <div role="group" aria-label={t({ en: 'Publication status', ru: 'Статус публикации', th: 'สถานะการเผยแพร่' })} className="flex flex-wrap gap-2">
        {publicationOptions.map(option => (
          <Button
            key={option.value}
            variant={option.value === publicationFilter ? 'default' : 'outline'}
            aria-pressed={option.value === publicationFilter}
            onClick={() => setPublicationFilter(option.value)}
          >
            {option.label}
            {!isLoading && !isError && <>{' '}<span className="tabular-nums">{option.count}</span></>}
          </Button>
        ))}
      </div>

      {/* Content */}
      {isError ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p role="alert">{t({ en: 'Articles could not be loaded.', ru: 'Не удалось загрузить статьи.', th: 'โหลดบทความไม่ได้' })}</p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {t({ en: 'Try again', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-none" />
          ))}
        </div>
      ) : matchingItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{hasFilters
              ? t({ en: 'No articles match these filters.', ru: 'Нет статей по заданным фильтрам.', th: 'ไม่มีบทความตรงกับตัวกรอง' })
              : t({ en: 'No articles in this selection.', ru: 'В этой подборке нет статей.', th: 'ไม่มีบทความในรายการนี้' })}</p>
            <Button variant="outline" className="mt-4" onClick={hasFilters ? () => {
              setSearchQuery('');
              setPublicationFilter('all');
            } : handleOpenCreate}>
              {hasFilters
                ? t({ en: 'Clear filters', ru: 'Сбросить фильтры', th: 'ล้างตัวกรอง' })
                : t({ en: 'Add article', ru: 'Добавить статью', th: 'เพิ่มบทความ' })}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sections.map(section => {
            const sectionItems = groupedItems[section];
            if (!sectionItems?.length) return null;
            const isOpen = hasFilters || openSections.includes(section);
            
            return (
              <Collapsible 
                key={section}
                open={isOpen}
                onOpenChange={() => toggleSection(section)}
              >
                <Card>
                  <h2 className="text-lg">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" disabled={hasFilters} className="h-auto w-full justify-between px-4 py-3 text-start">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="whitespace-normal">{getSectionLabel(section)}</span>
                          <Badge variant="secondary">{sectionItems.length}</Badge>
                        </span>
                        <ChevronDown aria-hidden="true" className={cn('h-5 w-5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                      </Button>
                    </CollapsibleTrigger>
                  </h2>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {sectionItems.map(item => {
                          const title = (isRu ? item.title_ru : item.title_en) || item.title_en;
                          const updated = new Date(item.updated_at);
                          return (
                          <div 
                            key={item.id}
                            className="flex flex-col gap-3 border p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium [overflow-wrap:anywhere]">{title}</span>
                                {!selectedCityId && (
                                  <Badge variant="outline" className="text-xs">
                                    {getCityName(item.city_id)}
                                  </Badge>
                                )}
                                <Badge variant={item.is_published ? 'outline' : 'secondary'} className="text-xs">
                                  {publicationOptions[item.is_published ? 1 : 2].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">
                                /{item.slug}
                                {!Number.isNaN(updated.getTime()) && (
                                  <> · <time dateTime={updated.toISOString()}>{formatDate.format(updated)}</time></>
                                )}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {getArticleLanguages(item).map(locale => (
                                  <Badge key={locale.code} variant={locale.hasBody ? 'outline' : 'secondary'}>
                                    {locale.code} {locale.hasBody
                                      ? t({ en: 'Content saved', ru: 'Текст сохранён', th: 'บันทึกเนื้อหาแล้ว' })
                                      : t({ en: 'Content missing', ru: 'Нет текста', th: 'ไม่มีเนื้อหา' })}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Switch
                                aria-label={`${publicationOptions[1].label} · ${title}`}
                                checked={item.is_published}
                                onCheckedChange={() => handleTogglePublished(item)}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={isRu ? 'Редактировать' : 'Edit'}
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={isRu ? 'Удалить' : 'Delete'}
                                onClick={() => handleDeleteClick(item)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? (isRu ? 'Редактировать статью' : 'Edit Article')
                : (isRu ? 'Добавить статью' : 'Add Article')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* City & Section */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{isRu ? 'Город *' : 'City *'}</Label>
                <Select 
                  value={formData.city_id} 
                  onValueChange={v => setFormData(prev => ({ ...prev, city_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите город' : 'Select city'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.flag} {city.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Секция *' : 'Section *'}</Label>
                <Select 
                  value={formData.section} 
                  onValueChange={v => setFormData(prev => ({ ...prev, section: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KNOWLEDGE_SECTIONS.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {isRu ? section.labelRu : section.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Slug & Sort */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'URL Slug *' : 'URL Slug *'}</Label>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="getting-around"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Порядок сортировки' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={e => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>{isRu ? 'Иконка (эмодзи или Lucide)' : 'Icon (emoji or Lucide)'}</Label>
              <Input
                value={formData.icon}
                onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🏝️ or MapPin"
              />
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Заголовок EN *' : 'Title EN *'}</Label>
                <Input
                  value={formData.title_en}
                  onChange={e => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                  placeholder="Getting Around Phuket"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Заголовок RU' : 'Title RU'}</Label>
                <Input
                  value={formData.title_ru}
                  onChange={e => setFormData(prev => ({ ...prev, title_ru: e.target.value }))}
                  placeholder="Как перемещаться по Пхукету"
                />
              </div>
            </div>

            {/* Summaries */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{isRu ? 'Краткое описание EN' : 'Summary EN'}</Label>
                <Textarea
                  value={formData.summary_en}
                  onChange={e => setFormData(prev => ({ ...prev, summary_en: e.target.value }))}
                  placeholder="A brief summary..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Краткое описание RU' : 'Summary RU'}</Label>
                <Textarea
                  value={formData.summary_ru}
                  onChange={e => setFormData(prev => ({ ...prev, summary_ru: e.target.value }))}
                  placeholder="Краткое описание..."
                  rows={2}
                />
              </div>
            </div>

            {/* Content EN */}
            <div className="space-y-2">
              <Label>{isRu ? 'Контент EN (Markdown)' : 'Content EN (Markdown)'}</Label>
              <Textarea
                value={formData.content_en}
                onChange={e => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                placeholder="Full article content in Markdown..."
                rows={6}
              />
            </div>

            {/* Content RU */}
            <div className="space-y-2">
              <Label>{isRu ? 'Контент RU (Markdown)' : 'Content RU (Markdown)'}</Label>
              <Textarea
                value={formData.content_ru}
                onChange={e => setFormData(prev => ({ ...prev, content_ru: e.target.value }))}
                placeholder="Полный текст статьи в Markdown..."
                rows={6}
              />
            </div>

            {/* Published */}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_published}
                onCheckedChange={v => setFormData(prev => ({ ...prev, is_published: v }))}
              />
              <Label>{isRu ? 'Опубликовано' : 'Published'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить статью?' : 'Delete article?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? `Статья "${itemToDelete?.title_en}" будет удалена безвозвратно.`
                : `Article "${itemToDelete?.title_en}" will be permanently deleted.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
