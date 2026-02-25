import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck, useAdminProviders, useAdminServices, useAdminCategories, Service } from '@/hooks/useAdmin';
import { useAdminFormHotkeys, useFormProgress } from '@/hooks/useAdminFormHotkeys';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { useOnBehalfContext } from '@/hooks/useAdminContentCreation';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { AdminFormToolbar } from '@/components/admin/AdminFormToolbar';
import { OnBehalfBanner } from '@/components/admin/OnBehalfBanner';
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
  Package, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Loader2,
  Clock,
  Star,
  Building2,
  Copy
} from 'lucide-react';

export default function AdminServices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { providers } = useAdminProviders();
  const { categories } = useAdminCategories();
  const { isOnBehalf } = useOnBehalfContext();
  
  const providerId = searchParams.get('provider') || undefined;
  const { services, isLoading: servicesLoading, createService, updateService, deleteService } = useAdminServices(providerId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProviderId, setFilterProviderId] = useState<string>(providerId || '');

  const [formData, setFormData] = useState({
    provider_id: providerId || '',
    category_id: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    price: '',
    duration_minutes: '',
    max_capacity: '1',
    is_active: true,
    is_featured: false,
  });

  const isRussian = language === 'ru';

  // Handle URL params for provider-first workflow
  const urlProviderId = searchParams.get('provider');
  const urlAction = searchParams.get('action');

  // Open dialog if action=new in URL, with provider context
  useEffect(() => {
    if (urlAction === 'new') {
      resetForm();
      if (urlProviderId) {
        setFormData(prev => ({ ...prev, provider_id: urlProviderId }));
      }
      setIsDialogOpen(true);
    }
  }, [urlAction, urlProviderId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: providerId || '',
      category_id: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      price: '',
      duration_minutes: '',
      max_capacity: '1',
      is_active: true,
      is_featured: false,
    });
    setEditingService(null);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      provider_id: service.provider_id,
      category_id: service.category_id || '',
      name_en: service.name_en || '',
      name_ru: service.name_ru || '',
      description_en: service.description_en || '',
      description_ru: service.description_ru || '',
      price: service.price?.toString() || '',
      duration_minutes: service.duration_minutes?.toString() || '',
      max_capacity: service.max_capacity?.toString() || '1',
      is_active: service.is_active ?? true,
      is_featured: service.is_featured ?? false,
    });
    setIsDialogOpen(true);
  };

  // Duplicate functionality
  const handleDuplicate = useCallback(() => {
    if (!editingService) return;
    
    setEditingService(null);
    setFormData(prev => ({
      ...prev,
      name_en: `${prev.name_en} (copy)`,
      name_ru: prev.name_ru ? `${prev.name_ru} (копия)` : '',
    }));
    toast.info(isRussian ? 'Создание копии...' : 'Creating a copy...');
  }, [editingService, isRussian]);

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price || !formData.provider_id) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        provider_id: formData.provider_id,
        category_id: formData.category_id || undefined,
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        price: parseFloat(formData.price),
        currency: 'THB',
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        max_capacity: parseInt(formData.max_capacity) || 1,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
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
    ['provider_id', 'name_en', 'price'],
    ['name_ru', 'description_en', 'description_ru', 'duration_minutes']
  );

  // Hotkeys
  useAdminFormHotkeys({
    onSave: handleSubmit,
    onClose: () => setIsDialogOpen(false),
    isDialogOpen,
    isSubmitting,
  });

  const filteredServices = services.filter(s => 
    s.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name_ru?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProviderName = (providerIdValue: string) => {
    const provider = providers.find(p => p.id === providerIdValue);
    return provider?.name || 'Unknown';
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!isAdmin) return null;

  const selectedProviderName = providerId ? getProviderName(providerId) : null;

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={selectedProviderName 
            ? `${isRussian ? 'Услуги' : 'Services'}: ${selectedProviderName}`
            : (isRussian ? 'Все услуги' : 'All Services')
          }
          showBack
        />

        {/* On-behalf context banner */}
        {isOnBehalf && <OnBehalfBanner className="mb-4" />}

        {/* Filter by Provider */}
        {!providerId && (
          <div className="mb-4">
            <Select
              value={filterProviderId || 'all'}
              onValueChange={(value) => {
                const actualValue = value === 'all' ? '' : value;
                setFilterProviderId(actualValue);
                if (actualValue) {
                  navigate(`/admin/services?provider=${actualValue}`);
                } else {
                  navigate('/admin/services');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRussian ? 'Фильтр по провайдеру' : 'Filter by provider'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRussian ? 'Все провайдеры' : 'All providers'}</SelectItem>
                {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id || 'unknown'}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search & Add */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRussian ? 'Поиск...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Services List */}
        {servicesLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет услуг' : 'No services'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian ? 'Добавьте первую услугу' : 'Add your first service'}
              </p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {isRussian ? 'Добавить' : 'Add Service'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">
                          {isRussian ? (service.name_ru || service.name_en) : service.name_en}
                        </h3>
                        {service.is_featured && (
                          <Star className="h-4 w-4 text-warning fill-warning" />
                        )}
                      </div>
                      
                      {!providerId && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Building2 className="h-3 w-3" />
                          {getProviderName(service.provider_id)}
                        </div>
                      )}

                      {service.description_en && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {isRussian ? (service.description_ru || service.description_en) : service.description_en}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-primary">
                          ฿{service.price?.toLocaleString()}
                        </span>
                        {service.duration_minutes && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} {isRussian ? 'мин' : 'min'}
                          </span>
                        )}
                        {!service.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            {isRussian ? 'Неактивна' : 'Inactive'}
                          </Badge>
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
                        <DropdownMenuItem onClick={() => {
                          openEditDialog(service);
                          setTimeout(() => handleDuplicate(), 100);
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          {isRussian ? 'Дублировать' : 'Duplicate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(service.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isRussian ? 'Удалить' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>
                {editingService 
                  ? (isRussian ? 'Редактировать услугу' : 'Edit Service')
                  : (isRussian ? 'Новая услуга' : 'New Service')}
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pt-4">
              <AdminFormToolbar
                progress={progress}
                filled={filled}
                total={total}
                onTranslate={handleAutoTranslate}
                onDuplicate={handleDuplicate}
                isTranslating={isTranslating}
                isEditing={!!editingService}
              />
            </div>

            <ScrollArea className="max-h-[calc(90vh-240px)] px-6">
              <div className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Провайдер *' : 'Provider *'}</Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRussian ? 'Выберите провайдера' : 'Select provider'} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Категория' : 'Category'}</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Выберите категорию' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isRussian ? cat.name_ru : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                  placeholder="Thai Massage"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input
                  value={formData.name_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_ru: e.target.value }))}
                  placeholder="Тайский массаж"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Описание (RU)' : 'Description (RU)'}</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ru: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Цена (฿) *' : 'Price (฿) *'}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Длительность (мин)' : 'Duration (min)'}</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Макс. клиентов' : 'Max Capacity'}</Label>
                <Input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_capacity: e.target.value }))}
                  placeholder="1"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRussian ? 'Активна' : 'Active'}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRussian ? 'Рекомендуемая' : 'Featured'}</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
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
    </>
  );
}
