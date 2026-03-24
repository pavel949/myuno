import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorVehicles, VendorVehicle } from '@/hooks/useVendorVehicles';
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
  Car, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Loader2,
  Fuel,
  Settings2,
  Calendar,
  Briefcase,
  MapPin
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';

const vehicleTypes = [
  { value: 'sedan', label: 'Sedan', labelRu: 'Седан' },
  { value: 'suv', label: 'SUV', labelRu: 'Внедорожник' },
  { value: 'hatchback', label: 'Hatchback', labelRu: 'Хэтчбек' },
  { value: 'minivan', label: 'Minivan', labelRu: 'Минивэн' },
  { value: 'pickup', label: 'Pickup', labelRu: 'Пикап' },
  { value: 'motorbike', label: 'Motorbike', labelRu: 'Мотоцикл' },
  { value: 'scooter', label: 'Scooter', labelRu: 'Скутер' },
  { value: 'luxury', label: 'Luxury', labelRu: 'Люкс' },
];

const transmissionTypes = [
  { value: 'automatic', label: 'Automatic', labelRu: 'Автомат' },
  { value: 'manual', label: 'Manual', labelRu: 'Механика' },
];

const fuelTypes = [
  { value: 'petrol', label: 'Petrol', labelRu: 'Бензин' },
  { value: 'diesel', label: 'Diesel', labelRu: 'Дизель' },
  { value: 'electric', label: 'Electric', labelRu: 'Электро' },
  { value: 'hybrid', label: 'Hybrid', labelRu: 'Гибрид' },
];

