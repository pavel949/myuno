import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminYachts } from '@/hooks/useAdminContent';
import { Yacht } from '@/hooks/useYachts';
import { AppLayout } from '@/components/layout/AppLayout';
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
  Sailboat, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Loader2,
  Ruler,
  Bed,
  Filter
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';

const yachtTypes = [
  { value: 'yacht', label: 'Yacht', labelRu: 'Яхта' },
  { value: 'catamaran', label: 'Catamaran', labelRu: 'Катамаран' },
  { value: 'speedboat', label: 'Speedboat', labelRu: 'Скоростная лодка' },
  { value: 'sailboat', label: 'Sailboat', labelRu: 'Парусная яхта' },
];

export default function AdminYachts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { yachts, isLoading: yachtsLoading, createYacht, updateYacht, deleteYacht } = useAdminYachts(filterProviderId || undefined);
  
  // Get URL params for provider-first workflow
  const urlProviderId = searchParams.get('provider');
  const urlAction = searchParams.get('action');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Auto-open dialog with provider context from URL
  React.useEffect(() => {
    if (urlAction === 'new') {
      resetForm();
      if (urlProviderId) {
        setFormData(prev => ({ ...prev, provider_id: urlProviderId }));
      }
      setIsDialogOpen(true);
    }
  }, [urlAction, urlProviderId]);

  const [formData, setFormData] = useState({
    provider_id: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    yacht_type: 'yacht',
    cover_image: '',
    images: [] as string[],
    capacity: '10',
    price_half_day: '',
    price_full_day: '',
    location_name: '',
    location_ru: '',
    features_en: '',
    features_ru: '',
    length_meters: '',
    year_built: '',
    beam: '',
    draft: '',
    engines: '',
    cruising_speed: '',
    max_speed: '',
    fuel_capacity: '',
    cabins: '',
    bathrooms: '',
    has_crew: true,
    is_featured: false,
    is_active: true,
    departure_times: '',
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      yacht_type: 'yacht',
      cover_image: '',
      images: [],
      capacity: '10',
      price_half_day: '',
      price_full_day: '',
      location_name: '',
      location_ru: '',
      features_en: '',
      features_ru: '',
      length_meters: '',
      year_built: '',
      beam: '',
      draft: '',
      engines: '',
      cruising_speed: '',
      max_speed: '',
      fuel_capacity: '',
      cabins: '',
      bathrooms: '',
      has_crew: true,
      is_featured: false,
      is_active: true,
      departure_times: '',
    });
    setEditingYacht(null);
  };

  const openEditDialog = (yacht: Yacht) => {
    setEditingYacht(yacht);
    setFormData({
      provider_id: (yacht as any).provider_id || '',
      name_en: yacht.name_en,
      name_ru: yacht.name_ru || '',
      description_en: yacht.description_en || '',
      description_ru: yacht.description_ru || '',
      yacht_type: yacht.yacht_type,
      cover_image: yacht.cover_image || '',
      images: yacht.images || [],
      capacity: yacht.capacity.toString(),
      price_half_day: yacht.price_half_day?.toString() || '',
      price_full_day: yacht.price_full_day?.toString() || '',
      location_name: yacht.location_name || '',
      location_ru: yacht.location_ru || '',
      features_en: yacht.features_en?.join(', ') || '',
      features_ru: yacht.features_ru?.join(', ') || '',
      length_meters: yacht.length_meters?.toString() || '',
      year_built: yacht.year_built?.toString() || '',
      beam: yacht.beam || '',
      draft: yacht.draft || '',
      engines: yacht.engines || '',
      cruising_speed: yacht.cruising_speed || '',
      max_speed: yacht.max_speed || '',
      fuel_capacity: yacht.fuel_capacity || '',
      cabins: yacht.cabins?.toString() || '',
      bathrooms: yacht.bathrooms?.toString() || '',
      has_crew: yacht.has_crew ?? true,
      is_featured: yacht.is_featured,
      is_active: true,
      departure_times: (yacht as any).departure_times?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price_full_day || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля (название, цена, провайдер)' : 'Please fill required fields (name, price, provider)');
      return;
    }

    setIsSubmitting(true);
    try {
      const yachtData: any = {
        provider_id: formData.provider_id,
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        yacht_type: formData.yacht_type,
        cover_image: formData.cover_image || undefined,
        images: formData.images.length > 0 ? formData.images : [],
        capacity: parseInt(formData.capacity) || 10,
        price_half_day: formData.price_half_day ? parseFloat(formData.price_half_day) : undefined,
        price_full_day: parseFloat(formData.price_full_day),
        currency: 'THB',
        location_name: formData.location_name || undefined,
        location_ru: formData.location_ru || undefined,
        features_en: formData.features_en ? formData.features_en.split(',').map(f => f.trim()).filter(Boolean) : [],
        features_ru: formData.features_ru ? formData.features_ru.split(',').map(f => f.trim()).filter(Boolean) : [],
        length_meters: formData.length_meters ? parseFloat(formData.length_meters) : undefined,
        year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
        beam: formData.beam || undefined,
        draft: formData.draft || undefined,
        engines: formData.engines || undefined,
        cruising_speed: formData.cruising_speed || undefined,
        max_speed: formData.max_speed || undefined,
        fuel_capacity: formData.fuel_capacity || undefined,
        cabins: formData.cabins ? parseInt(formData.cabins) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        has_crew: formData.has_crew,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        departure_times: formData.departure_times ? formData.departure_times.split(',').map(t => t.trim()).filter(Boolean) : null,
      };

      if (editingYacht) {
        const { error } = await updateYacht(editingYacht.id, yachtData);
        if (error) throw error;
        toast.success(isRussian ? 'Яхта обновлена' : 'Yacht updated');
      } else {
        const { error } = await createYacht(yachtData);
        if (error) throw error;
        toast.success(isRussian ? 'Яхта добавлена' : 'Yacht added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving yacht:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving yacht');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (yachtId: string) => {
    try {
      const { error } = await deleteYacht(yachtId);
      if (error) throw error;
      toast.success(isRussian ? 'Яхта удалена' : 'Yacht deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting yacht:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting yacht');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
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
          title={isRussian ? 'Управление яхтами' : 'Yacht Management'}
          showBack
        />

        {/* Filter by provider */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <Select value={filterProviderId} onValueChange={setFilterProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Все провайдеры' : 'All providers'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{isRussian ? 'Все провайдеры' : 'All providers'}</SelectItem>
                    {/* Provider list will be populated from the selector */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          className="w-full mb-4" 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить яхту' : 'Add Yacht'}
        </Button>

        {yachtsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : yachts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Sailboat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет яхт' : 'No yachts'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте яхту или катамаран' : 'Add a yacht or catamaran'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {yachts.map((yacht) => (
              <Card key={yacht.id} className={!yacht.is_verified ? 'border-amber-500/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {yacht.cover_image ? (
                      <img 
                        src={yacht.cover_image} 
                        alt={yacht.name_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Sailboat className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">
                              {isRussian ? yacht.name_ru : yacht.name_en}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {yachtTypes.find(t => t.value === yacht.yacht_type)?.[isRussian ? 'labelRu' : 'label']}
                            </Badge>
                            {!yacht.is_verified && (
                              <Badge variant="outline" className="text-xs text-amber-600">
                                {isRussian ? 'На модерации' : 'Pending'}
                              </Badge>
                            )}
                            {yacht.is_featured && (
                              <Badge className="text-xs bg-primary">
                                {isRussian ? 'Избранное' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {yacht.capacity}
                            </span>
                            {yacht.length_meters && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Ruler className="h-3 w-3" />
                                {yacht.length_meters}m
                              </span>
                            )}
                            {yacht.cabins && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Bed className="h-3 w-3" />
                                {yacht.cabins}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {yacht.price_half_day && (
                              <span>
                                <span className="text-muted-foreground">{isRussian ? 'Полдня:' : 'Half:'}</span>{' '}
                                <span className="font-bold text-primary">฿{yacht.price_half_day.toLocaleString()}</span>
                              </span>
                            )}
                            <span>
                              <span className="text-muted-foreground">{isRussian ? 'День:' : 'Day:'}</span>{' '}
                              <span className="font-bold text-primary">฿{yacht.price_full_day?.toLocaleString()}</span>
                            </span>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(yacht)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(yacht.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>
                {editingYacht 
                  ? (isRussian ? 'Редактировать яхту' : 'Edit Yacht')
                  : (isRussian ? 'Новая яхта' : 'New Yacht')}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-6 py-4">
                {/* Provider Selection - Admin Only */}
                <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed">
                  <ProviderSelector
                    value={formData.provider_id}
                    onChange={(id) => setFormData(prev => ({ ...prev, provider_id: id }))}
                    label={isRussian ? 'Привязать к провайдеру' : 'Assign to Provider'}
                    required
                  />
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Основная информация' : 'Basic Information'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Обложка' : 'Cover Image'}</Label>
                    <ImageUpload
                      value={formData.cover_image}
                      onChange={(url) => setFormData(prev => ({ ...prev, cover_image: url }))}
                      folder="yachts"
                      placeholder={isRussian ? 'Загрузить обложку' : 'Upload cover'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRussian ? 'Галерея (до 10 фото)' : 'Gallery (up to 10 photos)'}</Label>
                    <MultiImageUpload
                      value={formData.images}
                      onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                      folder="yachts"
                      maxImages={10}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                        placeholder="Luxury Yacht 42ft"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                      <Input
                        value={formData.name_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                        placeholder="Люксовая яхта 42 фута"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Тип' : 'Type'}</Label>
                      <Select
                        value={formData.yacht_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, yacht_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yachtTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {isRussian ? type.labelRu : type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Вместимость' : 'Capacity'}</Label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                      <Textarea
                        value={formData.description_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                      <Textarea
                        value={formData.description_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Цены' : 'Pricing'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Цена за полдня (฿)' : 'Half-day Price (฿)'}</Label>
                      <Input
                        type="number"
                        value={formData.price_half_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_half_day: e.target.value }))}
                        placeholder="25000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Цена за день (฿) *' : 'Full-day Price (฿) *'}</Label>
                      <Input
                        type="number"
                        value={formData.price_full_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_full_day: e.target.value }))}
                        placeholder="45000"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Локация' : 'Location'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Локация (EN)' : 'Location (EN)'}</Label>
                      <Input
                        value={formData.location_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                        placeholder="Chalong Bay Marina"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Локация (RU)' : 'Location (RU)'}</Label>
                      <Input
                        value={formData.location_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_ru: e.target.value }))}
                        placeholder="Марина Чалонг Бэй"
                      />
                    </div>
                  </div>
                </div>

                {/* Tech Specs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Технические характеристики' : 'Technical Specs'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Длина (м)' : 'Length (m)'}</Label>
                      <Input
                        type="number"
                        value={formData.length_meters}
                        onChange={(e) => setFormData(prev => ({ ...prev, length_meters: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Год постройки' : 'Year Built'}</Label>
                      <Input
                        type="number"
                        value={formData.year_built}
                        onChange={(e) => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Каюты' : 'Cabins'}</Label>
                      <Input
                        type="number"
                        value={formData.cabins}
                        onChange={(e) => setFormData(prev => ({ ...prev, cabins: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Ванные' : 'Bathrooms'}</Label>
                      <Input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Двигатели' : 'Engines'}</Label>
                      <Input
                        value={formData.engines}
                        onChange={(e) => setFormData(prev => ({ ...prev, engines: e.target.value }))}
                        placeholder="2x 500HP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Макс. скорость' : 'Max Speed'}</Label>
                      <Input
                        value={formData.max_speed}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_speed: e.target.value }))}
                        placeholder="25 knots"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Особенности' : 'Features'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Особенности (EN, через запятую)' : 'Features (EN, comma-separated)'}</Label>
                      <Input
                        value={formData.features_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, features_en: e.target.value }))}
                        placeholder="WiFi, Air conditioning, Kitchen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Особенности (RU, через запятую)' : 'Features (RU, comma-separated)'}</Label>
                      <Input
                        value={formData.features_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, features_ru: e.target.value }))}
                        placeholder="WiFi, Кондиционер, Кухня"
                      />
                    </div>
                  </div>
                </div>

                {/* Departure Times */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Расписание отправлений' : 'Departure Schedule'}
                  </h3>
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Время отправления (через запятую)' : 'Departure Times (comma-separated)'}</Label>
                    <Input
                      value={formData.departure_times}
                      onChange={(e) => setFormData(prev => ({ ...prev, departure_times: e.target.value }))}
                      placeholder="08:00, 09:00, 10:00, 14:00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRussian 
                        ? 'Оставьте пустым для стандартного расписания (полдня: 09:00, 14:00 / день: 08:00, 09:00, 10:00)'
                        : 'Leave empty for default schedule (half day: 09:00, 14:00 / full day: 08:00, 09:00, 10:00)'}
                    </p>
                  </div>
                </div>
                {/* Toggles */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Настройки' : 'Settings'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{isRussian ? 'С экипажем' : 'With Crew'}</Label>
                      <Switch
                        checked={formData.has_crew}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_crew: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{isRussian ? 'Избранное (Featured)' : 'Featured'}</Label>
                      <Switch
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{isRussian ? 'Активна' : 'Active'}</Label>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingYacht 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Создать' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить яхту?' : 'Delete yacht?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить. Яхта будет удалена навсегда.'
                : 'This action cannot be undone. The yacht will be permanently deleted.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
