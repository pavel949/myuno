import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile, useVendorServices, VendorService } from '@/hooks/useVendor';
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
  Package, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { CardPreview, CardPreviewSection } from '@/components/vendor/CardPreview';

const VendorServices = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { services, isLoading: servicesLoading, createService, updateService, deleteService } = useVendorServices(profile?.id);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<VendorService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    name_ru: '',
    description: '',
    description_ru: '',
    price: '',
    duration_minutes: '',
    max_capacity: '1',
    image: '',
    is_active: true,
  });

  const isRussian = language === 'ru';

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      name_ru: '',
      description: '',
      description_ru: '',
      price: '',
      duration_minutes: '',
      max_capacity: '1',
      image: '',
      is_active: true,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: VendorService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      name_ru: service.name_ru || '',
      description: service.description || '',
      description_ru: service.description_ru || '',
      price: service.price.toString(),
      duration_minutes: service.duration_minutes?.toString() || '',
      max_capacity: service.max_capacity.toString(),
      image: (service as any).image || '',
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        name: formData.name,
        name_ru: formData.name_ru || undefined,
        description: formData.description || undefined,
        description_ru: formData.description_ru || undefined,
        price: parseFloat(formData.price),
        currency: 'THB',
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        max_capacity: parseInt(formData.max_capacity) || 1,
        image: formData.image || undefined,
        is_active: formData.is_active,
      };

      if (editingService) {
        const { error } = await updateService(editingService.id, serviceData);
        if (error) throw error;
        toast.success(isRussian ? 'Услуга обновлена' : 'Service updated');
      } else {
        const { error } = await createService(serviceData);
        if (error) throw error;
        toast.success(isRussian ? 'Услуга создана' : 'Service created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      const { error } = await deleteService(serviceId);
      if (error) throw error;
      toast.success(isRussian ? 'Услуга удалена' : 'Service deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting service');
    }
  };

  if (authLoading || profileLoading) {
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

  if (!profile) return null;

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Услуги' : 'Services'}
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
          {isRussian ? 'Добавить услугу' : 'Add Service'}
        </Button>

        {servicesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет услуг' : 'No services'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свои услуги' : 'Add your services'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {(service as any).image ? (
                      <img 
                        src={(service as any).image} 
                        alt={service.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">
                              {isRussian ? (service.name_ru || service.name) : service.name}
                            </h3>
                            {!service.is_active && (
                              <Badge variant="outline" className="text-xs">
                                {isRussian ? 'Неактивна' : 'Inactive'}
                              </Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {isRussian ? (service.description_ru || service.description) : service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-primary">
                              ฿{service.price.toLocaleString()}
                            </span>
                            {service.duration_minutes && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {service.duration_minutes} {isRussian ? 'мин' : 'min'}
                              </span>
                            )}
                            {service.max_capacity > 1 && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {service.max_capacity}
                              </span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(service)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-500"
                              onClick={() => setDeleteConfirmId(service.id)}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService 
                  ? (isRussian ? 'Редактировать услугу' : 'Edit Service')
                  : (isRussian ? 'Новая услуга' : 'New Service')}
              </DialogTitle>
            </DialogHeader>

            <div className="grid md:grid-cols-[1fr,280px] gap-6 py-4">
              {/* Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Фото услуги' : 'Service Photo'}</Label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                    folder="services"
                    placeholder={isRussian ? 'Загрузить фото' : 'Upload photo'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{isRussian ? 'Название *' : 'Name *'}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={isRussian ? 'Например: Маникюр' : 'e.g., Manicure'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_ru">{isRussian ? 'Название (RU)' : 'Name (Russian)'}</Label>
                  <Input
                    id="name_ru"
                    value={formData.name_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{isRussian ? 'Описание' : 'Description'}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ru">{isRussian ? 'Описание (RU)' : 'Description (Russian)'}</Label>
                  <Textarea
                    id="description_ru"
                    value={formData.description_ru}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{isRussian ? 'Цена (฿) *' : 'Price (฿) *'}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">{isRussian ? 'Длительность (мин)' : 'Duration (min)'}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="60"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">{isRussian ? 'Макс. клиентов' : 'Max Capacity'}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                    placeholder="1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{isRussian ? 'Услуга активна' : 'Service active'}</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>

              {/* Preview */}
              <CardPreviewSection className="hidden md:block sticky top-0">
                <CardPreview
                  type="service"
                  image={formData.image}
                  title={formData.name}
                  titleRu={formData.name_ru}
                  description={formData.description}
                  descriptionRu={formData.description_ru}
                  price={formData.price ? parseFloat(formData.price) : undefined}
                  durationMinutes={formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined}
                  maxCapacity={formData.max_capacity ? parseInt(formData.max_capacity) : undefined}
                />
              </CardPreviewSection>
            </div>

            <DialogFooter>
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
              <DialogTitle>{isRussian ? 'Удалить услугу?' : 'Delete service?'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
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
      </PageContainer>
    </AppLayout>
  );
};

export default VendorServices;
