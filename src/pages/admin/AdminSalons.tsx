import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminSalons } from '@/hooks/useAdminContent';

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
import { Scissors, Plus, MoreVertical, Edit, Trash2, Loader2, Star, MapPin } from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const salonTypes = [
  { value: 'hair', label: 'Hair Salon', labelRu: 'Парикмахерская' },
  { value: 'nail', label: 'Nail Salon', labelRu: 'Ногтевой сервис' },
  { value: 'spa', label: 'Spa', labelRu: 'Спа' },
  { value: 'beauty', label: 'Beauty Salon', labelRu: 'Салон красоты' },
  { value: 'massage', label: 'Massage', labelRu: 'Массаж' },
  { value: 'barbershop', label: 'Barbershop', labelRu: 'Барбершоп' },
];

export default function AdminSalons() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { salons, isLoading, createSalon, updateSalon, deleteSalon } = useAdminSalons(filterProviderId || undefined);
  
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
    salon_type: 'beauty',
    cover_image: '',
    images: [] as string[],
    address: '',
    district: '',
    phone: '',
    email: '',
    price_from: '',
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) navigate('/');
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '', name_en: '', name_ru: '', description_en: '', description_ru: '',
      salon_type: 'beauty', cover_image: '', images: [], address: '', district: '',
      phone: '', email: '', price_from: '', is_featured: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '', name_en: item.name_en || '', name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      salon_type: item.salon_type || 'beauty', cover_image: item.cover_image || '',
      images: item.images || [], address: item.address || '', district: item.district || '',
      phone: item.phone || '', email: item.email || '', price_from: item.price_from?.toString() || '',
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
      const data: any = { ...formData, name_ru: formData.name_ru || formData.name_en, price_from: formData.price_from ? parseFloat(formData.price_from) : null };
      if (editingItem) {
        const { error } = await updateSalon(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Салон обновлён' : 'Salon updated');
      } else {
        const { error } = await createSalon(data);
        if (error) throw error;
        toast.success(isRussian ? 'Салон добавлен' : 'Salon added');
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
      const { error } = await deleteSalon(id);
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
        <PageHeader title={isRussian ? 'Управление салонами' : 'Salon Management'} showBack />
        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить салон' : 'Add Salon'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : salons.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Scissors className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p>{isRussian ? 'Нет салонов' : 'No salons'}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {salons.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? <img src={item.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover" /> : <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Scissors className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{salonTypes.find(t => t.value === item.salon_type)?.[isRussian ? 'labelRu' : 'label']}</Badge>
                            {item.district && <span><MapPin className="h-3 w-3 inline" /> {item.district}</span>}
                          </div>
                          {item.rating && <div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-primary text-primary" /><span className="text-sm">{item.rating}</span></div>}
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
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Новый салон' : 'New Salon')}</DialogTitle>
              <DialogDescription>{isRussian ? 'Заполните данные салона' : 'Fill in salon details'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ProviderSelector value={formData.provider_id} onChange={(v) => setFormData({...formData, provider_id: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData({...formData, name_ru: e.target.value})} /></div>
                </div>
                <div><Label>Type</Label>
                  <Select value={formData.salon_type} onValueChange={(v) => setFormData({...formData, salon_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{salonTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRussian ? t.labelRu : t.label}</SelectItem>)}</SelectContent>
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
                  <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
                  <div><Label>Email</Label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
                  <div><Label>Price From</Label><Input type="number" value={formData.price_from} onChange={(e) => setFormData({...formData, price_from: e.target.value})} /></div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({...formData, is_featured: v})} /><Label>Featured</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({...formData, is_active: v})} /><Label>Active</Label></div>
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
