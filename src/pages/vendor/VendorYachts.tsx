import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorYachts } from '@/hooks/useVendorYachts';
import { Yacht } from '@/hooks/useYachts';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
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
  Anchor,
  Gauge,
  Ship,
  Bed,
  Bath
} from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { MultiImageUpload } from '@/components/upload/ImageUpload';

const yachtTypes = [
  { value: 'yacht', label: 'Yacht', labelRu: 'Яхта' },
  { value: 'catamaran', label: 'Catamaran', labelRu: 'Катамаран' },
  { value: 'speedboat', label: 'Speedboat', labelRu: 'Скоростная лодка' },
  { value: 'sailboat', label: 'Sailboat', labelRu: 'Парусная яхта' },
];

const VendorYachts = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { yachts, isLoading: yachtsLoading, createYacht, updateYacht, deleteYacht } = useVendorYachts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYacht, setEditingYacht] = useState<Yacht | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    // Technical specs
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
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const resetForm = () => {
    setFormData({
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
    });
    setEditingYacht(null);
  };

  const openEditDialog = (yacht: Yacht) => {
    setEditingYacht(yacht);
    setFormData({
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
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price_full_day) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const yachtData: any = {
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
        // Technical specs
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

  if (authLoading) {
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

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Мои яхты' : 'My Yachts'}
          showBack
        />

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
                {isRussian ? 'Добавьте свою яхту или катамаран' : 'Add your yacht or catamaran'}
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
                        placeholder="Люкс яхта 42 фута"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Тип судна' : 'Vessel Type'}</Label>
                      <Select
                        value={formData.yacht_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, yacht_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {yachtTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {isRussian ? type.labelRu : type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Вместимость *' : 'Capacity *'}</Label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                  </div>

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

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Цены' : 'Pricing'}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Цена за полдня (฿)' : 'Half-day price (฿)'}</Label>
                      <Input
                        type="number"
                        value={formData.price_half_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_half_day: e.target.value }))}
                        placeholder="25000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Цена за день (฿) *' : 'Full-day price (฿) *'}</Label>
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
                        placeholder="Phuket Marina"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Локация (RU)' : 'Location (RU)'}</Label>
                      <Input
                        value={formData.location_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_ru: e.target.value }))}
                        placeholder="Марина Пхукет"
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Anchor className="h-4 w-4" />
                    {isRussian ? 'Технические характеристики' : 'Technical Specifications'}
                  </h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Ruler className="h-3 w-3" />
                        {isRussian ? 'Длина (м)' : 'Length (m)'}
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.length_meters}
                        onChange={(e) => setFormData(prev => ({ ...prev, length_meters: e.target.value }))}
                        placeholder="12.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Ширина' : 'Beam'}</Label>
                      <Input
                        value={formData.beam}
                        onChange={(e) => setFormData(prev => ({ ...prev, beam: e.target.value }))}
                        placeholder="4.2m"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Осадка' : 'Draft'}</Label>
                      <Input
                        value={formData.draft}
                        onChange={(e) => setFormData(prev => ({ ...prev, draft: e.target.value }))}
                        placeholder="1.8m"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Год постройки' : 'Year Built'}</Label>
                      <Input
                        type="number"
                        value={formData.year_built}
                        onChange={(e) => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                        placeholder="2020"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Ship className="h-3 w-3" />
                        {isRussian ? 'Двигатели' : 'Engines'}
                      </Label>
                      <Input
                        value={formData.engines}
                        onChange={(e) => setFormData(prev => ({ ...prev, engines: e.target.value }))}
                        placeholder="2x Volvo Penta 380hp"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        {isRussian ? 'Крейс. скорость' : 'Cruising Speed'}
                      </Label>
                      <Input
                        value={formData.cruising_speed}
                        onChange={(e) => setFormData(prev => ({ ...prev, cruising_speed: e.target.value }))}
                        placeholder="18 knots"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Макс. скорость' : 'Max Speed'}</Label>
                      <Input
                        value={formData.max_speed}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_speed: e.target.value }))}
                        placeholder="28 knots"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Топливо (л)' : 'Fuel (L)'}</Label>
                      <Input
                        value={formData.fuel_capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, fuel_capacity: e.target.value }))}
                        placeholder="1200L"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Bed className="h-3 w-3" />
                        {isRussian ? 'Каюты' : 'Cabins'}
                      </Label>
                      <Input
                        type="number"
                        value={formData.cabins}
                        onChange={(e) => setFormData(prev => ({ ...prev, cabins: e.target.value }))}
                        placeholder="3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <Bath className="h-3 w-3" />
                        {isRussian ? 'Ванные' : 'Bathrooms'}
                      </Label>
                      <Input
                        type="number"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                        placeholder="2"
                      />
                    </div>
                    <div className="flex items-end pb-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={formData.has_crew}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_crew: checked }))}
                        />
                        <Label>{isRussian ? 'С экипажем' : 'With Crew'}</Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Удобства (через запятую)' : 'Features (comma-separated)'}
                  </h3>

                  <div className="space-y-2">
                    <Label>{isRussian ? 'Удобства (EN)' : 'Features (EN)'}</Label>
                    <Textarea
                      value={formData.features_en}
                      onChange={(e) => setFormData(prev => ({ ...prev, features_en: e.target.value }))}
                      placeholder="Air conditioning, WiFi, Snorkeling gear, BBQ"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRussian ? 'Удобства (RU)' : 'Features (RU)'}</Label>
                    <Textarea
                      value={formData.features_ru}
                      onChange={(e) => setFormData(prev => ({ ...prev, features_ru: e.target.value }))}
                      placeholder="Кондиционер, WiFi, Снаряжение для снорклинга, BBQ"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Настройки' : 'Settings'}
                  </h3>

                  <div className="flex items-center justify-between">
                    <Label>{isRussian ? 'Рекомендовать' : 'Feature this yacht'}</Label>
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
            </ScrollArea>

            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isRussian ? 'Сохранить' : 'Save'}
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
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorYachts;
