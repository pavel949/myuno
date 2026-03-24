import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorEvents, VendorEvent } from '@/hooks/useVendorEvents';
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
import { Calendar, Plus, MoreVertical, Edit, Trash2, Clock, Users, MapPin, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';
import { format } from 'date-fns';

const eventCategories = [
  { value: 'party', label: 'Party', labelRu: 'Вечеринка' },
  { value: 'concert', label: 'Concert', labelRu: 'Концерт' },
  { value: 'festival', label: 'Festival', labelRu: 'Фестиваль' },
  { value: 'workshop', label: 'Workshop', labelRu: 'Мастер-класс' },
  { value: 'sports', label: 'Sports', labelRu: 'Спорт' },
  { value: 'cultural', label: 'Cultural', labelRu: 'Культурное' },
];

const VendorEvents = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useVendorEvents(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title_en: '',
    title_ru: '',
    description_en: '',
    description_ru: '',
    category: 'party',
    event_date: '',
    event_time: '',
    duration_hours: '3',
    price: '',
    max_spots: '50',
    location_name: '',
    address: '',
    cover_image: '',
    is_active: true,
    is_hot: false,
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
      title_en: '', title_ru: '', description_en: '', description_ru: '',
      category: 'party', event_date: '', event_time: '', duration_hours: '3',
      price: '', max_spots: '50', location_name: '', address: '', cover_image: '',
      is_active: true, is_hot: false,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: VendorEvent) => {
    setEditingItem(item);
    setFormData({
      title_en: item.title_en,
      title_ru: item.title_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      category: item.category || 'party',
      event_date: item.event_date || '',
      event_time: item.event_time || '',
      duration_hours: (item.duration_hours || 3).toString(),
      price: (item.price || '').toString(),
      max_spots: (item.max_spots || 50).toString(),
      location_name: item.location_name || '',
      address: item.address || '',
      cover_image: item.cover_image || '',
      is_active: item.is_active ?? true,
      is_hot: item.is_hot || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title_en) {
      toast.error(isRussian ? 'Заполните название' : 'Please fill the title');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        title_en: formData.title_en,
        title_ru: formData.title_ru || formData.title_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        category: formData.category,
        event_date: formData.event_date || null,
        event_time: formData.event_time || null,
        duration_hours: parseInt(formData.duration_hours) || 3,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: 'THB',
        max_spots: parseInt(formData.max_spots) || 50,
        spots_left: editingItem ? undefined : parseInt(formData.max_spots) || 50,
        location_name: formData.location_name || null,
        address: formData.address || null,
        cover_image: formData.cover_image || null,
        is_active: formData.is_active,
        is_hot: formData.is_hot,
      };

      if (editingItem) {
        const { error } = await updateEvent(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Мероприятие обновлено' : 'Event updated');
      } else {
        const { error } = await createEvent(data);
        if (error) throw error;
        toast.success(isRussian ? 'Мероприятие добавлено' : 'Event added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteEvent(id);
      if (error) throw error;
      toast.success(isRussian ? 'Мероприятие удалено' : 'Event deleted');
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
          {isRussian ? 'Добавить мероприятие' : 'Add Event'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">{isRussian ? 'Нет мероприятий' : 'No events'}</h3>
              <p className="text-sm text-muted-foreground">{isRussian ? 'Добавьте своё мероприятие' : 'Add your event'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((item) => (
              <Card key={item.id} className={!item.is_featured ? '' : 'border-primary/50'}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title_en} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{isRussian ? item.title_ru : item.title_en}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {eventCategories.find(c => c.value === item.category)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            <ApprovalStatusBadge 
                              status={(item as any).approval_status} 
                              rejectionReason={(item as any).rejection_reason}
                            />
                            {item.is_hot && <Badge className="text-xs bg-destructive">🔥 Hot</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {item.event_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.event_date}</span>}
                            {item.duration_hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.duration_hours}h</span>}
                            {item.max_spots && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.spots_left || item.max_spots}/{item.max_spots}</span>}
                          </div>
                          {item.price && <p className="text-sm font-bold text-primary mt-1">฿{item.price.toLocaleString()}</p>}
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
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit Event') : (isRussian ? 'Новое мероприятие' : 'New Event')}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ImageUpload value={formData.cover_image} onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))} folder="events" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (EN) *' : 'Title (EN) *'}</Label>
                    <Input value={formData.title_en} onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (RU)' : 'Title (RU)'}</Label>
                    <Input value={formData.title_ru} onChange={(e) => setFormData(prev => ({ ...prev, title_ru: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Дата' : 'Date'}</Label>
                    <Input type="date" value={formData.event_date} onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Время' : 'Time'}</Label>
                    <Input type="time" value={formData.event_time} onChange={(e) => setFormData(prev => ({ ...prev, event_time: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Цена (THB)' : 'Price (THB)'}</Label>
                    <Input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Макс. мест' : 'Max Spots'}</Label>
                    <Input type="number" value={formData.max_spots} onChange={(e) => setFormData(prev => ({ ...prev, max_spots: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Место проведения' : 'Venue'}</Label>
                  <Input value={formData.location_name} onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))} />
                </div>
                {/* is_hot removed - admin only */}
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

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{isRussian ? 'Подтвердите удаление' : 'Confirm Deletion'}</DialogTitle></DialogHeader>
            <p>{isRussian ? 'Вы уверены?' : 'Are you sure?'}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{isRussian ? 'Отмена' : 'Cancel'}</Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>{isRussian ? 'Удалить' : 'Delete'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorEvents;
