import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorSalons, VendorSalon } from '@/hooks/useVendorSalons';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Scissors, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Phone,
  Star,
  Clock
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';

const salonTypes = [
  { value: 'beauty_salon', label: 'Beauty Salon', labelRu: 'Салон красоты' },
  { value: 'spa', label: 'Spa', labelRu: 'Спа' },
  { value: 'barbershop', label: 'Barbershop', labelRu: 'Барбершоп' },
  { value: 'nail_studio', label: 'Nail Studio', labelRu: 'Ногтевая студия' },
  { value: 'hair_salon', label: 'Hair Salon', labelRu: 'Парикмахерская' },
  { value: 'massage', label: 'Massage', labelRu: 'Массажный салон' },
];

const amenitiesList = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'parking', label: 'Parking' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'card_payment', label: 'Card Payment' },
  { value: 'drinks', label: 'Complimentary Drinks' },
  { value: 'wheelchair', label: 'Wheelchair Access' },
];

const servicesList = [
  { value: 'haircut', label: 'Haircut', labelRu: 'Стрижка' },
  { value: 'coloring', label: 'Hair Coloring', labelRu: 'Окрашивание' },
  { value: 'manicure', label: 'Manicure', labelRu: 'Маникюр' },
  { value: 'pedicure', label: 'Pedicure', labelRu: 'Педикюр' },
  { value: 'facial', label: 'Facial', labelRu: 'Уход за лицом' },
  { value: 'massage', label: 'Massage', labelRu: 'Массаж' },
  { value: 'waxing', label: 'Waxing', labelRu: 'Депиляция' },
  { value: 'makeup', label: 'Makeup', labelRu: 'Макияж' },
];

const VendorBeauty = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { salons, isLoading: salonsLoading, createSalon, updateSalon, deleteSalon } = useVendorSalons(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<VendorSalon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    salon_type: 'beauty_salon',
    cover_image: '',
    images: [] as string[],
    address: '',
    district: '',
    phone: '',
    email: '',
    website: '',
    services: [] as string[],
    amenities: [] as string[],
    price_from: '',
    is_featured: false,
    is_active: true,
  });

  const isRussian = language === 'ru';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      salon_type: 'beauty_salon',
      cover_image: '',
      images: [],
      address: '',
      district: '',
      phone: '',
      email: '',
      website: '',
      services: [],
      amenities: [],
      price_from: '',
      is_featured: false,
      is_active: true,
    });
    setEditingSalon(null);
  };

  const openEditDialog = (salon: VendorSalon) => {
    setEditingSalon(salon);
    setFormData({
      name_en: salon.name_en || '',
      name_ru: salon.name_ru || '',
      description_en: salon.description_en || '',
      description_ru: salon.description_ru || '',
      salon_type: salon.salon_type || 'beauty_salon',
      cover_image: salon.cover_image || '',
      images: salon.images || [],
      address: salon.address || '',
      district: salon.district || '',
      phone: salon.phone || '',
      email: salon.email || '',
      website: salon.website || '',
      services: salon.services || [],
      amenities: salon.amenities || [],
      price_from: salon.price_from?.toString() || '',
      is_featured: salon.is_featured || false,
      is_active: salon.is_active !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru) {
      toast.error(isRussian ? 'Заполните название на обоих языках' : 'Please fill in name in both languages');
      return;
    }

    setIsSubmitting(true);
    try {
      const salonData = {
        name_en: formData.name_en,
        name_ru: formData.name_ru,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        salon_type: formData.salon_type,
        cover_image: formData.cover_image || null,
        images: formData.images,
        address: formData.address || null,
        district: formData.district || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        services: formData.services,
        amenities: formData.amenities,
        price_from: formData.price_from ? parseFloat(formData.price_from) : null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        currency: 'THB',
      };

      if (editingSalon) {
        const { error } = await updateSalon(editingSalon.id, salonData);
        if (error) throw error;
        toast.success(isRussian ? 'Салон обновлён' : 'Salon updated');
      } else {
        const { error } = await createSalon(salonData);
        if (error) throw error;
        toast.success(isRussian ? 'Салон добавлен' : 'Salon added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving salon:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await deleteSalon(deleteConfirmId);
      if (error) throw error;
      toast.success(isRussian ? 'Салон удалён' : 'Salon deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting salon:', error);
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>

        <div className="flex justify-end mb-4">
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            {isRussian ? 'Добавить салон' : 'Add Salon'}
          </Button>
        </div>

        {salonsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isRussian ? 'У вас пока нет салонов' : 'You have no salons yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {salons.map((salon) => (
              <Card key={salon.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={salon.cover_image || '/placeholder.svg'}
                        alt={isRussian ? salon.name_ru : salon.name_en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-3 pr-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {isRussian ? salon.name_ru : salon.name_en}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline">
                              {salonTypes.find(t => t.value === salon.salon_type)?.[isRussian ? 'labelRu' : 'label'] || salon.salon_type}
                            </Badge>
                            {!salon.is_active && (
                              <Badge variant="secondary">
                                {isRussian ? 'Неактивен' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(salon)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(salon.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {salon.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {salon.address}
                          </div>
                        )}
                        {salon.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {salon.phone}
                          </div>
                        )}
                        {salon.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {salon.rating.toFixed(1)} ({salon.review_count})
                          </div>
                        )}
                      </div>
                      {salon.price_from && (
                        <p className="mt-2 font-medium text-primary">
                          {isRussian ? 'От' : 'From'} ฿{salon.price_from}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsDialogOpen(open); }}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingSalon 
                  ? (isRussian ? 'Редактировать салон' : 'Edit Salon')
                  : (isRussian ? 'Добавить салон' : 'Add Salon')
                }
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                  <ImageUpload
                    value={formData.cover_image}
                    onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    folder="salons"
                  />
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Галерея' : 'Gallery'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    folder="salons"
                    maxImages={10}
                  />
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (EN)' : 'Name (EN)'} *</Label>
                    <Input
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      placeholder="Beauty Studio"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'} *</Label>
                    <Input
                      value={formData.name_ru}
                      onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                      placeholder="Студия красоты"
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Тип салона' : 'Salon Type'}</Label>
                  <Select value={formData.salon_type} onValueChange={(v) => setFormData({ ...formData, salon_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {salonTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {isRussian ? type.labelRu : type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                    <Textarea
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                    <Textarea
                      value={formData.description_ru}
                      onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Район' : 'District'}</Label>
                    <Input
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Сайт' : 'Website'}</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Услуги' : 'Services'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {servicesList.map(service => (
                      <Badge
                        key={service.value}
                        variant={formData.services.includes(service.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleServiceToggle(service.value)}
                      >
                        {isRussian ? service.labelRu : service.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Удобства' : 'Amenities'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map(amenity => (
                      <Badge
                        key={amenity.value}
                        variant={formData.amenities.includes(amenity.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleAmenityToggle(amenity.value)}
                      >
                        {amenity.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Цена от (THB)' : 'Price from (THB)'}</Label>
                  <Input
                    type="number"
                    value={formData.price_from}
                    onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Рекомендуемый' : 'Featured'}</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingSalon 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Добавить' : 'Add')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить салон?' : 'Delete Salon?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить.' 
                : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorBeauty;
