import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVerticalCRUD } from '@/hooks/useVerticalCRUD';

interface VendorGym {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  gym_type: string;
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  amenities: string[];
  classes: string[];
  price_day_pass: number | null;
  price_week_pass: number | null;
  price_month_pass: number | null;
  currency: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  working_hours: Record<string, string>;
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
  Dumbbell, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Phone,
  Star
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';

const gymTypes = [
  { value: 'gym', label: 'Gym', labelRu: 'Тренажёрный зал' },
  { value: 'fitness_center', label: 'Fitness Center', labelRu: 'Фитнес-центр' },
  { value: 'crossfit', label: 'CrossFit', labelRu: 'Кроссфит' },
  { value: 'yoga_studio', label: 'Yoga Studio', labelRu: 'Йога-студия' },
  { value: 'martial_arts', label: 'Martial Arts', labelRu: 'Боевые искусства' },
  { value: 'pool', label: 'Swimming Pool', labelRu: 'Бассейн' },
];

const amenitiesList = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'parking', label: 'Parking' },
  { value: 'showers', label: 'Showers' },
  { value: 'lockers', label: 'Lockers' },
  { value: 'sauna', label: 'Sauna' },
  { value: 'towels', label: 'Towels' },
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'group_classes', label: 'Group Classes' },
];

const classesList = [
  { value: 'yoga', label: 'Yoga', labelRu: 'Йога' },
  { value: 'pilates', label: 'Pilates', labelRu: 'Пилатес' },
  { value: 'spinning', label: 'Spinning', labelRu: 'Сайклинг' },
  { value: 'zumba', label: 'Zumba', labelRu: 'Зумба' },
  { value: 'boxing', label: 'Boxing', labelRu: 'Бокс' },
  { value: 'muay_thai', label: 'Muay Thai', labelRu: 'Муай-тай' },
  { value: 'crossfit', label: 'CrossFit', labelRu: 'Кроссфит' },
  { value: 'stretching', label: 'Stretching', labelRu: 'Растяжка' },
];

