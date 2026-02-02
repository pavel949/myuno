import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminMarketplaceProducts, useAdminMarketplaceCategories, useAdminMarketplaceVendors } from '@/hooks/useAdminMarketplace';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Package } from 'lucide-react';
import type { MarketplaceProduct } from '@/types/marketplace';
import { getUnitMeasureOptions } from '@/utils/formatProductUnit';

export default function AdminMarketplaceProducts() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useAdminMarketplaceProducts({
    search: search || undefined,
    categorySlug: categoryFilter !== 'all' ? categoryFilter : undefined,
    vendorId: vendorFilter !== 'all' ? vendorFilter : undefined,
    inStock: stockFilter === 'in_stock' ? true : stockFilter === 'out_of_stock' ? false : undefined,
  });

  const { categories } = useAdminMarketplaceCategories();
  const { vendors } = useAdminMarketplaceVendors();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    category_slug: '',
    subcategory: '',
    price: 0,
    original_price: null as number | null,
    currency: 'THB',
    unit: 'piece',
    unit_ru: 'шт',
    // Precise unit fields
    unit_value: null as number | null,
    unit_measure: '',
    pack_quantity: null as number | null,
    in_stock: true,
    is_popular: false,
    is_new: false,
    is_active: true,
    cover_image: '',
    vendor_id: '',
    weight_kg: 0,
    tags: [] as string[],
    // Shipping (synced with Vendor)
    is_shippable_international: false,
  });

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      category_slug: '',
      subcategory: '',
      price: 0,
      original_price: null,
      currency: 'THB',
      unit: 'piece',
      unit_ru: 'шт',
      unit_value: null,
      unit_measure: '',
      pack_quantity: null,
      in_stock: true,
      is_popular: false,
      is_new: false,
      is_active: true,
      cover_image: '',
      vendor_id: '',
      weight_kg: 0,
      tags: [],
      is_shippable_international: false,
    });
    setEditingProduct(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (product: MarketplaceProduct) => {
    setEditingProduct(product);
    setFormData({
      name_en: product.name_en,
      name_ru: product.name_ru,
      description_en: product.description_en || '',
      description_ru: product.description_ru || '',
      category_slug: product.category_slug,
      subcategory: product.subcategory || '',
      price: product.price,
      original_price: product.original_price,
      currency: product.currency,
      unit: product.unit,
      unit_ru: product.unit_ru,
      unit_value: product.unit_value,
      unit_measure: product.unit_measure || '',
      pack_quantity: product.pack_quantity,
      in_stock: product.in_stock,
      is_popular: product.is_popular,
      is_new: product.is_new,
      is_active: product.is_active,
      cover_image: product.cover_image || '',
      vendor_id: (product as any).vendor_id || '',
      weight_kg: product.weight_kg,
      tags: product.tags || [],
      is_shippable_international: (product as any).is_shippable_international ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      original_price: formData.original_price || null,
      vendor_id: formData.vendor_id || null,
      unit_value: formData.unit_value || null,
      unit_measure: formData.unit_measure || null,
      pack_quantity: formData.pack_quantity || null,
      is_shippable_international: formData.is_shippable_international,
    };

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
    setDeleteConfirm(null);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Товары маркетплейса' : 'Marketplace Products'}</h1>
          <p className="text-muted-foreground">{isRu ? 'Управление каталогом товаров' : 'Manage product catalog'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить товар' : 'Add Product'}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск товаров...' : 'Search products...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRu ? 'Категория' : 'Category'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все категории' : 'All categories'}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.slug}>
                    {isRu ? cat.name_ru : cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRu ? 'Продавец' : 'Vendor'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все продавцы' : 'All vendors'}</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {isRu ? v.name_ru : v.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={isRu ? 'Наличие' : 'Stock'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
                <SelectItem value="in_stock">{isRu ? 'В наличии' : 'In Stock'}</SelectItem>
                <SelectItem value="out_of_stock">{isRu ? 'Нет в наличии' : 'Out of Stock'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isRu ? 'Товары' : 'Products'} ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Товары не найдены' : 'No products found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{isRu ? 'Фото' : 'Image'}</TableHead>
                  <TableHead>{isRu ? 'Название' : 'Name'}</TableHead>
                  <TableHead>{isRu ? 'Категория' : 'Category'}</TableHead>
                  <TableHead>{isRu ? 'Цена' : 'Price'}</TableHead>
                  <TableHead>{isRu ? 'Наличие' : 'Stock'}</TableHead>
                  <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.cover_image ? (
                        <img
                          src={product.cover_image}
                          alt={product.name_en}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{isRu ? product.name_ru : product.name_en}</div>
                        <div className="text-xs text-muted-foreground">{product.vendor_name || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category_slug}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{product.currency} {product.price}</span>
                        {product.original_price && (
                          <span className="text-xs text-muted-foreground line-through ml-2">
                            {product.original_price}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.in_stock ? 'default' : 'secondary'}>
                        {product.in_stock ? (isRu ? 'Есть' : 'Yes') : (isRu ? 'Нет' : 'No')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {product.is_active && <Badge variant="outline" className="text-green-600">Active</Badge>}
                        {product.is_popular && <Badge variant="outline" className="text-orange-600">Popular</Badge>}
                        {product.is_new && <Badge variant="outline" className="text-blue-600">New</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(product)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {isRu ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(product.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? (isRu ? 'Редактировать товар' : 'Edit Product')
                : (isRu ? 'Добавить товар' : 'Add Product')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание (RU)</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Категория' : 'Category'}</Label>
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
                        {isRu ? cat.name_ru : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Продавец' : 'Vendor'}</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(v) => setFormData({ ...formData, vendor_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите продавца' : 'Select vendor'} />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {isRu ? v.name_ru : v.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Цена' : 'Price'}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Старая цена' : 'Original Price'}</Label>
                <Input
                  type="number"
                  value={formData.original_price || ''}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => setFormData({ ...formData, currency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">THB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="RUB">RUB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Unit (EN)</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g., pack, bottle"
                />
              </div>
              <div className="space-y-2">
                <Label>Единица (RU)</Label>
                <Input
                  value={formData.unit_ru}
                  onChange={(e) => setFormData({ ...formData, unit_ru: e.target.value })}
                  placeholder="напр., уп, бут"
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Вес (кг)' : 'Weight (kg)'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Precise Unit Section */}
            <div className="border border-border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">
                {isRu ? 'Точные единицы измерения' : 'Precise Unit Specification'}
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRu ? 'Значение' : 'Value'}</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.unit_value ?? ''}
                    onChange={(e) => setFormData({ ...formData, unit_value: e.target.value ? Number(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'напр. 500 (для 500г)' : 'e.g., 500 (for 500g)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Единица' : 'Measure'}</Label>
                  <Select
                    value={formData.unit_measure}
                    onValueChange={(v) => setFormData({ ...formData, unit_measure: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Выберите' : 'Select'} />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnitMeasureOptions(isRu ? 'ru' : 'en').map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRu ? 'Кол-во в уп.' : 'Pack Qty'}</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 6"
                    value={formData.pack_quantity ?? ''}
                    onChange={(e) => setFormData({ ...formData, pack_quantity: e.target.value ? Number(e.target.value) : null })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'напр. 6 (для 6 шт)' : 'e.g., 6 (for 6 pcs)'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRu ? 'Изображение (URL)' : 'Cover Image (URL)'}</Label>
              <Input
                value={formData.cover_image}
                onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.in_stock}
                  onCheckedChange={(v) => setFormData({ ...formData, in_stock: v })}
                />
                <Label>{isRu ? 'В наличии' : 'In Stock'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>{isRu ? 'Активен' : 'Active'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(v) => setFormData({ ...formData, is_popular: v })}
                />
                <Label>{isRu ? 'Популярный' : 'Popular'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_new}
                  onCheckedChange={(v) => setFormData({ ...formData, is_new: v })}
                />
                <Label>{isRu ? 'Новинка' : 'New'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_shippable_international}
                  onCheckedChange={(v) => setFormData({ ...formData, is_shippable_international: v })}
                />
                <Label>{isRu ? 'Международная доставка' : 'International Shipping'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name_en || !formData.category_slug}>
              {editingProduct ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить товар?' : 'Delete product?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие нельзя отменить. Товар будет удален навсегда.'
                : 'This action cannot be undone. The product will be permanently deleted.'}
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
