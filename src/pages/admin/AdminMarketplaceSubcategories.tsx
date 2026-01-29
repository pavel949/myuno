import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminMarketplaceSubcategories, useAdminMarketplaceCategories } from '@/hooks/useAdminMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MoreHorizontal, Pencil, Trash2, List } from 'lucide-react';
import type { MarketplaceSubcategory } from '@/types/marketplace';

export default function AdminMarketplaceSubcategories() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { categories } = useAdminMarketplaceCategories();
  const { subcategories, isLoading, createSubcategory, updateSubcategory, deleteSubcategory } = useAdminMarketplaceSubcategories(
    categoryFilter !== 'all' ? categoryFilter : undefined
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<MarketplaceSubcategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category_slug: '',
    slug: '',
    name_en: '',
    name_ru: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      category_slug: '',
      slug: '',
      name_en: '',
      name_ru: '',
      icon: '',
      sort_order: 0,
      is_active: true,
    });
    setEditingSubcategory(null);
  };

  const openCreate = () => {
    resetForm();
    setFormData((prev) => ({
      ...prev,
      category_slug: categoryFilter !== 'all' ? categoryFilter : '',
      sort_order: subcategories.length,
    }));
    setIsDialogOpen(true);
  };

  const openEdit = (subcategory: MarketplaceSubcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      category_slug: subcategory.category_slug,
      slug: subcategory.slug,
      name_en: subcategory.name_en,
      name_ru: subcategory.name_ru,
      icon: subcategory.icon || '',
      sort_order: subcategory.sort_order,
      is_active: subcategory.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      icon: formData.icon || null,
    };

    if (editingSubcategory) {
      await updateSubcategory.mutateAsync({ id: editingSubcategory.id, ...payload });
    } else {
      await createSubcategory.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteSubcategory.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    return cat ? (isRu ? cat.name_ru : cat.name_en) : slug;
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Подкатегории' : 'Subcategories'}</h1>
          <p className="text-muted-foreground">{isRu ? 'Детальная классификация товаров' : 'Detailed product classification'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить подкатегорию' : 'Add Subcategory'}
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder={isRu ? 'Фильтр по категории' : 'Filter by category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все категории' : 'All categories'}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {cat.icon} {isRu ? cat.name_ru : cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            {isRu ? 'Подкатегории' : 'Subcategories'} ({subcategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Подкатегории не найдены' : 'No subcategories found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRu ? 'Иконка + Название' : 'Icon + Name'}</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>{isRu ? 'Категория' : 'Category'}</TableHead>
                  <TableHead>{isRu ? 'Порядок' : 'Order'}</TableHead>
                  <TableHead>{isRu ? 'Активна' : 'Active'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {sub.icon && <span className="text-lg">{sub.icon}</span>}
                        <div>
                          <div className="font-medium">{isRu ? sub.name_ru : sub.name_en}</div>
                          <div className="text-xs text-muted-foreground">{!isRu ? sub.name_ru : sub.name_en}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{sub.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(sub.category_slug)}</Badge>
                    </TableCell>
                    <TableCell>{sub.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={sub.is_active ? 'default' : 'secondary'}>
                        {sub.is_active ? '✓' : '✗'}
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
                          <DropdownMenuItem onClick={() => openEdit(sub)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {isRu ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(sub.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubcategory
                ? (isRu ? 'Редактировать подкатегорию' : 'Edit Subcategory')
                : (isRu ? 'Добавить подкатегорию' : 'Add Subcategory')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{isRu ? 'Родительская категория' : 'Parent Category'}</Label>
              <Select
                value={formData.category_slug}
                onValueChange={(v) => setFormData({ ...formData, category_slug: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRu ? 'Выберите категорию' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.icon} {isRu ? cat.name_ru : cat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="subcategory-slug"
                disabled={!!editingSubcategory}
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
                <Label>{isRu ? 'Иконка (emoji)' : 'Icon (emoji)'}</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🥬"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Порядок' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label>{isRu ? 'Активна' : 'Active'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.category_slug || !formData.slug || !formData.name_en}>
              {editingSubcategory ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить подкатегорию?' : 'Delete subcategory?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие нельзя отменить.'
                : 'This action cannot be undone.'}
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
