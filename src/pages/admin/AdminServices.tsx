import { AdminDraftPreview, ADMIN_EDITOR_HEADER, ADMIN_EDITOR_BODY, ADMIN_EDITOR_FOOTER } from '@/components/admin/AdminDraftPreview';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck, useAdminProviders, useAdminServices, useAdminCategories, Service } from '@/hooks/useAdmin';
import { useAdminFormHotkeys, useFormProgress } from '@/hooks/useAdminFormHotkeys';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { useOnBehalfContext } from '@/hooks/useAdminContentCreation';
import { useCityCurrency } from '@/hooks/useCityCurrency';
import { CURRENCIES } from '@/lib/config/currencies';
import { optionalAuthoringText, positiveAuthoringNumber, servicePriceForSave, supplierIsPublishable } from '@/lib/services/adminAuthoring';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { AdminFormToolbar } from '@/components/admin/AdminFormToolbar';
import { OnBehalfBanner } from '@/components/admin/OnBehalfBanner';
import { ServiceBilingualHint } from '@/components/services/ServiceBilingualHint';
import { VendorFormSection } from '@/components/vendor/VendorFormSection';
import { MultiImageUpload } from '@/components/upload/ImageUpload';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Building2,
  Copy,
  Image,
  DollarSign,
  FileText,
  Settings,
  FolderTree,
} from 'lucide-react';

