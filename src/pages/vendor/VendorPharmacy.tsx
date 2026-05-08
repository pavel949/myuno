import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';
import type { Pharmacy } from '@/hooks/usePharmacy';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Pill, Plus, MoreVertical, Edit, Trash2, Loader2, MapPin, Truck, Clock } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const initialForm = {
  name_en: '', name_ru: '', description_en: '', description_ru: '',
  address: '', phone: '', email: '', website: '',
  cover_image: '',
  delivery_available: true, delivery_fee: '', delivery_radius_km: '', min_order_amount: '',
  is_24h: false, has_pharmacist: true,
  license_number: '',
  is_active: true,
};

const VendorPharmacy = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items, isLoading, create, update, remove } = useVerticalCRUD<Pharmacy>('pharmacy', profile?.id);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pharmacy | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialForm);

  const isRu = language === 'ru';

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) navigate('/vendor/onboarding');
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => { setFormData(initialForm); setEditingItem(null); };

  const openEditDialog = (item: Pharmacy) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      address: item.address || '', phone: item.phone || '', email: item.email || '', website: item.website || '',
      cover_image: item.cover_image || '',
      delivery_available: item.delivery_available ?? true,
      delivery_fee: (item.delivery_fee || '').toString(),
      delivery_radius_km: (item.delivery_radius_km || '').toString(),
      min_order_amount: (item.min_order_amount || '').toString(),
      is_24h: item.is_24h ?? false,
      has_pharmacist: item.has_pharmacist ?? true,
      license_number: item.license_number || '',
      is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en) {
      toast.error(isRu ? 'Заполните название (EN)' : 'Please fill the name (EN)');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: Partial<Pharmacy> = {
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        cover_image: formData.cover_image || null,
        delivery_available: formData.delivery_available,
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
        delivery_radius_km: formData.delivery_radius_km ? parseFloat(formData.delivery_radius_km) : 0,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        is_24h: formData.is_24h,
        has_pharmacist: formData.has_pharmacist,
        license_number: formData.license_number || null,
        is_active: formData.is_active,
      };

      const { error } = editingItem ? await update(editingItem.id, data) : await create(data);
      if (error) throw error;
      toast.success(editingItem ? (isRu ? 'Обновлено' : 'Updated') : (isRu ? 'Добавлено' : 'Added'));
      setIsDialogOpen(false);
      resetForm();
    } catch (e) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await remove(id);
      if (error) throw error;
      toast.success(isRu ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (authLoading || profileLoading) {
    return <PageContainer><Skeleton className="h-8 w-48" /></PageContainer>;
  }

  return (
    <PageContainer>
      <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
        <Plus className="h-4 w-4 mr-2" />{isRu ? 'Добавить аптеку' : 'Add Pharmacy'}
      </Button>

      {isLoading ? (
        <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-1">{isRu ? 'Нет аптек' : 'No pharmacies'}</h3>
          <p className="text-sm text-muted-foreground">{isRu ? 'Добавьте свою первую аптеку' : 'Add your first pharmacy'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {item.cover_image ? (
                    <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-none object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-none bg-muted flex items-center justify-center">
                      <Pill className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-medium">{isRu ? item.name_ru : item.name_en}</h3>
                          {item.is_24h && <Badge variant="secondary" className="bg-success/15 text-success text-xs"><Clock className="h-3 w-3 mr-1" />24/7</Badge>}
                          {item.delivery_available && <Badge variant="outline" className="text-xs"><Truck className="h-3 w-3 mr-1" />{isRu ? 'Доставка' : 'Delivery'}</Badge>}
                          {!item.is_active && <Badge variant="outline" className="text-xs">{isRu ? 'Неактивна' : 'Inactive'}</Badge>}
                        </div>
                        {item.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="h-4 w-4 mr-2" />{isRu ? 'Редактировать' : 'Edit'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}><Trash2 className="h-4 w-4 mr-2" />{isRu ? 'Удалить' : 'Delete'}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsDialogOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0"><DialogTitle>{editingItem ? (isRu ? 'Редактировать аптеку' : 'Edit Pharmacy') : (isRu ? 'Добавить аптеку' : 'Add Pharmacy')}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>{isRu ? 'Обложка' : 'Cover'}</Label>
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(p => ({ ...p, cover_image: url }))} folder="pharmacies" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(p => ({ ...p, name_ru: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Описание (EN)' : 'Description (EN)'}</Label><Textarea value={formData.description_en} onChange={(e) => setFormData(p => ({ ...p, description_en: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Описание (RU)' : 'Description (RU)'}</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData(p => ({ ...p, description_ru: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Адрес' : 'Address'}</Label><Input value={formData.address} onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Сайт' : 'Website'}</Label><Input value={formData.website} onChange={(e) => setFormData(p => ({ ...p, website: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>{isRu ? 'Номер лицензии' : 'License Number'}</Label><Input value={formData.license_number} onChange={(e) => setFormData(p => ({ ...p, license_number: e.target.value }))} /></div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Работает 24/7' : 'Open 24/7'}</Label><Switch checked={formData.is_24h} onCheckedChange={(v) => setFormData(p => ({ ...p, is_24h: v }))} /></div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Есть фармацевт' : 'Has Pharmacist'}</Label><Switch checked={formData.has_pharmacist} onCheckedChange={(v) => setFormData(p => ({ ...p, has_pharmacist: v }))} /></div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Доставка' : 'Delivery Available'}</Label><Switch checked={formData.delivery_available} onCheckedChange={(v) => setFormData(p => ({ ...p, delivery_available: v }))} /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>{isRu ? 'Стоимость, ฿' : 'Delivery Fee ฿'}</Label><Input type="number" value={formData.delivery_fee} onChange={(e) => setFormData(p => ({ ...p, delivery_fee: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Радиус, км' : 'Radius, km'}</Label><Input type="number" value={formData.delivery_radius_km} onChange={(e) => setFormData(p => ({ ...p, delivery_radius_km: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{isRu ? 'Мин. заказ' : 'Min Order'}</Label><Input type="number" value={formData.min_order_amount} onChange={(e) => setFormData(p => ({ ...p, min_order_amount: e.target.value }))} /></div>
              </div>
              <div className="flex items-center justify-between"><Label>{isRu ? 'Активна' : 'Active'}</Label><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))} /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isRu ? 'Сохранить' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isRu ? 'Удалить аптеку?' : 'Delete pharmacy?'}</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>{isRu ? 'Удалить' : 'Delete'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default VendorPharmacy;
