import React, { useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Flower2, TrendingUp, DollarSign, Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminFlowers } from '@/hooks/useAdminContent';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ==================== SHOPS TAB (existing) ====================

interface FlowerShopFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  address: string;
  phone: string;
  email: string;
  delivery_available: boolean;
  delivery_fee: number | null;
  min_order_amount: number | null;
  cover_image: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  provider_id: string;
}

const defaultFormData: FlowerShopFormData = {
  name_en: '', name_ru: '', description_en: '', description_ru: '',
  address: '', phone: '', email: '', delivery_available: true,
  delivery_fee: null, min_order_amount: null, cover_image: '', images: [],
  is_active: true, is_featured: false, provider_id: '',
};

// ==================== BOUQUETS ADMIN ====================

function useBouquetsAdmin() {
  const queryClient = useQueryClient();

  const { data: bouquets = [], isLoading } = useQuery({
    queryKey: ['admin-bouquets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bouquets')
        .select('*, shop:flower_shops!bouquets_shop_id_fkey(name_en, name_ru)')
        .order('bestseller_rank', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from('bouquets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bouquets'] }),
  });

  const toggleActive = (id: string, isActive: boolean) =>
    updateMutation.mutateAsync({ id, updates: { is_active: isActive } });

  const updatePrice = (id: string, price: number, sizeVariants: any) =>
    updateMutation.mutateAsync({ id, updates: { price, size_variants: sizeVariants } });

  const updateField = (id: string, field: string, value: any) =>
    updateMutation.mutateAsync({ id, updates: { [field]: value } });

  return { bouquets, isLoading, toggleActive, updatePrice, updateField, updateMutation };
}