export default function AdminServices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { code: cityCurrencyCode } = useCityCurrency();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { providers } = useAdminProviders();
  const { categories } = useAdminCategories();
  const { isOnBehalf } = useOnBehalfContext();
  
  const providerId = searchParams.get('provider') || undefined;
  const { services, isLoading: servicesLoading, error: servicesError, refetch: refetchServices, createService, updateService, deleteService } = useAdminServices(providerId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProviderId, setFilterProviderId] = useState<string>(providerId || '');

  const [formData, setFormData] = useState({
    provider_id: providerId || '',
    category_id: '',
    subcategory_id: '',
    name_en: '',
    name_ru: '',
    description_en: '',
    description_ru: '',
    price: '',
    currency: cityCurrencyCode as string | null,
    duration_minutes: '',
    images: [] as string[],
    is_active: false,
  });

  const isRussian = language === 'ru';
  const serviceCurrency = formData.currency;
  const availableCurrencyCodes = [...new Set([...(serviceCurrency ? [serviceCurrency] : []), ...Object.keys(CURRENCIES)])];

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
      navigate(APP_ROUTES.AUTH);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate(APP_ROUTES.HOME);
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      provider_id: providerId || '',
      category_id: '',
      subcategory_id: '',
      name_en: '',
      name_ru: '',
      description_en: '',
      description_ru: '',
      price: '',
      currency: cityCurrencyCode,
      duration_minutes: '',
      images: [],
      is_active: false,
    });
    setEditingService(null);
  };

  const existingServiceForm = (service: Service): typeof formData => {
    // Determine if category_id is actually a subcategory
    const catId = service.category_id || '';
    const cat = categories.find(c => c.id === catId);
    const isSubcat = cat?.parent_id != null;
    
    return {
      provider_id: service.provider_id,
      category_id: isSubcat ? (cat?.parent_id || '') : catId,
      subcategory_id: isSubcat ? catId : '',
      name_en: service.name_en || '',
      name_ru: service.name_ru || '',
      description_en: service.description_en || '',
      description_ru: service.description_ru || '',
      price: service.price?.toString() || '',
      currency: service.currency,
      duration_minutes: service.duration_minutes?.toString() || '',
      images: service.images || [],
      is_active: service.is_active === true,
    };
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData(existingServiceForm(service));
    setIsDialogOpen(true);
  };

  // Build category hierarchy
  const parentCategories = useMemo(() => 
    categories.filter(c => c.parent_id == null), 
    [categories]
  );
  
  const subcategories = useMemo(() => {
    if (!formData.category_id) return [];
    return categories.filter(c => c.parent_id === formData.category_id);
  }, [categories, formData.category_id]);

  // Duplicate functionality
  const handleDuplicate = (source?: Service) => {
    if (!source && !editingService) return;
    const origin = source ? existingServiceForm(source) : formData;
    setEditingService(null);
    setFormData({
      ...origin,
      name_en: `${origin.name_en} (copy)`,
      name_ru: origin.name_ru ? `${origin.name_ru} (копия)` : '',
      is_active: false,
    });
    setIsDialogOpen(true);
    toast.info(isRussian ? 'Создание копии...' : 'Creating a copy...');
  };

  const handleSubmit = async (approveAndPublish = false) => {
    if (!user || !isAdmin || adminLoading || authLoading || isSubmitting) return;
    const name = formData.name_en.trim();
    const provider = providers.find(item => item.id === formData.provider_id);
    const categoryId = formData.subcategory_id || formData.category_id || null;
    const price = servicePriceForSave(formData.price, editingService?.price);
    const duration = positiveAuthoringNumber(formData.duration_minutes, true);

    if (!name || !provider || price === undefined || duration === undefined) {
      toast.error(isRussian ? 'Проверьте исполнителя, название, цену и длительность' : 'Check the provider, name, price and duration');
      return;
    }

    if (approveAndPublish && (!editingService || !supplierIsPublishable(provider)
      || !categories.some(category => category.id === categoryId)
      || price == null || price <= 0 || !serviceCurrency || !/^[A-Z]{3}$/.test(serviceCurrency))) {
      toast.error(isRussian
        ? 'Для публикации нужны действующий одобренный поставщик, категория, положительная цена и валюта'
        : 'Publishing requires an active approved provider, category, positive price and currency');
      return;
    }

    setIsSubmitting(true);
    try {
      const serviceData = {
        provider_id: provider.id,
        category_id: categoryId,
        name_en: name,
        name_ru: optionalAuthoringText(formData.name_ru) || name,
        description_en: optionalAuthoringText(formData.description_en),
        description_ru: optionalAuthoringText(formData.description_ru),
        price,
        currency: serviceCurrency,
        duration_minutes: duration,
        images: formData.images,
        is_active: approveAndPublish || (editingService?.approval_status === 'approved' && formData.is_active),
        ...(approveAndPublish ? { approval_status: 'approved', rejection_reason: null } : {}),
      };

      if (editingService) {
        const { error } = await updateService(editingService.id, serviceData);
        if (error) throw error;
        toast.success(approveAndPublish ? (isRussian ? 'Услуга опубликована' : 'Service published') : (isRussian ? 'Услуга обновлена' : 'Service updated'));
      } else {
        const { error } = await createService(serviceData);
        if (error) throw error;
        toast.success(isRussian ? 'Черновик услуги сохранён' : 'Service draft saved');
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
    ['provider_id', 'name_en'],
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
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} aria-label={isRussian ? 'Добавить' : 'Add'}>
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
        ) : servicesError ? (
          <Card role="alert">
            <CardContent className="p-8 text-center space-y-4">
              <p>{isRussian ? 'Не удалось загрузить услуги' : 'Could not load services'}</p>
              <Button onClick={() => refetchServices()}>{isRussian ? 'Повторить' : 'Retry'}</Button>
            </CardContent>
          </Card>
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
                          {[service.currency, service.price?.toLocaleString()].filter(Boolean).join(' ')}
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
                        <Button variant="ghost" size="icon" aria-label={isRussian ? 'Действия' : 'Actions'}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {isRussian ? 'Редактировать' : 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(service)}>
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
          <DialogContent className="flex max-h-[calc(100dvh-1rem)] flex-col gap-0 overflow-hidden p-0 sm:p-0 sm:max-w-[var(--layout-width-form)]">
            <DialogHeader className={ADMIN_EDITOR_HEADER}>
              <DialogTitle>
                {editingService 
                  ? (isRussian ? 'Редактировать услугу' : 'Edit Service')
                  : (isRussian ? 'Новая услуга' : 'New Service')}
              </DialogTitle>
            </DialogHeader>

            <div data-admin-editor-scroll="" className={ADMIN_EDITOR_BODY}>
            <div className="mb-4"><AdminDraftPreview language={language} title={isRussian ? formData.name_ru || formData.name_en : formData.name_en || formData.name_ru} description={isRussian ? formData.description_ru || formData.description_en : formData.description_en || formData.description_ru} /></div>
            <div className="pb-2">
              <ServiceBilingualHint isRu={isRussian} />
            </div>

            <div className="pb-4">
              <AdminFormToolbar
                progress={progress}
                filled={filled}
                total={total}
                onTranslate={handleAutoTranslate}
                onDuplicate={() => handleDuplicate()}
                isTranslating={isTranslating}
                isEditing={!!editingService}
              />
            </div>

            <div className="min-w-0">
              <div className="space-y-6 pb-4">
                
                {/* === Provider & Category === */}
                <VendorFormSection
                  title={isRussian ? 'Привязка' : 'Assignment'}
                  icon={<FolderTree className="h-4 w-4" />}
                  badge={isRussian ? 'Обязательно' : 'Required'}
                >
                  <div className="space-y-4">
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

                    <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                      <div className="space-y-2">
                        <Label>{isRussian ? 'Категория' : 'Category'}</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            category_id: value,
                            subcategory_id: '' // Reset subcategory when category changes
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isRussian ? 'Выберите' : 'Select'} />
                          </SelectTrigger>
                          <SelectContent>
                            {parentCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {isRussian ? cat.name_ru : cat.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{isRussian ? 'Подкатегория' : 'Subcategory'}</Label>
                        <Select
                          value={formData.subcategory_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                          disabled={subcategories.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              subcategories.length === 0 
                                ? (isRussian ? 'Нет подкатегорий' : 'No subcategories')
                                : (isRussian ? 'Выберите' : 'Select')
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {isRussian ? cat.name_ru : cat.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </VendorFormSection>

                {/* === Basic Info === */}
                <VendorFormSection
                  title={isRussian ? 'Основная информация' : 'Basic Information'}
                  icon={<FileText className="h-4 w-4" />}
                  badge={isRussian ? 'Обязательно' : 'Required'}
                >
                  <div className="space-y-4">
                    <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="admin-service-name-en">{isRussian ? 'Название (EN) *' : 'Name (EN) *'}</Label>
                        <Input id="admin-service-name-en"
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
                    </div>

                    <div className="grid min-w-0 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                      <div className="space-y-2">
                        <Label htmlFor="admin-service-description-en">{isRussian ? 'Описание (EN)' : 'Description (EN)'}</Label>
                        <Textarea id="admin-service-description-en"
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
                </VendorFormSection>

                {/* === Photos === */}
                <VendorFormSection
                  title={isRussian ? 'Фотографии' : 'Photos'}
                  icon={<Image className="h-4 w-4" />}
                  collapsible
                  defaultOpen={formData.images.length > 0}
                  badge={isRussian ? 'Рекомендуется' : 'Recommended'}
                >
                  <MultiImageUpload
                    value={formData.images}
                    onChange={(urls) => setFormData(prev => ({ ...prev, images: urls }))}
                    folder="services"
                    maxImages={6}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {isRussian 
                      ? 'Добавьте до 6 фото услуги. Первое фото будет обложкой.' 
                      : 'Add up to 6 service photos. First photo will be the cover.'}
                  </p>
                </VendorFormSection>

                {/* === Pricing & Duration === */}
                <VendorFormSection
                  title={isRussian ? 'Цена и время' : 'Pricing & Duration'}
                  icon={<DollarSign className="h-4 w-4" />}
                  badge={isRussian ? 'Обязательно' : 'Required'}
                >
                  <div className="grid min-w-0 gap-4 sm:grid-cols-3 [&>*]:min-w-0">
                    <div className="space-y-2">
                      <Label htmlFor="admin-service-price">{isRussian ? 'Цена' : 'Price'}</Label>
                      <Input
                        inputMode="decimal"
                        id="admin-service-price"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="1000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-service-currency">{isRussian ? 'Валюта' : 'Currency'}</Label>
                      <Select value={serviceCurrency || 'unknown'} onValueChange={value => setFormData(prev => ({ ...prev, currency: value === 'unknown' ? null : value }))}>
                        <SelectTrigger id="admin-service-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">{isRussian ? 'Не указана' : 'Not set'}</SelectItem>
                          {availableCurrencyCodes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                        </SelectContent>
                      </Select>
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
                </VendorFormSection>

                {/* === Settings === */}
                <VendorFormSection
                  title={isRussian ? 'Настройки' : 'Settings'}
                  icon={<Settings className="h-4 w-4" />}
                  collapsible
                  defaultOpen={false}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{isRussian ? 'Активна' : 'Active'}</Label>
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? 'Видна клиентам' : 'Visible to customers'}
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        disabled={editingService?.approval_status !== 'approved'}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                  </div>
                </VendorFormSection>

              </div>
            </div>
            </div>

            <DialogFooter className={ADMIN_EDITOR_FOOTER}>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              {editingService && editingService.approval_status !== 'approved' && (
                <Button variant="outline" onClick={() => void handleSubmit(true)} disabled={isSubmitting}>
                  {isRussian ? 'Одобрить и опубликовать' : 'Approve and publish'}
                </Button>
              )}
              <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
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
