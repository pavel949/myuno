import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminMarketplaceCategories, useProductCountsByCategory } from '@/hooks/useAdminMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreHorizontal, Pencil, Trash2, Grid3X3, GripVertical } from 'lucide-react';
import type { MarketplaceCategory } from '@/types/marketplace';

export default function AdminMarketplaceCategories() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useAdminMarketplaceCategories();
  const { data: productCounts = {} } = useProductCountsByCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    icon: '',
    image_url: '',
    gradient: '',
    category_group: '',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      icon: '',
      image_url: '',
      gradient: '',
      category_group: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingCategory(null);
  };

  const openCreate = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, sort_order: categories.length }));
    setIsDialogOpen(true);
  };

  const openEdit = (category: MarketplaceCategory) => {
    setEditingCategory(category);
    setFormData({
      slug: category.slug,
      name_en: category.name_en,
      name_ru: category.name_ru,
      description_en: category.description_en || '',
      description_ru: category.description_ru || '',
      icon: category.icon || '',
      image_url: category.image_url || '',
      gradient: category.gradient || '',
      category_group: category.category_group || '',
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      icon: formData.icon || null,
      image_url: formData.image_url || null,
      gradient: formData.gradient || null,
      category_group: formData.category_group || null,
    };

    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...payload });
    } else {
      await createCategory.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteCategory.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Категории маркетплейса' : 'Marketplace Categories'}</h1>
          <p className="text-muted-foreground">{isRu ? 'Управление структурой каталога' : 'Manage catalog structure'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить категорию' : 'Add Category'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            {isRu ? 'Категории' : 'Categories'} ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Категории не найдены' : 'No categories found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>{isRu ? 'Иконка + Название' : 'Icon + Name'}</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>{isRu ? 'Товаров' : 'Products'}</TableHead>
                  <TableHead>{isRu ? 'Группа' : 'Group'}</TableHead>
                  <TableHead>{isRu ? 'Активна' : 'Active'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-xl">{category.icon}</span>}
                        <div>
                          <div className="font-medium">{isRu ? category.name_ru : category.name_en}</div>
                          <div className="text-xs text-muted-foreground">{!isRu ? category.name_ru : category.name_en}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{category.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{productCounts[category.slug] || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {category.category_group && (
                        <Badge variant="outline">{category.category_group}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? '✓' : '✗'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {isRu ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(category.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isRu ? 'Удалить' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? (isRu ? 'Редактировать категорию' : 'Edit Category')
                : (isRu ? 'Добавить категорию' : 'Add Category')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="category-slug"
                disabled={!!editingCategory}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (EN)</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Название (RU)</Label>
                <Input
                  value={formData.name_ru}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (EN)</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (RU)</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Иконка (emoji)' : 'Icon (emoji)'}</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🍎"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Группа категорий' : 'Category Group'}</Label>
                <Input
                  value={formData.category_group}
                  onChange={(e) => setFormData({ ...formData, category_group: e.target.value })}
                  placeholder="food, home, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Изображение (URL)' : 'Image URL'}</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Градиент (CSS)' : 'Gradient (CSS)'}</Label>
              <Input
                value={formData.gradient}
                onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Порядок сортировки' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>{isRu ? 'Активна' : 'Active'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.slug || !formData.name_en}>
              {editingCategory ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить категорию?' : 'Delete category?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие нельзя отменить. Все товары в этой категории останутся без категории.'
                : 'This action cannot be undone. All products in this category will become uncategorized.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