const VendorTransport = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { vehicles, isLoading: vehiclesLoading, createVehicle, updateVehicle, deleteVehicle } = useVendorVehicles();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VendorVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    vehicle_type: 'sedan',
    cover_image: '',
    images: [] as string[],
    capacity: '5',
    luggage_capacity: '2',
    doors: '4',
    transmission: 'automatic',
    fuel_type: 'petrol',
    year_built: '',
    engine_size: '',
    color: '',
    location_name: '',
    location_ru: '',
    price_per_hour: '',
    price_per_day: '',
    price_airport_transfer: '',
    deposit_amount: '',
    min_rental_days: '1',
    free_km_per_day: '',
    extra_km_price: '',
    features: '',
    is_featured: false,
    is_available: true,
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
      vehicle_type: 'sedan',
      cover_image: '',
      images: [],
      capacity: '5',
      luggage_capacity: '2',
      doors: '4',
      transmission: 'automatic',
      fuel_type: 'petrol',
      year_built: '',
      engine_size: '',
      color: '',
      location_name: '',
      location_ru: '',
      price_per_hour: '',
      price_per_day: '',
      price_airport_transfer: '',
      deposit_amount: '',
      min_rental_days: '1',
      free_km_per_day: '',
      extra_km_price: '',
      features: '',
      is_featured: false,
      is_available: true,
    });
    setEditingVehicle(null);
  };

  const openEditDialog = (vehicle: VendorVehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name_en: vehicle.name_en,
      name_ru: vehicle.name_ru || '',
      description_en: vehicle.description_en || '',
      description_ru: vehicle.description_ru || '',
      vehicle_type: vehicle.vehicle_type || 'sedan',
      cover_image: vehicle.cover_image || '',
      images: vehicle.images || [],
      capacity: vehicle.capacity?.toString() || '5',
      luggage_capacity: vehicle.luggage_capacity?.toString() || '2',
      doors: vehicle.doors?.toString() || '4',
      transmission: vehicle.transmission || 'automatic',
      fuel_type: vehicle.fuel_type || 'petrol',
      year_built: vehicle.year_built?.toString() || '',
      engine_size: vehicle.engine_size || '',
      color: vehicle.color || '',
      location_name: vehicle.location_name || '',
      location_ru: vehicle.location_ru || '',
      price_per_hour: vehicle.price_per_hour?.toString() || '',
      price_per_day: vehicle.price_per_day?.toString() || '',
      price_airport_transfer: vehicle.price_airport_transfer?.toString() || '',
      deposit_amount: vehicle.deposit_amount?.toString() || '',
      min_rental_days: vehicle.min_rental_days?.toString() || '1',
      free_km_per_day: vehicle.free_km_per_day?.toString() || '',
      extra_km_price: vehicle.extra_km_price?.toString() || '',
      features: vehicle.features?.join(', ') || '',
      is_featured: vehicle.is_featured || false,
      is_available: vehicle.is_available ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price_per_day) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleData: any = {
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        vehicle_type: formData.vehicle_type,
        cover_image: formData.cover_image || null,
        images: formData.images.length > 0 ? formData.images : [],
        capacity: parseInt(formData.capacity) || 5,
        luggage_capacity: parseInt(formData.luggage_capacity) || 2,
        doors: parseInt(formData.doors) || 4,
        transmission: formData.transmission,
        fuel_type: formData.fuel_type,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        engine_size: formData.engine_size || null,
        color: formData.color || null,
        location_name: formData.location_name || null,
        location_ru: formData.location_ru || null,
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
        price_per_day: parseFloat(formData.price_per_day),
        price_airport_transfer: formData.price_airport_transfer ? parseFloat(formData.price_airport_transfer) : null,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : null,
        min_rental_days: parseInt(formData.min_rental_days) || 1,
        free_km_per_day: formData.free_km_per_day ? parseInt(formData.free_km_per_day) : null,
        extra_km_price: formData.extra_km_price ? parseFloat(formData.extra_km_price) : null,
        currency: 'THB',
        features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [],
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        is_active: true,
      };

      if (editingVehicle) {
        const { error } = await updateVehicle(editingVehicle.id, vehicleData);
        if (error) throw error;
        toast.success(isRussian ? 'Транспорт обновлен' : 'Vehicle updated');
      } else {
        const { error } = await createVehicle(vehicleData);
        if (error) throw error;
        toast.success(isRussian ? 'Транспорт добавлен' : 'Vehicle added');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const { error } = await deleteVehicle(vehicleId);
      if (error) throw error;
      toast.success(isRussian ? 'Транспорт удален' : 'Vehicle deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting vehicle');
    }
  };

  if (authLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>

        <Button 
          className="w-full mb-4" 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить транспорт' : 'Add Vehicle'}
        </Button>

        {vehiclesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет транспорта' : 'No vehicles'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свой автомобиль или мотоцикл' : 'Add your car or motorbike'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className={!vehicle.is_verified ? 'border-warning/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {vehicle.cover_image ? (
                      <img 
                        src={vehicle.cover_image} 
                        alt={vehicle.name_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Car className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">
                              {isRussian ? vehicle.name_ru : vehicle.name_en}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {vehicleTypes.find(t => t.value === vehicle.vehicle_type)?.[isRussian ? 'labelRu' : 'label'] || vehicle.vehicle_type}
                            </Badge>
                            {!vehicle.is_verified && (
                              <Badge variant="outline" className="text-xs text-warning">
                                {isRussian ? 'На модерации' : 'Pending'}
                              </Badge>
                            )}
                            {vehicle.is_featured && (
                              <Badge className="text-xs bg-primary">
                                {isRussian ? 'Избранное' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {vehicle.capacity}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Settings2 className="h-3 w-3" />
                              {vehicle.transmission === 'automatic' ? (isRussian ? 'Авто' : 'Auto') : (isRussian ? 'Мех' : 'Manual')}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Fuel className="h-3 w-3" />
                              {fuelTypes.find(f => f.value === vehicle.fuel_type)?.[isRussian ? 'labelRu' : 'label'] || vehicle.fuel_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {vehicle.price_per_hour && (
                              <span>
                                <span className="text-muted-foreground">{isRussian ? 'Час:' : 'Hour:'}</span>{' '}
                                <span className="font-bold text-primary">฿{vehicle.price_per_hour.toLocaleString()}</span>
                              </span>
                            )}
                            <span>
                              <span className="text-muted-foreground">{isRussian ? 'День:' : 'Day:'}</span>{' '}
                              <span className="font-bold text-primary">฿{vehicle.price_per_day?.toLocaleString()}</span>
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
                            <DropdownMenuItem onClick={() => openEditDialog(vehicle)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(vehicle.id)}
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

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить транспорт?' : 'Delete vehicle?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
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

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[calc(100vw-16px)] sm:max-w-3xl max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>
                {editingVehicle 
                  ? (isRussian ? 'Редактировать транспорт' : 'Edit Vehicle')
                  : (isRussian ? 'Новый транспорт' : 'New Vehicle')}
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
                      folder="vehicles"
                      placeholder={isRussian ? 'Загрузить обложку' : 'Upload cover'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isRussian ? 'Галерея (до 10 фото)' : 'Gallery (up to 10 photos)'}</Label>
                    <MultiImageUpload
                      value={formData.images}
                      onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                      folder="vehicles"
                      maxImages={10}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                      <Input
                        value={formData.name_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                        placeholder="Toyota Camry 2023"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                      <Input
                        value={formData.name_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                        placeholder="Тойота Камри 2023"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                      <Textarea
                        value={formData.description_en}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                        placeholder="Comfortable sedan..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                      <Textarea
                        value={formData.description_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                        placeholder="Комфортный седан..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Тип транспорта' : 'Vehicle Type'}</Label>
                      <Select
                        value={formData.vehicle_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {isRussian ? type.labelRu : type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Трансмиссия' : 'Transmission'}</Label>
                      <Select
                        value={formData.transmission}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, transmission: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {transmissionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {isRussian ? type.labelRu : type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Топливо' : 'Fuel Type'}</Label>
                      <Select
                        value={formData.fuel_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, fuel_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fuelTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {isRussian ? type.labelRu : type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Характеристики' : 'Specifications'}
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Мест' : 'Seats'}</Label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                        min="1"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Дверей' : 'Doors'}</Label>
                      <Input
                        type="number"
                        value={formData.doors}
                        onChange={(e) => setFormData(prev => ({ ...prev, doors: e.target.value }))}
                        min="2"
                        max="6"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Багаж (шт)' : 'Luggage'}</Label>
                      <Input
                        type="number"
                        value={formData.luggage_capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, luggage_capacity: e.target.value }))}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Год' : 'Year'}</Label>
                      <Input
                        type="number"
                        value={formData.year_built}
                        onChange={(e) => setFormData(prev => ({ ...prev, year_built: e.target.value }))}
                        placeholder="2023"
                        min="1990"
                        max="2030"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Объем двигателя' : 'Engine Size'}</Label>
                      <Input
                        value={formData.engine_size}
                        onChange={(e) => setFormData(prev => ({ ...prev, engine_size: e.target.value }))}
                        placeholder="2.5L"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Цвет' : 'Color'}</Label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="White / Белый"
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
                        placeholder="Patong Beach"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Локация (RU)' : 'Location (RU)'}</Label>
                      <Input
                        value={formData.location_ru}
                        onChange={(e) => setFormData(prev => ({ ...prev, location_ru: e.target.value }))}
                        placeholder="Пляж Патонг"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Цены (THB)' : 'Pricing (THB)'}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Час' : 'Per Hour'}</Label>
                      <Input
                        type="number"
                        value={formData.price_per_hour}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_hour: e.target.value }))}
                        placeholder="300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'День *' : 'Per Day *'}</Label>
                      <Input
                        type="number"
                        value={formData.price_per_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_day: e.target.value }))}
                        placeholder="1500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Аэропорт трансфер' : 'Airport Transfer'}</Label>
                      <Input
                        type="number"
                        value={formData.price_airport_transfer}
                        onChange={(e) => setFormData(prev => ({ ...prev, price_airport_transfer: e.target.value }))}
                        placeholder="800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Залог' : 'Deposit'}</Label>
                      <Input
                        type="number"
                        value={formData.deposit_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, deposit_amount: e.target.value }))}
                        placeholder="5000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Мин. дней' : 'Min Days'}</Label>
                      <Input
                        type="number"
                        value={formData.min_rental_days}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_rental_days: e.target.value }))}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Км/день' : 'Free KM/day'}</Label>
                      <Input
                        type="number"
                        value={formData.free_km_per_day}
                        onChange={(e) => setFormData(prev => ({ ...prev, free_km_per_day: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{isRussian ? 'Доп. км' : 'Extra KM'}</Label>
                      <Input
                        type="number"
                        value={formData.extra_km_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, extra_km_price: e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {isRussian ? 'Особенности' : 'Features'}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label>{isRussian ? 'Особенности (через запятую)' : 'Features (comma-separated)'}</Label>
                    <Textarea
                      value={formData.features}
                      onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                      placeholder="AC, Bluetooth, GPS, Backup Camera"
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
                    <div>
                      <Label>{isRussian ? 'Доступен для аренды' : 'Available for Rent'}</Label>
                      <p className="text-sm text-muted-foreground">
                        {isRussian ? 'Отображается в каталоге' : 'Visible in catalog'}
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                    />
                  </div>

                  {/* is_featured removed - admin only */}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingVehicle 
                  ? (isRussian ? 'Сохранить' : 'Save')
                  : (isRussian ? 'Добавить' : 'Add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
  );
};

export default VendorTransport;
