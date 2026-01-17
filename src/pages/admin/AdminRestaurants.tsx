import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminRestaurants } from '@/hooks/useAdminContent';
import { useAdminFormHotkeys, useFormProgress } from '@/hooks/useAdminFormHotkeys';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { AdminFormToolbar } from '@/components/admin/AdminFormToolbar';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Loader2,
  Star,
  MapPin,
  Copy
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const cuisineTypes = [
  { value: 'thai', label: 'Thai', labelRu: 'Тайская' },
  { value: 'european', label: 'European', labelRu: 'Европейская' },
  { value: 'asian', label: 'Asian', labelRu: 'Азиатская' },
  { value: 'seafood', label: 'Seafood', labelRu: 'Морепродукты' },
  { value: 'italian', label: 'Italian', labelRu: 'Итальянская' },
  { value: 'japanese', label: 'Japanese', labelRu: 'Японская' },
  { value: 'indian', label: 'Indian', labelRu: 'Индийская' },
  { value: 'international', label: 'International', labelRu: 'Интернациональная' },
];

export default function AdminRestaurants() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { restaurants, isLoading, createRestaurant, updateRestaurant, deleteRestaurant } = useAdminRestaurants(filterProviderId || undefined);
  
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
    cuisine_type: 'international',
    cover_image: '',
    images: [] as string[],
    address: '',
    district: '',
    phone: '',
    email: '',
    website: '',
    price_range: '$$',
    has_delivery: false,
    has_takeaway: false,
    has_reservation: true,
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
      provider_id: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      cuisine_type: 'international',
      cover_image: '',
      images: [],
      address: '',
      district: '',
      phone: '',
      email: '',
      website: '',
      price_range: '$$',
      has_delivery: false,
      has_takeaway: false,
      has_reservation: true,
      is_featured: false,
      is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '',
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      cuisine_type: item.cuisine_type || 'international',
      cover_image: item.cover_image || '',
      images: item.images || [],
      address: item.address || '',
      district: item.district || '',
      phone: item.phone || '',
      email: item.email || '',
      website: item.website || '',
      price_range: item.price_range || '$$',
      has_delivery: item.has_delivery ?? false,
      has_takeaway: item.has_takeaway ?? false,
      has_reservation: item.has_reservation ?? true,
      is_featured: item.is_featured ?? false,
      is_active: item.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  // Duplicate functionality
  const handleDuplicate = useCallback(() => {
    if (!editingItem) return;
    
    setEditingItem(null);
    setFormData(prev => ({
      ...prev,
      name_en: `${prev.name_en} (copy)`,
      name_ru: prev.name_ru ? `${prev.name_ru} (копия)` : '',
    }));
    toast.info(isRussian ? 'Создание копии...' : 'Creating a copy...');
  }, [editingItem, isRussian]);

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        ...formData,
        name_ru: formData.name_ru || formData.name_en,
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
      console.error('Error:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteRestaurant(id);
      if (error) throw error;
      toast.success(isRussian ? 'Удалено' : 'Deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  // Auto-translate hook
  const { translateMultiple, isTranslating } = useAutoTranslate();

  const handleAutoTranslate = async () => {
    const fieldsToTranslate: Record<string, string> = {};
    
    if (formData.name_en && !formData.name_ru) {
      fieldsToTranslate.name = formData.name_en;
    }
    if (formData.description_en && !formData.description_ru) {
      fieldsToTranslate.description = formData.description_en;
    }
    
    if (Object.keys(fieldsToTranslate).length === 0) {
      toast.info(isRussian ? 'Нечего переводить' : 'Nothing to translate');
      return;
    }

    const translations = await translateMultiple(fieldsToTranslate, 'ru');
    
    setFormData(prev => ({
      ...prev,
      name_ru: translations.name || prev.name_ru,
      description_ru: translations.description || prev.description_ru,
    }));
    
    if (Object.keys(translations).length > 0) {
      toast.success(isRussian ? 'Переведено!' : 'Translated!');
    }
  };

  // Form progress tracking
  const { progress, filled, total } = useFormProgress(formData, 
    ['provider_id', 'name_en'],
    ['name_ru', 'description_en', 'description_ru', 'cover_image', 'address', 'phone']
  );

  // Hotkeys
  useAdminFormHotkeys({
    onSave: handleSubmit,
    onClose: () => setIsDialogOpen(false),
    isDialogOpen,
    isSubmitting,
  });

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Управление ресторанами' : 'Restaurant Management'}
          showBack
        />

        <Button 
          className="w-full mb-4" 
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
        >
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
              <p className="text-muted-foreground">{isRussian ? 'Нет ресторанов' : 'No restaurants'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {restaurants.map((item) => (
              <Card key={item.id}>
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
                          <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{item.cuisine_type}</Badge>
                            {item.district && <span><MapPin className="h-3 w-3 inline" /> {item.district}</span>}
                          </div>
                          {item.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              <span className="text-sm">{item.rating}</span>
                            </div>
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
                            <DropdownMenuItem onClick={() => {
                              openEditDialog(item);
                              setTimeout(() => handleDuplicate(), 100);
                            }}>
                              <Copy className="h-4 w-4 mr-2" />{isRussian ? 'Дублировать' : 'Duplicate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => setDeleteConfirmId(item.id)}>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Новый ресторан' : 'New Restaurant')}</DialogTitle>
              <DialogDescription>{isRussian ? 'Заполните данные ресторана' : 'Fill in restaurant details'}</DialogDescription>
            </DialogHeader>
            <div className="px-6 pt-4">
              <AdminFormToolbar
                progress={progress}
                filled={filled}
                total={total}
                onTranslate={handleAutoTranslate}
                onDuplicate={handleDuplicate}
                isTranslating={isTranslating}
                isEditing={!!editingItem}
              />
            </div>
            <ScrollArea className="max-h-[calc(90vh-220px)] px-6">
              <div className="space-y-4 pb-4">
                <ProviderSelector value={formData.provider_id} onChange={(v) => setFormData({...formData, provider_id: v})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData({...formData, name_ru: e.target.value})} /></div>
                </div>

                <div><Label>Cuisine</Label>
                  <Select value={formData.cuisine_type} onValueChange={(v) => setFormData({...formData, cuisine_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRussian ? t.labelRu : t.label}</SelectItem>)}
                    </SelectContent>
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
                  <div><Label>Price Range</Label>
                    <Select value={formData.price_range} onValueChange={(v) => setFormData({...formData, price_range: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">$</SelectItem>
                        <SelectItem value="$$">$$</SelectItem>
                        <SelectItem value="$$$">$$$</SelectItem>
                        <SelectItem value="$$$$">$$$$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.has_delivery} onCheckedChange={(v) => setFormData({...formData, has_delivery: v})} /><Label>Delivery</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.has_takeaway} onCheckedChange={(v) => setFormData({...formData, has_takeaway: v})} /><Label>Takeaway</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.has_reservation} onCheckedChange={(v) => setFormData({...formData, has_reservation: v})} /><Label>Reservation</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(v) => setFormData({...formData, is_featured: v})} /><Label>Featured</Label></div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-6 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить?' : 'Delete?'}</DialogTitle>
              <DialogDescription>{isRussian ? 'Это действие нельзя отменить' : 'This action cannot be undone'}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
