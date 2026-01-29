import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminMarketplaceVendors, useProductCountsByVendor } from '@/hooks/useAdminMarketplace';
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
import { Plus, MoreHorizontal, Pencil, Trash2, Store, Star, CheckCircle2, XCircle } from 'lucide-react';
import type { MarketplaceVendor } from '@/types/marketplace';

export default function AdminMarketplaceVendors() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { vendors, isLoading, createVendor, updateVendor, deleteVendor } = useAdminMarketplaceVendors();
  const { data: productCounts = {} } = useProductCountsByVendor();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<MarketplaceVendor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    slug: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    logo_url: '',
    cover_image: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    address_ru: '',
    verified: false,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      slug: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      logo_url: '',
      cover_image: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      address_ru: '',
      verified: false,
      is_active: true,
    });
    setEditingVendor(null);
  };

  const openCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (vendor: MarketplaceVendor) => {
    setEditingVendor(vendor);
    setFormData({
      slug: vendor.slug,
      name_en: vendor.name_en,
      name_ru: vendor.name_ru,
      description_en: vendor.description_en || '',
      description_ru: vendor.description_ru || '',
      logo_url: vendor.logo_url || '',
      cover_image: vendor.cover_image || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      website: vendor.website || '',
      address: vendor.address || '',
      address_ru: vendor.address_ru || '',
      verified: vendor.verified,
      is_active: vendor.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      logo_url: formData.logo_url || null,
      cover_image: formData.cover_image || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      address: formData.address || null,
      address_ru: formData.address_ru || null,
    };

    if (editingVendor) {
      await updateVendor.mutateAsync({ id: editingVendor.id, ...payload });
    } else {
      await createVendor.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteVendor.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const toggleVerified = async (vendor: MarketplaceVendor) => {
    await updateVendor.mutateAsync({ id: vendor.id, verified: !vendor.verified });
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Продавцы маркетплейса' : 'Marketplace Vendors'}</h1>
          <p className="text-muted-foreground">{isRu ? 'Управление продавцами и верификация' : 'Manage vendors and verification'}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить продавца' : 'Add Vendor'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {isRu ? 'Продавцы' : 'Vendors'} ({vendors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {isRu ? 'Продавцы не найдены' : 'No vendors found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{isRu ? 'Лого' : 'Logo'}</TableHead>
                  <TableHead>{isRu ? 'Название' : 'Name'}</TableHead>
                  <TableHead>{isRu ? 'Товаров' : 'Products'}</TableHead>
                  <TableHead>{isRu ? 'Рейтинг' : 'Rating'}</TableHead>
                  <TableHead>{isRu ? 'Верифицирован' : 'Verified'}</TableHead>
                  <TableHead>{isRu ? 'Активен' : 'Active'}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      {vendor.logo_url ? (
                        <img
                          src={vendor.logo_url}
                          alt={vendor.name_en}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <Store className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{isRu ? vendor.name_ru : vendor.name_en}</div>
                        <div className="text-xs text-muted-foreground">{vendor.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{productCounts[vendor.id] || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {vendor.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{vendor.rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({vendor.review_count})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVerified(vendor)}
                        className={vendor.verified ? 'text-green-600' : 'text-muted-foreground'}
                      >
                        {vendor.verified ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                        {vendor.is_active ? '✓' : '✗'}
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
                          <DropdownMenuItem onClick={() => openEdit(vendor)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {isRu ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteConfirm(vendor.id)}
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
              {editingVendor
                ? (isRu ? 'Редактировать продавца' : 'Edit Vendor')
                : (isRu ? 'Добавить продавца' : 'Add Vendor')}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="vendor-slug"
                disabled={!!editingVendor}
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
                <Label>{isRu ? 'Логотип (URL)' : 'Logo URL'}</Label>
                <Input
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Обложка (URL)' : 'Cover Image URL'}</Label>
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRu ? 'Сайт' : 'Website'}</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Address (EN)</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Адрес (RU)</Label>
                <Input
                  value={formData.address_ru}
                  onChange={(e) => setFormData({ ...formData, address_ru: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.verified}
                  onCheckedChange={(v) => setFormData({ ...formData, verified: v })}
                />
                <Label>{isRu ? 'Верифицирован' : 'Verified'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>{isRu ? 'Активен' : 'Active'}</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.slug || !formData.name_en}>
              {editingVendor ? (isRu ? 'Сохранить' : 'Save') : (isRu ? 'Создать' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить продавца?' : 'Delete vendor?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие нельзя отменить. Все товары этого продавца останутся без привязки.'
                : 'This action cannot be undone. All products from this vendor will be unlinked.'}
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