export default function AdminFlowers() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { items, isLoading: shopsLoading, createItem, updateItem, deleteItem } = useAdminFlowers();
  const { bouquets, isLoading: bouquetsLoading, toggleActive, updateField } = useBouquetsAdmin();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<FlowerShopFormData>(defaultFormData);
  const [editingPrices, setEditingPrices] = useState<Record<string, any>>({});

  // Shop CRUD handlers
  const handleCreate = () => { setEditingItem(null); setFormData(defaultFormData); setIsDialogOpen(true); };
  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en || '', name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      address: item.address || '', phone: item.phone || '', email: item.email || '',
      delivery_available: item.delivery_available ?? true, delivery_fee: item.delivery_fee,
      min_order_amount: item.min_order_amount, cover_image: item.cover_image || '',
      images: item.images || [], is_active: item.is_active ?? true,
      is_featured: item.is_featured || false, provider_id: item.provider_id || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru) {
      toast.error(isRu ? 'Заполните названия' : 'Fill in names');
      return;
    }
    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, ...formData });
        toast.success(isRu ? 'Обновлено' : 'Updated');
      } else {
        await createItem(formData);
        toast.success(isRu ? 'Создано' : 'Created');
      }
      setIsDialogOpen(false);
    } catch { toast.error(isRu ? 'Ошибка сохранения' : 'Save error'); }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRu ? 'Удалить?' : 'Delete?')) {
      await deleteItem(id);
      toast.success(isRu ? 'Удалено' : 'Deleted');
    }
  };

  // Inline price editing
  const startPriceEdit = (b: any) => {
    const variants = b.size_variants || [];
    setEditingPrices(prev => ({
      ...prev,
      [b.id]: {
        S: variants.find((v: any) => v.size === 'S')?.price || b.price,
        M: variants.find((v: any) => v.size === 'M')?.price || b.price,
        L: variants.find((v: any) => v.size === 'L')?.price || b.price,
        margin: b.margin_percent || 45,
      }
    }));
  };

  const savePriceEdit = async (b: any) => {
    const edit = editingPrices[b.id];
    if (!edit) return;
    const variants = (b.size_variants || []).map((v: any) => ({
      ...v,
      price: edit[v.size] || v.price,
    }));
    try {
      await supabase.from('bouquets').update({
        price: edit.S,
        size_variants: variants,
        margin_percent: edit.margin,
        cost_thb: Math.round(edit.S * (1 - edit.margin / 100)),
      }).eq('id', b.id);
      setEditingPrices(prev => { const n = { ...prev }; delete n[b.id]; return n; });
      toast.success('Saved');
    } catch { toast.error('Error'); }
  };

  // Stats
  const activeBouquets = bouquets.filter((b: any) => b.is_active).length;
  const avgPrice = bouquets.length
    ? Math.round(bouquets.reduce((s: number, b: any) => s + (b.price || 0), 0) / bouquets.length)
    : 0;

  return (
    <PageContainer>
      <PageHeader title={isRu ? 'Цветы — Управление' : 'Flowers — Management'} showBack />

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Букеты' : 'Bouquets'}</p>
          <p className="text-2xl font-bold">{activeBouquets}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Магазины' : 'Shops'}</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">{isRu ? 'Ср. цена' : 'Avg Price'}</p>
          <p className="text-2xl font-bold">฿{avgPrice}</p>
        </Card>
      </div>

      <Tabs defaultValue="bouquets">
        <TabsList className="w-full">
          <TabsTrigger value="bouquets" className="flex-1">
            <TrendingUp className="w-4 h-4 mr-1" />
            {isRu ? 'Букеты' : 'Bouquets'} ({bouquets.length})
          </TabsTrigger>
          <TabsTrigger value="shops" className="flex-1">
            <Flower2 className="w-4 h-4 mr-1" />
            {isRu ? 'Магазины' : 'Shops'} ({items.length})
          </TabsTrigger>
        </TabsList>

        {/* ===== BOUQUETS TAB ===== */}
        <TabsContent value="bouquets">
          <Card>
            <CardContent className="p-0">
              {bouquetsLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>{isRu ? 'Букет' : 'Bouquet'}</TableHead>
                        <TableHead>S / M / L</TableHead>
                        <TableHead>{isRu ? 'Маржа' : 'Margin'}</TableHead>
                        <TableHead>{isRu ? 'Психология' : 'Psychology'}</TableHead>
                        <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                        <TableHead className="text-right">{isRu ? 'Действия' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bouquets.map((b: any) => {
                        const variants = b.size_variants || [];
                        const sPrice = variants.find((v: any) => v.size === 'S')?.price || b.price;
                        const mPrice = variants.find((v: any) => v.size === 'M')?.price || b.price;
                        const lPrice = variants.find((v: any) => v.size === 'L')?.price || b.price;
                        const isEditing = !!editingPrices[b.id];

                        return (
                          <TableRow key={b.id} className={!b.is_active ? 'opacity-50' : ''}>
                            <TableCell className="text-xs text-muted-foreground">{b.bestseller_rank || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {b.image && <img src={b.image} alt="" className="w-8 h-8 rounded-none object-cover" />}
                                <div>
                                  <p className="font-medium text-sm truncate max-w-[120px]">
                                    {isRu ? b.name_ru : b.name_en}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">{b.category} · {b.style}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <div className="flex gap-1">
                                  {['S', 'M', 'L'].map(s => (
                                    <Input
                                      key={s}
                                      type="number"
                                      className="w-16 h-7 text-xs"
                                      value={editingPrices[b.id][s]}
                                      onChange={e => setEditingPrices(prev => ({
                                        ...prev,
                                        [b.id]: { ...prev[b.id], [s]: Number(e.target.value) }
                                      }))}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs">
                                  ฿{sPrice} / ฿{mPrice} / ฿{lPrice}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <Input
                                  type="number"
                                  className="w-14 h-7 text-xs"
                                  value={editingPrices[b.id].margin}
                                  onChange={e => setEditingPrices(prev => ({
                                    ...prev,
                                    [b.id]: { ...prev[b.id], margin: Number(e.target.value) }
                                  }))}
                                />
                              ) : (
                                <span className="text-xs">{b.margin_percent || '-'}%</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-0.5">
                                {b.social_proof_badge && (
                                  <Badge variant="secondary" className="text-[9px]">{b.social_proof_badge}</Badge>
                                )}
                                {b.urgency_badge && (
                                  <Badge variant="outline" className="text-[9px]">{b.urgency_badge}</Badge>
                                )}
                                {b.emotional_trigger_tag && (
                                  <span className="text-[9px] text-muted-foreground">🧠 {b.emotional_trigger_tag}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={b.is_active}
                                onCheckedChange={(checked) => {
                                  toggleActive(b.id, checked);
                                  toast.success(checked ? 'Activated' : 'Deactivated');
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Button variant="ghost" size="icon" onClick={() => savePriceEdit(b)}>
                                  <Save className="h-4 w-4 text-primary" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => startPriceEdit(b)}>
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SHOPS TAB ===== */}
        <TabsContent value="shops">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flower2 className="h-5 w-5" />
                {isRu ? 'Цветочные магазины' : 'Flower Shops'}
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    {isRu ? 'Добавить' : 'Add'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? (isRu ? 'Редактировать' : 'Edit') : (isRu ? 'Добавить' : 'Add')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <ProviderSelector
                      value={formData.provider_id}
                      onChange={(id) => setFormData({ ...formData, provider_id: id })}
                      label={isRu ? 'Провайдер' : 'Provider'}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Name (EN)</Label><Input value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} /></div>
                      <div><Label>Название (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({ ...formData, description_en: e.target.value })} /></div>
                      <div><Label>Описание (RU)</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })} /></div>
                    </div>
                    <div><Label>{isRu ? 'Адрес' : 'Address'}</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                      <div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>{isRu ? 'Стоимость доставки' : 'Delivery Fee'}</Label><Input type="number" value={formData.delivery_fee || ''} onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value ? Number(e.target.value) : null })} /></div>
                      <div><Label>{isRu ? 'Мин. сумма заказа' : 'Min Order Amount'}</Label><Input type="number" value={formData.min_order_amount || ''} onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value ? Number(e.target.value) : null })} /></div>
                    </div>
                    <div><Label>{isRu ? 'Обложка' : 'Cover Image'}</Label><ImageUpload value={formData.cover_image} onChange={(url) => setFormData({ ...formData, cover_image: url })} /></div>
                    <div><Label>{isRu ? 'Галерея' : 'Gallery'}</Label><MultiImageUpload value={formData.images} onChange={(urls) => setFormData({ ...formData, images: urls })} maxImages={8} /></div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2"><Switch checked={formData.delivery_available} onCheckedChange={(c) => setFormData({ ...formData, delivery_available: c })} /><Label>{isRu ? 'Доставка' : 'Delivery'}</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>{isRu ? 'Активно' : 'Active'}</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData({ ...formData, is_featured: c })} /><Label>{isRu ? 'Рекомендуем' : 'Featured'}</Label></div>
                    </div>
                    <Button onClick={handleSubmit} className="w-full">{isRu ? 'Сохранить' : 'Save'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {shopsLoading ? (
                <div className="text-center py-8 text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{isRu ? 'Нет данных' : 'No data'}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRu ? 'Название' : 'Name'}</TableHead>
                      <TableHead>{isRu ? 'Адрес' : 'Address'}</TableHead>
                      <TableHead>{isRu ? 'Статус' : 'Status'}</TableHead>
                      <TableHead className="text-right">{isRu ? 'Действия' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{isRu ? item.name_ru : item.name_en}</TableCell>
                        <TableCell>{item.address || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={item.is_active ? 'default' : 'secondary'}>
                            {item.is_active ? (isRu ? 'Активно' : 'Active') : (isRu ? 'Неактивно' : 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
