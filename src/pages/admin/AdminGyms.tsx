import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminGyms } from '@/hooks/useAdminContent';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Dumbbell, Plus, MoreVertical, Edit, Trash2, Loader2, MapPin } from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const gymTypes = [
  { value: 'gym', label: 'Gym', labelRu: 'Спортзал' },
  { value: 'fitness', label: 'Fitness Center', labelRu: 'Фитнес-центр' },
  { value: 'crossfit', label: 'CrossFit', labelRu: 'КроссФит' },
  { value: 'yoga', label: 'Yoga Studio', labelRu: 'Йога-студия' },
  { value: 'martial_arts', label: 'Martial Arts', labelRu: 'Единоборства' },
  { value: 'pool', label: 'Swimming Pool', labelRu: 'Бассейн' },
];

export default function AdminGyms() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { gyms, isLoading, createGym, updateGym, deleteGym } = useAdminGyms(filterProviderId || undefined);
  
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('action') === 'new');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    gym_type: 'gym',
    cover_image: '',
    images: [] as string[],
    address: '',
    district: '',
    phone: '',
    email: '',
    price_day_pass: '',
    price_week_pass: '',
    price_month_pass: '',
    amenities: '',
    classes: '',
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => { if (!authLoading && !user) navigate(APP_ROUTES.AUTH); }, [user, authLoading, navigate]);
  React.useEffect(() => { if (!adminLoading && !isAdmin && user) navigate(APP_ROUTES.HOME); }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '', name_en: '', name_ru: '', description_en: '', description_ru: '',
      gym_type: 'gym', cover_image: '', images: [], address: '', district: '',
      phone: '', email: '', price_day_pass: '', price_week_pass: '', price_month_pass: '',
      amenities: '', classes: '', is_featured: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '', name_en: item.name_en || '', name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      gym_type: item.gym_type || 'gym', cover_image: item.cover_image || '',
      images: item.images || [], address: item.address || '', district: item.district || '',
      phone: item.phone || '', email: item.email || '',
      price_day_pass: item.price_day_pass?.toString() || '',
      price_week_pass: item.price_week_pass?.toString() || '',
      price_month_pass: item.price_month_pass?.toString() || '',
      amenities: item.amenities?.join(', ') || '', classes: item.classes?.join(', ') || '',
      is_featured: item.is_featured ?? false, is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: any = {
        provider_id: formData.provider_id,
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        gym_type: formData.gym_type || null,
        address: formData.address || null,
        district: formData.district || null,
        phone: formData.phone || null,
        email: formData.email || null,
        cover_image: formData.cover_image || null,
        images: formData.images || [],
        price_day_pass: formData.price_day_pass ? parseFloat(formData.price_day_pass) : null,
        price_week_pass: formData.price_week_pass ? parseFloat(formData.price_week_pass) : null,
        price_month_pass: formData.price_month_pass ? parseFloat(formData.price_month_pass) : null,
        amenities: formData.amenities ? formData.amenities.split(',').map(s => s.trim()).filter(Boolean) : [],
        classes: formData.classes ? formData.classes.split(',').map(s => s.trim()).filter(Boolean) : [],
        is_featured: formData.is_featured,
        currency: 'THB',
      };
      if (editingItem) {
        const { error } = await updateGym(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Зал обновлён' : 'Gym updated');
      } else {
        const { error } = await createGym(data);
        if (error) throw error;
        toast.success(isRussian ? 'Зал добавлен' : 'Gym added');
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
      const { error } = await deleteGym(id);
      if (error) throw error;
      toast.success(isRussian ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch { toast.error(isRussian ? 'Ошибка' : 'Error'); }
  };

  if (authLoading || adminLoading) return <><PageContainer><Skeleton className="h-48" /></PageContainer></>;
  if (!isAdmin) return null;

  return (
    <>
      <PageContainer>
        <PageHeader title={isRussian ? 'Управление залами' : 'Gym Management'} showBack />
        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить зал' : 'Add Gym'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : gyms.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p>{isRussian ? 'Нет залов' : 'No gyms'}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {gyms.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? <img src={item.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover" /> : <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Dumbbell className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{gymTypes.find(t => t.value === item.gym_type)?.[isRussian ? 'labelRu' : 'label']}</Badge>
                            {item.district && <span><MapPin className="h-3 w-3 inline" /> {item.district}</span>}
                          </div>
                          {item.price_day_pass && <p className="text-sm mt-1"><span className="text-muted-foreground">Day:</span> <span className="text-primary font-medium">฿{item.price_day_pass.toLocaleString()}</span></p>}
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
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Новый зал' : 'New Gym')}</DialogTitle>
              <DialogDescription>{isRussian ? 'Заполните данные' : 'Fill in details'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ProviderSelector value={formData.provider_id} onChange={(v) => setFormData({...formData, provider_id: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData({...formData, name_ru: e.target.value})} /></div>
                </div>
                <div><Label>Type</Label>
                  <Select value={formData.gym_type} onValueChange={(v) => setFormData({...formData, gym_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{gymTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRussian ? t.labelRu : t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} /></div>
                  <div><Label>Описание (RU)</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData({...formData, description_ru: e.target.value})} /></div>
                </div>
                <div><Label>Cover Image</Label><ImageUpload value={formData.cover_image} onChange={(v) => setFormData({...formData, cover_image: v})} /></div>
                <div><Label>Gallery</Label><MultiImageUpload value={formData.images} onChange={(v) => setFormData({...formData, images: v})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
                  <div><Label>District</Label><Input value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Day Pass ฿</Label><Input type="number" value={formData.price_day_pass} onChange={(e) => setFormData({...formData, price_day_pass: e.target.value})} /></div>
                  <div><Label>Week Pass ฿</Label><Input type="number" value={formData.price_week_pass} onChange={(e) => setFormData({...formData, price_week_pass: e.target.value})} /></div>
                  <div><Label>Month Pass ฿</Label><Input type="number" value={formData.price_month_pass} onChange={(e) => setFormData({...formData, price_month_pass: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Amenities (comma-sep)</Label><Input value={formData.amenities} onChange={(e) => setFormData({...formData, amenities: e.target.value})} /></div>
                  <div><Label>Classes (comma-sep)</Label><Input value={formData.classes} onChange={(e) => setFormData({...formData, classes: e.target.value})} /></div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({...formData, is_featured: v})} /><Label>Featured</Label></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-6 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editingItem ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{isRussian ? 'Удалить?' : 'Delete?'}</DialogTitle><DialogDescription>{isRussian ? 'Действие нельзя отменить' : 'Cannot undo'}</DialogDescription></DialogHeader>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Cancel</Button><Button variant="destructive" className="flex-1" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button></div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
