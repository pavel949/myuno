import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorCleaning, VendorCleaningService } from '@/hooks/useVendorCleaning';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Sparkles, Plus, MoreVertical, Edit, Trash2, Loader2, Star, Clock } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const serviceTypes = [
  { value: 'regular', label: 'Regular Cleaning', labelRu: 'Обычная уборка' },
  { value: 'deep', label: 'Deep Cleaning', labelRu: 'Генеральная уборка' },
  { value: 'move_in', label: 'Move-in/out', labelRu: 'При въезде/выезде' },
  { value: 'office', label: 'Office', labelRu: 'Офис' },
  { value: 'after_party', label: 'After Party', labelRu: 'После вечеринки' },
];

const VendorCleaning = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { services, isLoading, createService, updateService, deleteService } = useVendorCleaning(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorCleaningService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', description_en: '', description_ru: '',
    service_type: 'regular', features: '', areas_served: '',
    price_per_hour: '', price_fixed: '', duration_hours: '',
    cover_image: '', is_active: true,
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
      service_type: 'regular', features: '', areas_served: '',
      price_per_hour: '', price_fixed: '', duration_hours: '',
      cover_image: '', is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorCleaningService) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      service_type: item.service_type || 'regular',
      features: item.features?.join(', ') || '',
      areas_served: item.areas_served?.join(', ') || '',
      price_per_hour: (item.price_per_hour || '').toString(),
      price_fixed: (item.price_fixed || '').toString(),
      duration_hours: (item.duration_hours || '').toString(),
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
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        service_type: formData.service_type,
        features: formData.features ? formData.features.split(',').map(s => s.trim()).filter(Boolean) : [],
        areas_served: formData.areas_served ? formData.areas_served.split(',').map(s => s.trim()).filter(Boolean) : [],
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : undefined,
        price_fixed: formData.price_fixed ? parseFloat(formData.price_fixed) : undefined,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : undefined,
        currency: 'THB',
        cover_image: formData.cover_image || undefined,
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
    return <AppLayout><PageContainer><Skeleton className="h-8 w-48" /></PageContainer></AppLayout>;
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title={isRussian ? 'Услуги уборки' : 'Cleaning Services'} showBack />

        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить' : 'Add'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : services.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
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
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
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
                          {item.features && item.features.length > 0 && (
                            <p className="text-sm text-muted-foreground">{item.features.slice(0, 3).join(', ')}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1">
                            {item.price_per_hour && <span className="font-bold text-primary">฿{item.price_per_hour}/hr</span>}
                            {item.price_fixed && <span className="font-bold text-primary">฿{item.price_fixed}</span>}
                            {item.duration_hours && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{item.duration_hours}h</span>}
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
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="cleaning" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Включено' : 'Features'}</Label><Input value={formData.features} onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))} placeholder="Windows, Bathroom, Kitchen" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/час' : 'Price/hour'}</Label><Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Фикс. цена' : 'Fixed Price'}</Label><Input type="number" value={formData.price_fixed} onChange={(e) => setFormData(prev => ({ ...prev, price_fixed: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Районы' : 'Areas Served'}</Label><Input value={formData.areas_served} onChange={(e) => setFormData(prev => ({ ...prev, areas_served: e.target.value }))} placeholder="Patong, Kata, Karon" /></div>
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
    </AppLayout>
  );
};

export default VendorCleaning;
