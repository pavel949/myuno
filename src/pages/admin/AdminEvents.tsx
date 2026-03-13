import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminEvents } from '@/hooks/useAdminContent';

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
import { Calendar, Plus, MoreVertical, Edit, Trash2, Loader2, MapPin, Users } from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const eventCategories = [
  { value: 'party', label: 'Party', labelRu: 'Вечеринка' },
  { value: 'concert', label: 'Concert', labelRu: 'Концерт' },
  { value: 'festival', label: 'Festival', labelRu: 'Фестиваль' },
  { value: 'sports', label: 'Sports', labelRu: 'Спорт' },
  { value: 'cultural', label: 'Cultural', labelRu: 'Культурное' },
  { value: 'networking', label: 'Networking', labelRu: 'Нетворкинг' },
  { value: 'workshop', label: 'Workshop', labelRu: 'Мастер-класс' },
];

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useAdminEvents(filterProviderId || undefined);
  
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get('action') === 'new');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider_id: '',
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    category: 'party',
    cover_image: '',
    images: [] as string[],
    event_date: '',
    event_time: '',
    location_name: '',
    location_ru: '',
    address: '',
    price: '',
    max_spots: '',
    duration_hours: '',
    is_hot: false,
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  React.useEffect(() => { if (!adminLoading && !isAdmin && user) navigate('/'); }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '', title_en: '', title_ru: '', description_en: '', description_ru: '',
      category: 'party', cover_image: '', images: [], event_date: '', event_time: '',
      location_name: '', location_ru: '', address: '', price: '', max_spots: '', duration_hours: '',
      is_hot: false, is_featured: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '', title_en: item.title_en || '', title_ru: item.title_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      category: item.category || 'party', cover_image: item.cover_image || '', images: item.images || [],
      event_date: item.event_date || '', event_time: item.event_time || '',
      location_name: item.location_name || '', location_ru: item.location_ru || '',
      address: item.address || '', price: item.price?.toString() || '',
      max_spots: item.max_spots?.toString() || '', duration_hours: item.duration_hours?.toString() || '',
      is_hot: item.is_hot ?? false, is_featured: item.is_featured ?? false, is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: any = {
        ...formData,
        title_ru: formData.title_ru || formData.title_en,
        price: formData.price ? parseFloat(formData.price) : null,
        max_spots: formData.max_spots ? parseInt(formData.max_spots) : null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
      };
      if (editingItem) {
        const { error } = await updateEvent(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Событие обновлено' : 'Event updated');
      } else {
        const { error } = await createEvent(data);
        if (error) throw error;
        toast.success(isRussian ? 'Событие добавлено' : 'Event added');
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
      const { error } = await deleteEvent(id);
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
        <PageHeader title={isRussian ? 'Управление событиями' : 'Event Management'} showBack />
        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить событие' : 'Add Event'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : events.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p>{isRussian ? 'Нет событий' : 'No events'}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {events.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? <img src={item.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover" /> : <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Calendar className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{isRussian ? item.title_ru : item.title_en}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <Badge variant="secondary">{eventCategories.find(t => t.value === item.category)?.[isRussian ? 'labelRu' : 'label']}</Badge>
                            {item.is_hot && <Badge className="bg-destructive">HOT</Badge>}
                            {item.event_date && <span>{item.event_date}</span>}
                          </div>
                          {item.price && <p className="text-sm mt-1 text-primary font-medium">฿{item.price.toLocaleString()}</p>}
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
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Новое событие' : 'New Event')}</DialogTitle>
              <DialogDescription>{isRussian ? 'Заполните данные' : 'Fill in details'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ProviderSelector value={formData.provider_id} onChange={(v) => setFormData({...formData, provider_id: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Title (EN) *</Label><Input value={formData.title_en} onChange={(e) => setFormData({...formData, title_en: e.target.value})} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.title_ru} onChange={(e) => setFormData({...formData, title_ru: e.target.value})} /></div>
                </div>
                <div><Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{eventCategories.map(t => <SelectItem key={t.value} value={t.value}>{isRussian ? t.labelRu : t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Description (EN)</Label><Textarea value={formData.description_en} onChange={(e) => setFormData({...formData, description_en: e.target.value})} /></div>
                  <div><Label>Описание (RU)</Label><Textarea value={formData.description_ru} onChange={(e) => setFormData({...formData, description_ru: e.target.value})} /></div>
                </div>
                <div><Label>Cover Image</Label><ImageUpload value={formData.cover_image} onChange={(v) => setFormData({...formData, cover_image: v})} /></div>
                <div><Label>Gallery</Label><MultiImageUpload value={formData.images} onChange={(v) => setFormData({...formData, images: v})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Date</Label><Input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} /></div>
                  <div><Label>Time</Label><Input type="time" value={formData.event_time} onChange={(e) => setFormData({...formData, event_time: e.target.value})} /></div>
                  <div><Label>Duration (hours)</Label><Input type="number" value={formData.duration_hours} onChange={(e) => setFormData({...formData, duration_hours: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Location (EN)</Label><Input value={formData.location_name} onChange={(e) => setFormData({...formData, location_name: e.target.value})} /></div>
                  <div><Label>Локация (RU)</Label><Input value={formData.location_ru} onChange={(e) => setFormData({...formData, location_ru: e.target.value})} /></div>
                </div>
                <div><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Price ฿</Label><Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} /></div>
                  <div><Label>Max Spots</Label><Input type="number" value={formData.max_spots} onChange={(e) => setFormData({...formData, max_spots: e.target.value})} /></div>
                </div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.is_hot} onCheckedChange={(v) => setFormData({...formData, is_hot: v})} /><Label>Hot</Label></div>
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
