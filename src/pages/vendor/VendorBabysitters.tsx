import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';

interface VendorBabysitter {
  id: string;
  provider_id?: string;
  name_en: string;
  name_ru: string;
  bio_en?: string;
  bio_ru?: string;
  photo?: string;
  images?: string[];
  age_groups?: string[];
  languages?: string[];
  certifications?: string[];
  experience_years?: number;
  price_per_hour?: number;
  price_per_day?: number;
  currency?: string;
  availability?: Record<string, unknown>;
  can_cook?: boolean;
  can_drive?: boolean;
  first_aid_certified?: boolean;
  background_checked?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  rating?: number;
  review_count?: number;
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
import { Baby, Plus, MoreVertical, Edit, Trash2, Loader2, Star, ShieldCheck } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';

const VendorBabysitters = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items: babysitters, isLoading, create: createBabysitter, update: updateBabysitter, remove: deleteBabysitter } = useVerticalCRUD<VendorBabysitter>('babysitter', profile?.id, {
    select: 'id,provider_id,name_en,name_ru,bio_en,bio_ru,photo,images,age_groups,languages,certifications,experience_years,price_per_hour,price_per_day,currency,availability,can_cook,can_drive,first_aid_certified,background_checked,is_active,is_featured,is_verified,rating,review_count,created_at,updated_at',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorBabysitter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '', name_ru: '', bio_en: '', bio_ru: '',
    age_groups: '', languages: '', certifications: '',
    experience_years: '', price_per_hour: '', price_per_day: '',
    photo: '',
    can_cook: false, can_drive: false,
    first_aid_certified: false, background_checked: false,
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
      name_en: '', name_ru: '', bio_en: '', bio_ru: '',
      age_groups: '', languages: '', certifications: '',
      experience_years: '', price_per_hour: '', price_per_day: '',
      photo: '',
      can_cook: false, can_drive: false,
      first_aid_certified: false, background_checked: false,
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorBabysitter) => {
    setEditingItem(item);
    setFormData({
      name_en: item.name_en, name_ru: item.name_ru || '',
      bio_en: item.bio_en || '', bio_ru: item.bio_ru || '',
      age_groups: item.age_groups?.join(', ') || '',
      languages: item.languages?.join(', ') || '',
      certifications: item.certifications?.join(', ') || '',
      experience_years: (item.experience_years || '').toString(),
      price_per_hour: (item.price_per_hour || '').toString(),
      price_per_day: (item.price_per_day || '').toString(),
      photo: item.photo || '',
      can_cook: item.can_cook || false,
      can_drive: item.can_drive || false,
      first_aid_certified: item.first_aid_certified || false,
      background_checked: item.background_checked || false,
      is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en) {
      toast.error(isRussian ? 'Заполните имя' : 'Please fill the name');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        name_en: formData.name_en, name_ru: formData.name_ru || formData.name_en,
        bio_en: formData.bio_en || null,
        bio_ru: formData.bio_ru || null,
        age_groups: formData.age_groups ? formData.age_groups.split(',').map(s => s.trim()).filter(Boolean) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        currency: 'THB',
        photo: formData.photo || null,
        can_cook: formData.can_cook,
        can_drive: formData.can_drive,
        first_aid_certified: formData.first_aid_certified,
        background_checked: formData.background_checked,
        is_active: formData.is_active,
      };

      if (editingItem) {
        const { error } = await updateBabysitter(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Обновлено' : 'Updated');
      } else {
        const { error } = await createBabysitter(data);
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
      const { error } = await deleteBabysitter(id);
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
        ) : babysitters.length === 0 ? (
          <Card><CardContent className="p-8 text-center">
            <Baby className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">{isRussian ? 'Нет нянь' : 'No babysitters'}</h3>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {babysitters.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name_en} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                        <Baby className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                            {item.background_checked && (
                              <Badge variant="outline" className="text-xs text-success"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
                            )}
                            {item.first_aid_certified && (
                              <Badge variant="secondary" className="text-xs">First Aid</Badge>
                            )}
                          </div>
                          {item.languages && item.languages.length > 0 && (
                            <p className="text-sm text-muted-foreground">{item.languages.join(', ')}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm mt-1 flex-wrap">
                            {item.experience_years && <span className="text-muted-foreground">{item.experience_years} {isRussian ? 'лет опыта' : 'years exp.'}</span>}
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
                <ImageUpload value={formData.photo} onChange={(url) => setFormData(prev => ({ ...prev, photo: url }))} folder="babysitters" placeholder={isRussian ? 'Фото' : 'Photo'} />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Name (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>{isRussian ? 'Языки' : 'Languages'}</Label><Input value={formData.languages} onChange={(e) => setFormData(prev => ({ ...prev, languages: e.target.value }))} placeholder="English, Russian, Thai" /></div>
                <div className="space-y-2"><Label>{isRussian ? 'Возрастные группы' : 'Age Groups'}</Label><Input value={formData.age_groups} onChange={(e) => setFormData(prev => ({ ...prev, age_groups: e.target.value }))} placeholder="0-1, 1-3, 3-6" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>{isRussian ? 'Опыт (лет)' : 'Experience (years)'}</Label><Input type="number" value={formData.experience_years} onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/час' : 'Price/hour'}</Label><Input type="number" value={formData.price_per_hour} onChange={(e) => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>{isRussian ? 'Цена/день' : 'Price/day'}</Label><Input type="number" value={formData.price_per_day} onChange={(e) => setFormData(prev => ({ ...prev, price_per_day: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between"><Label>{isRussian ? 'Готовит' : 'Can Cook'}</Label><Switch checked={formData.can_cook} onCheckedChange={(v) => setFormData(prev => ({ ...prev, can_cook: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>{isRussian ? 'Водит' : 'Can Drive'}</Label><Switch checked={formData.can_drive} onCheckedChange={(v) => setFormData(prev => ({ ...prev, can_drive: v }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between"><Label>{isRussian ? 'Первая помощь' : 'First Aid'}</Label><Switch checked={formData.first_aid_certified} onCheckedChange={(v) => setFormData(prev => ({ ...prev, first_aid_certified: v }))} /></div>
                  <div className="flex items-center justify-between"><Label>{isRussian ? 'Проверена' : 'Background Check'}</Label><Switch checked={formData.background_checked} onCheckedChange={(v) => setFormData(prev => ({ ...prev, background_checked: v }))} /></div>
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

export default VendorBabysitters;
