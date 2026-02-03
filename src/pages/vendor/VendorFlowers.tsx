import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorFlowers, VendorFlowerShop } from '@/hooks/useVendorFlowers';
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
import { Flower2, Plus, MoreVertical, Edit, Trash2, Loader2, Star, MapPin, Truck } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const VendorFlowers = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { shops, isLoading, createShop, updateShop, deleteShop } = useVendorFlowers(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorFlowerShop | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', description_en: '', description_ru: '',
    address: '', phone: '', email: '',
    cover_image: '',
    delivery_available: true, delivery_fee: '', min_order_amount: '',
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) navigate('/vendor/onboarding');
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name_en: '', name_ru: '', description_en: '', description_ru: '',
      address: '', phone: '', email: '',
      cover_image: '',
      delivery_available: true, delivery_fee: '', min_order_amount: '',
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorFlowerShop) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      address: item.address || '', phone: item.phone || '', email: item.email || '',
      cover_image: item.cover_image || '',
      delivery_available: item.delivery_available ?? true,
      delivery_fee: (item.delivery_fee || '').toString(),
      min_order_amount: (item.min_order_amount || '').toString(),
      is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en) {
      toast.error(isRussian ? 'Заполните название' : 'Please fill the name');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        name_en: formData.name_en, name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        cover_image: formData.cover_image || undefined,
        delivery_available: formData.delivery_available,
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : undefined,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : undefined,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await updateShop(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createShop(data);
        if (error) throw error;
        toast.success(isRussian ? 'Добавлено' : 'Added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(isRussian ? 'Ошибка' : 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteShop(id);
      if (error) throw error;
      toast.success(isRussian ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка' : 'Error');
    }
  };

  if (authLoading || profileLoading) {
    return <PageContainer><Skeleton className="h-8 w-48" /></PageContainer>;
  }

  return (
    <PageContainer>

        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить' : 'Add'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : shops.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <Flower2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">{isRussian ? 'Нет магазинов' : 'No shops'}</h3>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {shops.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Flower2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                            {item.delivery_available && (
                              <Badge variant="outline" className="text-xs"><Truck className="h-3 w-3 mr-1" />{isRussian ? 'Доставка' : 'Delivery'}</Badge>
                            )}
                          </div>
                          {item.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{item.address}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1">
                            {item.min_order_amount && <span className="text-muted-foreground">{isRussian ? 'Мин.' : 'Min.'} ฿{item.min_order_amount}</span>}
                            {item.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />{item.rating.toFixed(1)}</span>}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="h-4 w-4 mr-2" />{isRussian ? 'Редактировать' : 'Edit'}</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => setDeleteConfirmId(item.id)}><Trash2 className="h-4 w-4 mr-2" />{isRussian ? 'Удалить' : 'Delete'}</DropdownMenuItem>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0"><DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Добавить' : 'Add')}</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="flowers" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label><Textarea value={formData.description_en} onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Адрес' : 'Address'}</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Телефон' : 'Phone'}</Label><Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>{isRussian ? 'Доставка' : 'Delivery Available'}</Label><Switch checked={formData.delivery_available} onCheckedChange={(v) => setFormData(prev => ({ ...prev, delivery_available: v }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Стоимость доставки' : 'Delivery Fee'}</Label><Input type="number" value={formData.delivery_fee} onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Мин. заказ' : 'Min Order'}</Label><Input type="number" value={formData.min_order_amount} onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: e.target.value }))} /></div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRussian ? 'Отмена' : 'Cancel'}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{isRussian ? 'Сохранить' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{isRussian ? 'Удалить?' : 'Delete?'}</DialogTitle></DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{isRussian ? 'Отмена' : 'Cancel'}</Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>{isRussian ? 'Удалить' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorFlowers;
