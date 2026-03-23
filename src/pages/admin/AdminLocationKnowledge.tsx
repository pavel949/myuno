import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { 
  BookOpen, Plus, Globe, Edit2, Trash2, 
  Eye, EyeOff, Loader2, ChevronDown, Search,
  RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCities } from '@/hooks/useCities';
import { KNOWLEDGE_SECTIONS } from '@/hooks/useLocationKnowledge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function AdminLocationKnowledge() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { cities } = useCities();
  
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['overview']);

  // Fetch knowledge items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-location-knowledge', selectedCityId],
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

  // Group items by section
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, KnowledgeItem[]>);

  // Filter by search
  const filteredSections = Object.entries(groupedItems).filter(([section, sectionItems]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return sectionItems.some(item => 
      item.title_en.toLowerCase().includes(query) ||
      item.title_ru.toLowerCase().includes(query) ||
      item.slug.toLowerCase().includes(query)
    );
  });

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
      refetch();
    } catch (error: unknown) {
      logger.error('Error saving:', error);
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
      refetch();
    } catch (error: unknown) {
      logger.error('Error deleting:', error);
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
      refetch();
    } catch (error: unknown) {
      logger.error('Error toggling:', error);
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            {isRu ? 'База знаний локаций' : 'Location Knowledge'}
          </h1>
          <p className="text-muted-foreground">
            {isRu ? 'Управление справочным контентом по городам' : 'Manage reference content for cities'}
          </p>
        </div>
        
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {isRu ? 'Добавить статью' : 'Add Article'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCityId || 'all'} onValueChange={(v) => setSelectedCityId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
            placeholder={isRu ? 'Поиск статей...' : 'Search articles...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-sm text-muted-foreground">{isRu ? 'Всего статей' : 'Total articles'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{items.filter(i => i.is_published).length}</div>
            <p className="text-sm text-muted-foreground">{isRu ? 'Опубликовано' : 'Published'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{Object.keys(groupedItems).length}</div>
            <p className="text-sm text-muted-foreground">{isRu ? 'Секций' : 'Sections'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{new Set(items.map(i => i.city_id)).size}</div>
            <p className="text-sm text-muted-foreground">{isRu ? 'Городов' : 'Cities'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{isRu ? 'Нет статей' : 'No articles'}</p>
            <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              {isRu ? 'Добавить первую статью' : 'Add first article'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {KNOWLEDGE_SECTIONS.map(section => {
            const sectionItems = groupedItems[section.id] || [];
            if (sectionItems.length === 0) return null;
            
            return (
              <Collapsible 
                key={section.id} 
                open={openSections.includes(section.id)}
                onOpenChange={() => toggleSection(section.id)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span>{isRu ? section.labelRu : section.labelEn}</span>
                          <Badge variant="secondary">{sectionItems.length}</Badge>
                        </CardTitle>
                        <ChevronDown className={cn(
                          "h-5 w-5 transition-transform",
                          openSections.includes(section.id) && "rotate-180"
                        )} />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {sectionItems.map(item => (
                          <div 
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{item.title_en}</span>
                                {!selectedCityId && (
                                  <Badge variant="outline" className="text-xs">
                                    {getCityName(item.city_id)}
                                  </Badge>
                                )}
                                {!item.is_published && (
                                  <Badge variant="secondary" className="text-xs">
                                    <EyeOff className="w-3 h-3 mr-1" />
                                    {isRu ? 'Скрыто' : 'Hidden'}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                /{item.slug} · {item.title_ru}
                              </p>
                            </div>

                            <div className="flex items-center gap-1">
                              <Switch
                                checked={item.is_published}
                                onCheckedChange={() => handleTogglePublished(item)}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClick(item)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
