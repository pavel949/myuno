import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminVehicles } from '@/hooks/useAdminContent';

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
import { Car, Plus, MoreVertical, Edit, Trash2, Loader2, Users } from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const vehicleTypes = [
  { value: 'car', label: 'Car', labelRu: 'Автомобиль' },
  { value: 'suv', label: 'SUV', labelRu: 'Внедорожник' },
  { value: 'motorcycle', label: 'Motorcycle', labelRu: 'Мотоцикл' },
  { value: 'scooter', label: 'Scooter', labelRu: 'Скутер' },
  { value: 'van', label: 'Van', labelRu: 'Минивэн' },
  { value: 'luxury', label: 'Luxury', labelRu: 'Люкс' },
];

export default function AdminVehicles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { vehicles, isLoading, createVehicle, updateVehicle, deleteVehicle } = useAdminVehicles(filterProviderId || undefined);
  
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
    vehicle_type: 'car',
    cover_image: '',
    images: [] as string[],
    brand: '',
    model: '',
    year: '',
    seats: '4',
    transmission: 'automatic',
    fuel_type: 'petrol',
    price_per_day: '',
    price_per_week: '',
    deposit: '',
    features: '',
    is_available: true,
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);
  React.useEffect(() => { if (!adminLoading && !isAdmin && user) navigate('/'); }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '', name_en: '', name_ru: '', description_en: '', description_ru: '',
      vehicle_type: 'car', cover_image: '', images: [], brand: '', model: '', year: '',
      seats: '4', transmission: 'automatic', fuel_type: 'petrol', price_per_day: '',
      price_per_week: '', deposit: '', features: '', is_available: true, is_featured: false, is_active: true,
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id || '', name_en: item.name_en || '', name_ru: item.name_ru || '',
      description_en: item.description_en || '', description_ru: item.description_ru || '',
      vehicle_type: item.vehicle_type || 'car', cover_image: item.cover_image || '',
      images: item.images || [], brand: item.brand || '', model: item.model || '',
      year: item.year?.toString() || '', seats: item.seats?.toString() || '4',
      transmission: item.transmission || 'automatic', fuel_type: item.fuel_type || 'petrol',
      price_per_day: item.price_per_day?.toString() || '', price_per_week: item.price_per_week?.toString() || '',
      deposit: item.deposit?.toString() || '', features: item.features?.join(', ') || '',
      is_available: item.is_available ?? true, is_featured: item.is_featured ?? false, is_active: item.is_active ?? true,
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
        ...formData,
        name_ru: formData.name_ru || formData.name_en,
        year: formData.year ? parseInt(formData.year) : null,
        seats: formData.seats ? parseInt(formData.seats) : 4,
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : null,
        price_per_week: formData.price_per_week ? parseFloat(formData.price_per_week) : null,
        deposit: formData.deposit ? parseFloat(formData.deposit) : null,
        features: formData.features ? formData.features.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editingItem) {
        const { error } = await updateVehicle(editingItem.id, data);
        if (error) throw error;
        toast.success(isRussian ? 'Транспорт обновлён' : 'Vehicle updated');
      } else {
        const { error } = await createVehicle(data);
        if (error) throw error;
        toast.success(isRussian ? 'Транспорт добавлен' : 'Vehicle added');
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
      const { error } = await deleteVehicle(id);
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
        <PageHeader title={isRussian ? 'Управление транспортом' : 'Vehicle Management'} showBack />
        <Button className="w-full mb-4" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />{isRussian ? 'Добавить транспорт' : 'Add Vehicle'}
        </Button>

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
        ) : vehicles.length === 0 ? (
          <Card><CardContent className="p-8 text-center"><Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" /><p>{isRussian ? 'Нет транспорта' : 'No vehicles'}</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {vehicles.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {item.cover_image ? <img src={item.cover_image} alt="" className="w-20 h-20 rounded-lg object-cover" /> : <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"><Car className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{isRussian ? item.name_ru : item.name_en}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="secondary">{vehicleTypes.find(t => t.value === item.vehicle_type)?.[isRussian ? 'labelRu' : 'label']}</Badge>
                            {item.seats && <span><Users className="h-3 w-3 inline" /> {item.seats}</span>}
                          </div>
                          {item.price_per_day && <p className="text-sm mt-1"><span className="text-muted-foreground">Day:</span> <span className="text-primary font-medium">฿{item.price_per_day.toLocaleString()}</span></p>}
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
              <DialogTitle>{editingItem ? (isRussian ? 'Редактировать' : 'Edit') : (isRussian ? 'Новый транспорт' : 'New Vehicle')}</DialogTitle>
              <DialogDescription>{isRussian ? 'Заполните данные' : 'Fill in details'}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
                <ProviderSelector value={formData.provider_id} onChange={(v) => setFormData({...formData, provider_id: v})} />
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Name (EN) *</Label><Input value={formData.name_en} onChange={(e) => setFormData({...formData, name_en: e.target.value})} /></div>
                  <div><Label>Название (RU)</Label><Input value={formData.name_ru} onChange={(e) => setFormData({...formData, name_ru: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Type</Label>
                    <Select value={formData.vehicle_type} onValueChange={(v) => setFormData({...formData, vehicle_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{vehicleTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRussian ? t.labelRu : t.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Brand</Label><Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} /></div>
                  <div><Label>Model</Label><Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div><Label>Year</Label><Input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} /></div>
                  <div><Label>Seats</Label><Input type="number" value={formData.seats} onChange={(e) => setFormData({...formData, seats: e.target.value})} /></div>
                  <div><Label>Transmission</Label>
                    <Select value={formData.transmission} onValueChange={(v) => setFormData({...formData, transmission: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Fuel</Label>
                    <Select value={formData.fuel_type} onValueChange={(v) => setFormData({...formData, fuel_type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Cover Image</Label><ImageUpload value={formData.cover_image} onChange={(v) => setFormData({...formData, cover_image: v})} /></div>
                <div><Label>Gallery</Label><MultiImageUpload value={formData.images} onChange={(v) => setFormData({...formData, images: v})} /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Price/Day ฿</Label><Input type="number" value={formData.price_per_day} onChange={(e) => setFormData({...formData, price_per_day: e.target.value})} /></div>
                  <div><Label>Price/Week ฿</Label><Input type="number" value={formData.price_per_week} onChange={(e) => setFormData({...formData, price_per_week: e.target.value})} /></div>
                  <div><Label>Deposit ฿</Label><Input type="number" value={formData.deposit} onChange={(e) => setFormData({...formData, deposit: e.target.value})} /></div>
                </div>
                <div><Label>Features (comma-sep)</Label><Input value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} /></div>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2"><Switch checked={formData.is_available} onCheckedChange={(v) => setFormData({...formData, is_available: v})} /><Label>Available</Label></div>
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
