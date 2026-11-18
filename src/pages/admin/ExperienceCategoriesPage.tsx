import { PageShell } from '@/components/page/PageShell';
import { useState } from 'react';
import { EXPERIENCE_DISCOVERY_GROUPS, DISCOVERY_TOPIC_LABELS, discoveryTopic, experienceGroup } from '@/lib/taxonomies/experienceDiscovery';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminExperienceCategories, ExperienceCategory, ExperienceCategoryInsert } from '@/hooks/useExperienceCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categoryIcon = (category: ExperienceCategory) => category.icon && !/^[a-z_-]+$/i.test(category.icon) ? category.icon : EXPERIENCE_DISCOVERY_GROUPS.find(group => group.id === experienceGroup(category.slug))?.icon || '🎯';

const EMPTY_FORM: Partial<ExperienceCategoryInsert> = {
  slug: '',
  name_en: '',
  name_ru: '',
  icon: '🎯',
  experience_type: 'all',
  sort_order: 0,
  is_active: true,
};

export default function ExperienceCategoriesPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { categories, isLoading, error, refetch, create, update, remove, isCreating, isUpdating, isDeleting } = useAdminExperienceCategories();
  
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('all');
  const visibleCategories = categories.filter(category => (group === 'all' || experienceGroup(category.slug) === group || (group === 'other' && !experienceGroup(category.slug))) && `${category.name_ru} ${category.name_en} ${category.slug}`.toLowerCase().includes(search.trim().toLowerCase()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExperienceCategory | null>(null);
  const [formData, setFormData] = useState<Partial<ExperienceCategoryInsert>>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ ...EMPTY_FORM, sort_order: (categories.length + 1) * 10 });
    setDialogOpen(true);
  };

  const openEditDialog = (category: ExperienceCategory) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      name_en: category.name_en,
      name_ru: category.name_ru,
      icon: category.icon,
      experience_type: category.experience_type,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.slug?.trim() || !formData.name_en?.trim() || !formData.name_ru?.trim()) {
      toast.error(isRu ? 'Заполните все обязательные поля' : 'Fill in all required fields');
      return;
    }

    if (!editingCategory && categories.some(category => category.slug === formData.slug?.trim())) { toast.error(isRu ? 'Такая категория уже есть. Откройте её для редактирования.' : 'This category already exists. Edit it instead.'); return; }
    try {
      if (editingCategory) {
        await update(editingCategory.id, formData as ExperienceCategoryInsert);
        toast.success(isRu ? 'Категория обновлена' : 'Category updated');
      } else {
        await create(formData as ExperienceCategoryInsert);
        toast.success(isRu ? 'Категория создана' : 'Category created');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success(isRu ? 'Категория удалена' : 'Category deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(isRu ? 'Ошибка удаления' : 'Error deleting');
      console.error(error);
    }
  };

  const handleToggleActive = async (category: ExperienceCategory) => {
    try {
      await update(category.id, { is_active: !category.is_active });
      toast.success(category.is_active 
        ? (isRu ? 'Категория скрыта' : 'Category hidden')
        : (isRu ? 'Категория активна' : 'Category active')
      );
    } catch (error) {
      toast.error(isRu ? 'Ошибка обновления' : 'Error updating');
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <PageShell width="wide" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isRu ? 'Категории активностей' : 'Experience Categories'}
          </h1>
          <p className="text-muted-foreground">
            {isRu ? 'Управление категориями туров и активностей' : 'Manage tour and activity categories'}
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить' : 'Add Category'}
        </Button>
      </div>

      <section className="space-y-3" aria-label={isRu ? 'Структура впечатлений' : 'Experience structure'}>
        <h2 className="text-lg font-semibold">{isRu ? 'Структура каталога' : 'Catalogue structure'}</h2>
        <p className="text-sm text-muted-foreground">{isRu ? 'Это структура для наполнения, а не список доступных предложений. Место, программа и условия бронирования заполняются в карточке. Категории сервисов и недвижимости остаются в своих каталогах.' : 'A structure for content, not a list of available offers. Enter the venue, programme and booking terms in each listing. Services and property keep their own catalogues.'}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERIENCE_DISCOVERY_GROUPS.map(section => <details key={section.id} className="min-w-0 border border-border bg-card p-4">
            <summary className="min-h-11 cursor-pointer font-medium">{section.icon} {isRu ? section.ru : section.en}</summary>
            <div className="space-y-2 pt-3">{section.categories.filter(slug => discoveryTopic(slug) === slug).map(slug => {
              const label = DISCOVERY_TOPIC_LABELS[slug];
              const existing = categories.find(category => discoveryTopic(category.slug) === slug);
              return <div key={slug} className="flex items-center justify-between gap-2 text-sm"><span>{existing ? (isRu ? existing.name_ru : existing.name_en) : (isRu ? label?.ru : label?.en) || slug}</span>
                <Button size="sm" variant="outline" disabled={isLoading || !!error} onClick={() => {
                  if (existing) openEditDialog(existing);
                  else { setEditingCategory(null); setFormData({ ...EMPTY_FORM, slug, name_en: label?.en || slug, name_ru: label?.ru || slug, icon: section.icon, is_active: false, sort_order: (categories.length + 1) * 10 }); setDialogOpen(true); }
                }}>{existing ? (isRu ? 'Изменить' : 'Edit') : (isRu ? 'Подготовить' : 'Prepare')}</Button>
              </div>;
            })}</div>
          </details>)}
        </div>
        <p className="text-xs text-muted-foreground">{isRu ? '«Подготовить» открывает редактор. Новая категория сохраняется скрытой, пока вы её не включите. Ничего не публикуется автоматически.' : 'Prepare opens the editor. New categories are saved hidden until you enable them. Nothing is published automatically.'}</p>
      </section>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input aria-label={isRu ? 'Найти категорию' : 'Find category'} placeholder={isRu ? 'Найти категорию…' : 'Find category…'} value={search} onChange={event => setSearch(event.target.value)} />
        <select className="min-h-11 min-w-0 w-full sm:w-auto border border-border bg-background px-3" aria-label={isRu ? 'Раздел каталога' : 'Catalogue section'} value={group} onChange={event => setGroup(event.target.value)}>
          <option value="all">{isRu ? 'Все разделы' : 'All sections'}</option>
          {EXPERIENCE_DISCOVERY_GROUPS.map(section => <option key={section.id} value={section.id}>{isRu ? section.ru : section.en}</option>)}
          <option value="other">{isRu ? 'Другие категории' : 'Other categories'}</option>
        </select>
      </div>
      {error && <div role="alert" className="space-y-2"><p>{isRu ? 'Не удалось загрузить категории. Создание из структуры временно недоступно, чтобы избежать дублей.' : 'Categories could not be loaded. Preparing categories is disabled to avoid duplicates.'}</p><Button onClick={() => refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div>}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isRu ? 'Все категории' : 'All Categories'} ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
            <div className="space-y-3 md:hidden" data-testid="mobile-category-cards">
              {visibleCategories.map(category => <article key={category.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3"><span aria-hidden="true" className="text-2xl shrink-0">{categoryIcon(category)}</span><div className="min-w-0"><h3 className="font-medium break-words">{isRu ? category.name_ru : category.name_en}</h3><p className="text-sm text-muted-foreground break-words">{category.slug}</p></div></div>
                <div className="flex items-center justify-between gap-3"><span className="text-sm">{category.is_active ? (isRu ? 'Видна в каталоге' : 'Visible in catalogue') : (isRu ? 'Скрыта' : 'Hidden')}</span><Switch aria-label={`${isRu ? 'Видимость' : 'Visibility'}: ${category.name_ru || category.name_en}`} checked={category.is_active} onCheckedChange={() => handleToggleActive(category)} disabled={isUpdating} /></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openEditDialog(category)}><Pencil className="h-4 w-4 mr-2" />{isRu ? 'Редактировать' : 'Edit'}</Button><Button variant="ghost" className="text-destructive" onClick={() => setDeleteConfirmId(category.id)} aria-label={isRu ? 'Удалить' : 'Delete'}><Trash2 className="h-4 w-4" /></Button></div>
              </article>)}
            </div>
            <div className="hidden md:block overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-16">{isRu ? 'Иконка' : 'Icon'}</TableHead>
                  <TableHead>{isRu ? 'Slug' : 'Slug'}</TableHead>
                  <TableHead>{isRu ? 'Название EN' : 'Name EN'}</TableHead>
                  <TableHead>{isRu ? 'Название RU' : 'Name RU'}</TableHead>
                  <TableHead>{isRu ? 'Тип' : 'Type'}</TableHead>
                  <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                  <TableHead className="text-right">{isRu ? 'Действия' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 opacity-30" />
                        {category.sort_order}
                      </div>
                    </TableCell>
                    <TableCell className="text-2xl whitespace-nowrap">{categoryIcon(category)}</TableCell>
                    <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                    <TableCell>{category.name_en}</TableCell>
                    <TableCell>{category.name_ru}</TableCell>
                    <TableCell>
                      <Badge variant={
                        category.experience_type === 'tour' ? 'default' :
                        category.experience_type === 'activity' ? 'secondary' : 'outline'
                      }>
                        {category.experience_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={category.is_active}
                        onCheckedChange={() => handleToggleActive(category)}
                        disabled={isUpdating}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                          aria-label={isRu ? 'Редактировать' : 'Edit'}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(category.id)}
                          aria-label={isRu ? 'Удалить' : 'Delete'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory 
                ? (isRu ? 'Редактировать категорию' : 'Edit Category')
                : (isRu ? 'Новая категория' : 'New Category')
              }
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label>{isRu ? 'Иконка' : 'Icon'}</Label>
                <Input
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="text-center text-2xl"
                  maxLength={12}
                />
              </div>
              <div className="col-span-3">
                <Label>Slug *</Label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="e.g. water-park"
                  disabled={!!editingCategory}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Название (EN)' : 'Name (EN)'} *</Label>
              <Input
                value={formData.name_en || ''}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Water Parks"
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Название (RU)' : 'Name (RU)'} *</Label>
              <Input
                value={formData.name_ru || ''}
                onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                placeholder="Аквапарки"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Тип' : 'Type'}</Label>
                <Select
                  value={formData.experience_type || 'all'}
                  onValueChange={(value) => setFormData({ ...formData, experience_type: value as 'tour' | 'activity' | 'all' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
                    <SelectItem value="tour">{isRu ? 'Туры' : 'Tours'}</SelectItem>
                    <SelectItem value="activity">{isRu ? 'Активности' : 'Activities'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Порядок' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>{isRu ? 'Активна' : 'Active'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Удалить категорию?' : 'Delete Category?'}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Это действие нельзя отменить. Активности с этой категорией останутся без категории.'
              : 'This action cannot be undone. Experiences with this category will become uncategorized.'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRu ? 'Удалить' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
