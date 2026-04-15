import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';

interface VendorLegalService {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  description_en?: string;
  description_ru?: string;
  service_type?: string;
  specializations?: string[];
  languages?: string[];
  price_consultation?: number;
  currency?: string;
  address?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  cover_image?: string;
  images?: string[];
  working_hours?: Record<string, unknown>;
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Scale, Plus, MoreVertical, Edit, Trash2, Loader2, Star } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const serviceTypes = [
  { value: 'law_firm', label: 'Law Firm', labelRu: 'Юридическая фирма' },
  { value: 'notary', label: 'Notary', labelRu: 'Нотариус' },
  { value: 'visa', label: 'Visa Services', labelRu: 'Визовые услуги' },
  { value: 'accounting', label: 'Accounting', labelRu: 'Бухгалтерия' },
  { value: 'translation', label: 'Translation', labelRu: 'Переводы' },
];

const VendorLegal = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items: services, isLoading, create: createService, update: updateService, remove: deleteService } = useVerticalCRUD<VendorLegalService>('legal', profile?.id, {
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,service_type,specializations,languages,price_consultation,currency,address,district,phone,email,website,cover_image,images,working_hours,is_active,is_featured,is_verified,rating,review_count,lat,lng,created_at,updated_at',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorLegalService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', description_en: '', description_ru: '',
    service_type: 'law_firm', specializations: '', languages: '',
    price_consultation: '', address: '', phone: '', email: '', cover_image: '',
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
      service_type: 'law_firm', specializations: '', languages: '',
      price_consultation: '', address: '', phone: '', email: '', cover_image: '',
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorLegalService) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      service_type: item.service_type || 'law_firm',
      specializations: item.specializations?.join(', ') || '',
      languages: item.languages?.join(', ') || '',
      price_consultation: (item.price_consultation || '').toString(),
      address: item.address || '', phone: item.phone || '', email: item.email || '',
      cover_image: item.cover_image || '',
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
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        service_type: formData.service_type,
        specializations: formData.specializations ? formData.specializations.split(',').map(s => s.trim()).filter(Boolean) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
        price_consultation: formData.price_consultation ? parseFloat(formData.price_consultation) : null,
        currency: 'THB',
        address: formData.address || null, phone: formData.phone || null, email: formData.email || null,
        cover_image: formData.cover_image || null,
        is_active: formData.is_active,
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
            <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
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
                        <Scale className="h-8 w-8 text-muted-foreground" />
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
                          </div>
                          {item.specializations && item.specializations.length > 0 && (
                            <p className="text-sm text-muted-foreground">{item.specializations.slice(0, 3).join(', ')}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1">
                            {item.price_consultation && <span className="font-bold text-primary">฿{item.price_consultation} {isRussian ? 'консультация' : 'consultation'}</span>}
                            {item.rating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{item.rating.toFixed(1)}</span>}
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
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="legal" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Специализации' : 'Specializations'}</Label><Input value={formData.specializations} onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))} placeholder="Visa, Immigration, Business" /></div>
                <div className="space-y-2"><Label>{isRussian ? 'Цена консультации' : 'Consultation Price'}</Label><Input type="number" value={formData.price_consultation} onChange={(e) => setFormData(prev => ({ ...prev, price_consultation: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Адрес' : 'Address'}</Label><Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Телефон' : 'Phone'}</Label><Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} /></div>
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

export default VendorLegal;
