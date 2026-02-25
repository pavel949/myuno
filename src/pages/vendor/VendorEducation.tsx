import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorEducation, VendorEducationProvider } from '@/hooks/useVendorEducation';
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
import { GraduationCap, Plus, MoreVertical, Edit, Trash2, DollarSign, Loader2, Star } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const providerTypes = [
  { value: 'tutor', label: 'Tutor', labelRu: 'Репетитор' },
  { value: 'school', label: 'School', labelRu: 'Школа' },
  { value: 'course', label: 'Course', labelRu: 'Курс' },
  { value: 'workshop', label: 'Workshop', labelRu: 'Мастер-класс' },
];

const VendorEducation = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { providers, isLoading, createProvider, updateProvider, deleteProvider } = useVendorEducation(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorEducationProvider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', description_en: '', description_ru: '',
    provider_type: 'tutor', subjects: '', languages: '',
    price_per_hour: '', price_per_course: '',
    address: '', phone: '', email: '', cover_image: '',
    is_online: false, is_active: true,
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
      provider_type: 'tutor', subjects: '', languages: '',
      price_per_hour: '', price_per_course: '',
      address: '', phone: '', email: '', cover_image: '',
      is_online: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorEducationProvider) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      provider_type: item.provider_type || 'tutor',
      subjects: item.subjects?.join(', ') || '',
      languages: item.languages?.join(', ') || '',
      price_per_hour: (item.price_per_hour || '').toString(),
      price_per_course: (item.price_per_course || '').toString(),
      address: item.address || '', phone: item.phone || '', email: item.email || '',
      cover_image: item.cover_image || '',
      is_online: item.is_online || false, is_active: item.is_active ?? true,
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
        provider_type: formData.provider_type,
        subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : undefined,
        price_per_course: formData.price_per_course ? parseFloat(formData.price_per_course) : undefined,
        currency: 'THB',
        address: formData.address || undefined, phone: formData.phone || undefined, email: formData.email || undefined,
        cover_image: formData.cover_image || undefined,
        is_online: formData.is_online, is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await updateProvider(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createProvider(data);
        if (error) throw error;
        toast.success(isRussian ? 'Добавлено' : 'Added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteProvider(id);
      if (error) throw error;
      toast.success(isRussian ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
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
        ) : providers.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">{isRussian ? 'Нет услуг' : 'No services'}</h3>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {providers.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.name_en} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {providerTypes.find(t => t.value === item.provider_type)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            {item.is_online && <Badge variant="outline" className="text-xs">Online</Badge>}
                          </div>
                          {item.subjects && item.subjects.length > 0 && (
                            <p className="text-sm text-muted-foreground">{item.subjects.slice(0, 3).join(', ')}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1">
                            {item.price_per_hour && <span className="font-bold text-primary">฿{item.price_per_hour}/hr</span>}
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
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="education" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Предметы (через запятую)' : 'Subjects (comma separated)'}</Label><Input value={formData.subjects} onChange={(e) => setFormData(prev => ({ ...prev, subjects: e.target.value }))} placeholder="English, Math, Thai" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/час' : 'Price/hour'}</Label><Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/курс' : 'Price/course'}</Label><Input type="number" value={formData.price_per_course} onChange={(e) => setFormData(prev => ({ ...prev, price_per_course: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between"><Label>{isRussian ? 'Онлайн' : 'Online'}</Label><Switch checked={formData.is_online} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_online: v }))} /></div>
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

export default VendorEducation;