const VendorFitness = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { items: gyms, isLoading: gymsLoading, create: createGym, update: updateGym, remove: deleteGym } = useVerticalCRUD<VendorGym>('fitness', profile?.id, {
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,gym_type,cover_image,images,address,district,phone,email,amenities,classes,price_day_pass,price_week_pass,price_month_pass,currency,rating,review_count,is_verified,is_featured,is_active,working_hours,created_at,updated_at',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<VendorGym | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    website: '',
    amenities: [] as string[],
    classes: [] as string[],
    price_day_pass: '',
    price_week_pass: '',
    price_month_pass: '',
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
      gym_type: 'gym',
      cover_image: '',
      images: [],
      address: '',
      district: '',
      phone: '',
      email: '',
      website: '',
      amenities: [],
      classes: [],
      price_day_pass: '',
      price_week_pass: '',
      price_month_pass: '',
      is_featured: false,
      is_active: true,
    });
    setEditingGym(null);
  };

  const openEditDialog = (gym: VendorGym) => {
    setEditingGym(gym);
    setFormData({
      name_en: gym.name_en || '',
      name_ru: gym.name_ru || '',
      description_en: gym.description_en || '',
      description_ru: gym.description_ru || '',
      gym_type: gym.gym_type || 'gym',
      cover_image: gym.cover_image || '',
      images: gym.images || [],
      address: gym.address || '',
      district: gym.district || '',
      phone: gym.phone || '',
      email: gym.email || '',
      website: gym.website || '',
      amenities: gym.amenities || [],
      classes: gym.classes || [],
      price_day_pass: gym.price_day_pass?.toString() || '',
      price_week_pass: gym.price_week_pass?.toString() || '',
      price_month_pass: gym.price_month_pass?.toString() || '',
      is_featured: gym.is_featured || false,
      is_active: gym.is_active !== false,
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
      const gymData = {
        name_en: formData.name_en,
        name_ru: formData.name_ru,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        gym_type: formData.gym_type,
        cover_image: formData.cover_image || null,
        images: formData.images,
        address: formData.address || null,
        district: formData.district || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        amenities: formData.amenities,
        classes: formData.classes,
        price_day_pass: formData.price_day_pass ? parseFloat(formData.price_day_pass) : null,
        price_week_pass: formData.price_week_pass ? parseFloat(formData.price_week_pass) : null,
        price_month_pass: formData.price_month_pass ? parseFloat(formData.price_month_pass) : null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        currency: 'THB',
      };

      if (editingGym) {
        const { error } = await updateGym(editingGym.id, gymData);
        if (error) throw error;
        toast.success(isRussian ? 'Зал обновлён' : 'Gym updated');
      } else {
        const { error } = await createGym(gymData);
        if (error) throw error;
        toast.success(isRussian ? 'Зал добавлен' : 'Gym added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving gym:', error);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await deleteGym(deleteConfirmId);
      if (error) throw error;
      toast.success(isRussian ? 'Зал удалён' : 'Gym deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting gym:', error);
      toast.error(isRussian ? 'Ошибка удаления' : 'Error deleting');
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleClassToggle = (cls: string) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(cls)
        ? prev.classes.filter(c => c !== cls)
        : [...prev.classes, cls]
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
            {isRussian ? 'Добавить зал' : 'Add Gym'}
          </Button>
        </div>

        {gymsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : gyms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isRussian ? 'У вас пока нет залов' : 'You have no gyms yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {gyms.map((gym) => (
              <Card key={gym.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    <div className="w-32 h-32 flex-shrink-0">
                      <img
                        src={gym.cover_image || '/placeholder.svg'}
                        alt={isRussian ? gym.name_ru : gym.name_en}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-3 pr-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {isRussian ? gym.name_ru : gym.name_en}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline">
                              {gymTypes.find(t => t.value === gym.gym_type)?.[isRussian ? 'labelRu' : 'label'] || gym.gym_type}
                            </Badge>
                            {!gym.is_active && (
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
                            <DropdownMenuItem onClick={() => openEditDialog(gym)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(gym.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {gym.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {gym.address}
                          </div>
                        )}
                        {gym.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {gym.phone}
                          </div>
                        )}
                        {gym.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            {gym.rating.toFixed(1)} ({gym.review_count})
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex gap-2 text-sm">
                        {gym.price_day_pass && (
                          <span className="text-primary font-medium">
                            {isRussian ? 'День' : 'Day'}: ฿{gym.price_day_pass}
                          </span>
                        )}
                        {gym.price_month_pass && (
                          <span className="text-primary font-medium">
                            {isRussian ? 'Месяц' : 'Month'}: ฿{gym.price_month_pass}
                          </span>
                        )}
                      </div>
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
                {editingGym 
                  ? (isRussian ? 'Редактировать зал' : 'Edit Gym')
                  : (isRussian ? 'Добавить зал' : 'Add Gym')
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
                    folder="gyms"
                  />
                </div>

                {/* Gallery */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Галерея' : 'Gallery'}</Label>
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData({ ...formData, images: urls })}
                    folder="gyms"
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
                      placeholder="Fitness Center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'} *</Label>
                    <Input
                      value={formData.name_ru}
                      onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                      placeholder="Фитнес-центр"
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Тип зала' : 'Gym Type'}</Label>
                  <Select value={formData.gym_type} onValueChange={(v) => setFormData({ ...formData, gym_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gymTypes.map(type => (
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

                {/* Classes */}
                <div className="space-y-2">
                  <Label>{isRussian ? 'Занятия' : 'Classes'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {classesList.map(cls => (
                      <Badge
                        key={cls.value}
                        variant={formData.classes.includes(cls.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => handleClassToggle(cls.value)}
                      >
                        {isRussian ? cls.labelRu : cls.label}
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

                {/* Prices */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{isRussian ? 'День (THB)' : 'Day Pass (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.price_day_pass}
                      onChange={(e) => setFormData({ ...formData, price_day_pass: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Неделя (THB)' : 'Week Pass (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.price_week_pass}
                      onChange={(e) => setFormData({ ...formData, price_week_pass: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Месяц (THB)' : 'Month Pass (THB)'}</Label>
                    <Input
                      type="number"
                      value={formData.price_month_pass}
                      onChange={(e) => setFormData({ ...formData, price_month_pass: e.target.value })}
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                {/* is_featured removed - admin only */}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingGym 
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
              <DialogTitle>{isRussian ? 'Удалить зал?' : 'Delete Gym?'}</DialogTitle>
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

export default VendorFitness;
