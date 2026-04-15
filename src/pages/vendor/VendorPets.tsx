import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';

interface VendorPetService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  pet_types?: string[];
  services_offered?: string[];
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
  has_pickup?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
}
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { PawPrint, Plus, MoreVertical, Edit, Trash2, Loader2, Star, MapPin } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const serviceTypes = [
  { value: 'grooming', label: 'Grooming', labelRu: 'Груминг' },
  { value: 'boarding', label: 'Boarding', labelRu: 'Передержка' },
  { value: 'vet', label: 'Veterinary', labelRu: 'Ветеринар' },
  { value: 'training', label: 'Training', labelRu: 'Дрессировка' },
  { value: 'walking', label: 'Walking', labelRu: 'Выгул' },
  { value: 'transport', label: 'Transport', labelRu: 'Транспорт' },
];

const VendorPets = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items: services, isLoading, create: createService, update: updateService, remove: deleteService } = useVerticalCRUD<VendorPetService>('pet_service', profile?.id, {
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,service_type,pet_types,services_offered,price_per_hour,price_per_day,currency,address,district,phone,email,website,cover_image,images,working_hours,has_pickup,is_active,is_featured,is_verified,rating,review_count,lat,lng,created_at,updated_at',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorPetService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', description_en: '', description_ru: '',
    service_type: 'grooming', pet_types: '', services_offered: '',
    price_per_hour: '', price_per_day: '',
    address: '', phone: '', cover_image: '',
    has_pickup: false, is_active: true,
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
      service_type: 'grooming', pet_types: '', services_offered: '',
      price_per_hour: '', price_per_day: '',
      address: '', phone: '', cover_image: '',
      has_pickup: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorPetService) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      service_type: item.service_type || 'grooming',
      pet_types: item.pet_types?.join(', ') || '',
      services_offered: item.services_offered?.join(', ') || '',
      price_per_hour: (item.price_per_hour || '').toString(),
      price_per_day: (item.price_per_day || '').toString(),
      address: item.address || '', phone: item.phone || '',
      cover_image: item.cover_image || '',
      has_pickup: item.has_pickup || false, is_active: item.is_active ?? true,
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
        service_type: formData.service_type,
        pet_types: formData.pet_types ? formData.pet_types.split(',').map(s => s.trim()).filter(Boolean) : [],
        services_offered: formData.services_offered ? formData.services_offered.split(',').map(s => s.trim()).filter(Boolean) : [],
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : undefined,
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : undefined,
        currency: 'THB',
        address: formData.address || undefined, phone: formData.phone || undefined,
        cover_image: formData.cover_image || undefined,
        has_pickup: formData.has_pickup, is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await updateService(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createService(data);
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
      const { error } = await deleteService(id);
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
        ) : services.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <PawPrint className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">{isRussian ? 'Нет услуг' : 'No services'}</h3>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {services.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <PawPrint className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {serviceTypes.find(t => t.value === item.service_type)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            {item.has_pickup && <Badge variant="outline" className="text-xs">Pickup</Badge>}
                          </div>
                          {item.pet_types && item.pet_types.length > 0 && (
                            <p className="text-sm text-muted-foreground">{item.pet_types.join(', ')}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1">
                            {item.price_per_hour && <span className="font-bold text-primary">฿{item.price_per_hour}/hr</span>}
                            {item.price_per_day && <span className="font-bold text-primary">฿{item.price_per_day}/day</span>}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(item)}><Edit className="h-4 w-4 mr-2" />{isRussian ? 'Редактировать' : 'Edit'}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}><Trash2 className="h-4 w-4 mr-2" />{isRussian ? 'Удалить' : 'Delete'}</DropdownMenuItem>
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
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="pets" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Типы питомцев' : 'Pet Types'}</Label><Input value={formData.pet_types} onChange={(e) => setFormData(prev => ({ ...prev, pet_types: e.target.value }))} placeholder="Dogs, Cats, Birds" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/час' : 'Price/hour'}</Label><Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/день' : 'Price/day'}</Label><Input type="number" value={formData.price_per_day} onChange={(e) => setFormData(prev => ({ ...prev, price_per_day: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>{isRussian ? 'Доставка/забор' : 'Pickup Available'}</Label><Switch checked={formData.has_pickup} onCheckedChange={(v) => setFormData(prev => ({ ...prev, has_pickup: v }))} /></div>
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

export default VendorPets;
