import { useState } from 'react';
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
  
  const { categories, isLoading, create, update, remove, isCreating, isUpdating, isDeleting } = useAdminExperienceCategories();
  
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
    if (!formData.slug || !formData.name_en || !formData.name_ru) {
      toast.error(isRu ? 'Заполните все обязательные поля' : 'Fill in all required fields');
      return;
    }

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
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex items-center justify-between">
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
            <Table>
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
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <GripVertical className="h-4 w-4 opacity-30" />
                        {category.sort_order}
                      </div>
                    </TableCell>
                    <TableCell className="text-2xl">{category.icon}</TableCell>
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
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirmId(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                  maxLength={2}
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
    </div>
  );
}
