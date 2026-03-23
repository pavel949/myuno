import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorRestaurants, VendorRestaurant } from '@/hooks/useVendorRestaurants';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  UtensilsCrossed, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Loader2,
  Star
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';

const cuisineTypes = [
  { value: 'thai', label: 'Thai', labelRu: 'Тайская' },
  { value: 'european', label: 'European', labelRu: 'Европейская' },
  { value: 'japanese', label: 'Japanese', labelRu: 'Японская' },
  { value: 'italian', label: 'Italian', labelRu: 'Итальянская' },
  { value: 'seafood', label: 'Seafood', labelRu: 'Морепродукты' },
  { value: 'international', label: 'International', labelRu: 'Интернациональная' },
];

const VendorRestaurants = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { restaurants, isLoading, createRestaurant, updateRestaurant, deleteRestaurant } = useVendorRestaurants(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorRestaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    cuisine: 'thai',
    address: '',
    district: '',
    phone: '',
    email: '',
    cover_image: '',
    images: [] as string[],
    price_range: '2',
    delivery_available: false,
    delivery_fee: '',
    delivery_time: '',
    min_order_amount: '',
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      cuisine: 'thai',
      address: '',
      district: '',
      phone: '',
      email: '',
      cover_image: '',
      images: [],
      price_range: '2',
      delivery_available: false,
      delivery_fee: '',
      delivery_time: '',
      min_order_amount: '',
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorRestaurant) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en,
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      cuisine: (item as any).cuisine || 'thai',
      address: item.address || '',
      district: item.district || '',
      phone: item.phone || '',
      email: item.email || '',
      cover_image: item.cover_image || '',
      images: item.images || [],
      price_range: ((item as any).price_range || 2).toString(),
      delivery_available: (item as any).delivery_available || false,
      delivery_fee: ((item as any).delivery_fee || '').toString(),
      delivery_time: (item as any).delivery_time || '',
      min_order_amount: ((item as any).min_order_amount || '').toString(),
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
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        cuisine: formData.cuisine,
        address: formData.address || undefined,
        district: formData.district || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        cover_image: formData.cover_image || undefined,
        images: formData.images,
        price_range: parseInt(formData.price_range),
        delivery_available: formData.delivery_available,
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
        delivery_time: formData.delivery_time || undefined,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await updateRestaurant(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Ресторан обновлён' : 'Restaurant updated');
      } else {
        const { error } = await createRestaurant(data);
        if (error) throw error;
        toast.success(isRussian ? 'Ресторан добавлен' : 'Restaurant added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      logger.error('Error saving:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteRestaurant(id);
      if (error) throw error;
      toast.success(isRussian ? 'Ресторан удалён' : 'Restaurant deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>

        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить ресторан' : 'Add Restaurant'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : restaurants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">{isRussian ? 'Нет ресторанов' : 'No restaurants'}</h3>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Добавьте свой ресторан' : 'Add your restaurant'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {restaurants.map((item) => (
              <Card key={item.id} className={!item.is_verified ? 'border-warning/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {cuisineTypes.find(t => t.value === item.cuisine)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            <ApprovalStatusBadge 
                              status={(item as any).approval_status} 
                              rejectionReason={(item as any).rejection_reason}
                            />
                          </div>
                          {item.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {item.address}
                            </p>
                          )}
                          {item.rating && (
                            <p className="text-sm flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {item.rating.toFixed(1)} ({item.review_count})
                            </p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}>
                              <Edit className="h-4 w-4 mr-2" />{isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}>
                              <Trash2 className="h-4 w-4 mr-2" />{isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>
                {editingItem ? (isRussian ? 'Редактировать ресторан' : 'Edit Restaurant') : (isRussian ? 'Новый ресторан' : 'New Restaurant')}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                  <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="restaurants" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                    <Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                    <Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                    <Textarea value={formData.description_en} onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                    <Textarea value={formData.description_ru} onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                    <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Доставка' : 'Delivery'}</Label>
                  <Switch checked={formData.delivery_available} onCheckedChange={(v) => setFormData(prev => ({ ...prev, delivery_available: v }))} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRussian ? 'Отмена' : 'Cancel'}</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRussian ? 'Сохранить' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Подтвердите удаление' : 'Confirm Deletion'}</DialogTitle>
            </DialogHeader>
            <p>{isRussian ? 'Вы уверены, что хотите удалить этот ресторан?' : 'Are you sure you want to delete this restaurant?'}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{isRussian ? 'Отмена' : 'Cancel'}</Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>{isRussian ? 'Удалить' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorRestaurants;
