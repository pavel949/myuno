import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck, useAdminProviders, Provider } from '@/hooks/useAdmin';

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
import { CategorySelector, GENERAL_CATEGORIES } from '@/components/admin/CategorySelector';
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
  Building2, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  Search,
  Loader2,
  Package,
  User,
  Shield,
  Clock,
  Languages,
  Eye,
  Sparkles,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessCardScanButton, ScannedProviderData } from '@/components/admin/BusinessCardScanButton';
import { 
  ALL_SERVICE_CATEGORIES, 
  PROVIDER_TYPE_OPTIONS,
  SERVICE_DOMAINS,
  getCategoryById
} from '@/lib/taxonomies';

// Combined business categories for display
const ALL_BUSINESS_CATEGORIES = [
  ...ALL_SERVICE_CATEGORIES.map(cat => ({
    value: cat.id,
    labelEn: cat.labelEn,
    labelRu: cat.labelRu,
    icon: cat.icon,
  })),
  ...GENERAL_CATEGORIES.map(cat => ({
    value: cat.id,
    labelEn: cat.labelEn,
    labelRu: cat.labelRu,
    icon: cat.icon,
  })),
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'en', labelEn: 'English', labelRu: 'Английский', flag: '🇬🇧' },
  { value: 'ru', labelEn: 'Russian', labelRu: 'Русский', flag: '🇷🇺' },
  { value: 'th', labelEn: 'Thai', labelRu: 'Тайский', flag: '🇹🇭' },
  { value: 'zh', labelEn: 'Chinese', labelRu: 'Китайский', flag: '🇨🇳' },
  { value: 'de', labelEn: 'German', labelRu: 'Немецкий', flag: '🇩🇪' },
  { value: 'fr', labelEn: 'French', labelRu: 'Французский', flag: '🇫🇷' },
];

export default function AdminProviders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { providers, isLoading: providersLoading, createProvider, updateProvider, deleteProvider } = useAdminProviders();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'verified' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    name: '',
    description_en: '',
    description_ru: '',
    business_category: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    is_active: true,
    is_verified: false,
    // New fields for data consistency with HomeServiceProviderCard
    provider_type: 'company' as 'individual' | 'company',
    response_time_minutes: '',
    has_insurance: false,
    has_guarantee: false,
    languages: [] as string[],
    service_domains: [] as string[],
  });

  const isRussian = language === 'ru';

  // Open dialog if action=new in URL
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(APP_ROUTES.AUTH);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const resetForm = () => {
    setFormData({
      name: '',
      description_en: '',
      description_ru: '',
      business_category: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      is_active: true,
      is_verified: false,
      provider_type: 'company',
      response_time_minutes: '',
      has_insurance: false,
      has_guarantee: false,
      languages: [],
      service_domains: [],
    });
    setEditingProvider(null);
  };

  const openEditDialog = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name || '',
      description_en: provider.description_en || '',
      description_ru: provider.description_ru || '',
      business_category: provider.business_category || '',
      phone: provider.phone || '',
      email: provider.email || '',
      website: provider.website || '',
      address: provider.address || '',
      is_active: provider.is_active ?? true,
      is_verified: provider.is_verified ?? false,
      // New fields
      provider_type: ((provider as any).provider_type as 'individual' | 'company') || 'company',
      response_time_minutes: (provider as any).response_time_minutes?.toString() || '',
      has_insurance: (provider as any).has_insurance ?? false,
      has_guarantee: (provider as any).has_guarantee ?? false,
      languages: (provider as any).languages || [],
      service_domains: (provider as any).service_domains || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.business_category) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const providerData = {
        name: formData.name,
        description_en: formData.description_en || undefined,
        description_ru: formData.description_ru || undefined,
        business_category: formData.business_category,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        website: formData.website || undefined,
        address: formData.address || undefined,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
        // New fields
        provider_type: formData.provider_type,
        response_time_minutes: formData.response_time_minutes ? parseInt(formData.response_time_minutes) : null,
        has_insurance: formData.has_insurance,
        has_guarantee: formData.has_guarantee,
        service_domains: formData.service_domains,
      };

      if (editingProvider) {
        const { error } = await updateProvider(editingProvider.id, providerData);
        if (error) throw error;
        toast.success(isRussian ? 'Провайдер обновлён' : 'Provider updated');
      } else {
        const { error } = await createProvider(providerData);
        if (error) throw error;
        toast.success(isRussian ? 'Провайдер создан' : 'Provider created');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving provider');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (providerId: string) => {
    try {
      const { error } = await deleteProvider(providerId);
      if (error) throw error;
      toast.success(isRussian ? 'Провайдер удалён' : 'Provider deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting provider');
    }
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.business_category?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'active') return p.is_active;
    if (filter === 'verified') return p.is_verified;
    if (filter === 'inactive') return !p.is_active;
    return true;
  });

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

  return (
    <>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Провайдеры' : 'Providers'}
          showBack
        />

        {/* Search & Add */}
        <div className="flex gap-2 mb-3">
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

        {/* Filter Chips */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: 'all' as const, labelEn: 'All', labelRu: 'Все' },
            { key: 'active' as const, labelEn: 'Active', labelRu: 'Активные' },
            { key: 'verified' as const, labelEn: 'Verified', labelRu: 'Верифицированные' },
            { key: 'inactive' as const, labelEn: 'Inactive', labelRu: 'Неактивные' },
          ]).map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {isRussian ? f.labelRu : f.labelEn}
              {f.key !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                  {f.key === 'active' ? providers.filter(p => p.is_active).length :
                   f.key === 'verified' ? providers.filter(p => p.is_verified).length :
                   providers.filter(p => !p.is_active).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Providers List */}
        {providersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет провайдеров' : 'No providers'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian ? 'Добавьте первого провайдера' : 'Add your first provider'}
              </p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                {isRussian ? 'Добавить' : 'Add Provider'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProviders.map((provider) => {
              const categoryLabel = ALL_BUSINESS_CATEGORIES.find(c => c.value === provider.business_category)?.[isRussian ? 'labelRu' : 'labelEn'] || provider.business_category;
              return (
                <Card key={provider.id} className={cn(!provider.is_active && 'opacity-60')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar/Logo */}
                      <div 
                        className="shrink-0 cursor-pointer"
                        onClick={() => navigate(`/admin/providers/${provider.id}`)}
                      >
                        {provider.logo_url ? (
                          <img 
                            src={provider.logo_url} 
                            alt={provider.name} 
                            className="h-12 w-12 rounded-xl object-cover border"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/admin/providers/${provider.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium hover:text-primary truncate">
                            {provider.name}
                          </h3>
                          {provider.is_verified && (
                            <CheckCircle className="h-4 w-4 text-success shrink-0" />
                          )}
                          {!provider.is_active && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {isRussian ? 'Неактивен' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryLabel}
                          </Badge>
                          {(provider as any).provider_type === 'individual' && (
                            <Badge variant="secondary" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {isRussian ? 'Мастер' : 'Master'}
                            </Badge>
                          )}
                          {provider.rating != null && provider.rating > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {provider.rating.toFixed(1)}
                              {provider.review_count ? ` (${provider.review_count})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/providers/${provider.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {isRussian ? 'Подробнее' : 'View Details'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/services?provider=${provider.id}`)}>
                              <Package className="h-4 w-4 mr-2" />
                              {isRussian ? 'Услуги' : 'Services'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(provider.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRussian ? 'Удалить' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProvider 
                  ? (isRussian ? 'Редактировать провайдера' : 'Edit Provider')
                  : (isRussian ? 'Новый провайдер' : 'New Provider')}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Business Card Scanner Button - only for new providers */}
              {!editingProvider && (
                <BusinessCardScanButton
                  onDataExtracted={(data: ScannedProviderData) => {
                    setFormData(prev => ({
                      ...prev,
                      name: data.name || prev.name,
                      business_category: data.business_category || prev.business_category,
                      description_en: data.description_en || prev.description_en,
                      description_ru: data.description_ru || prev.description_ru,
                      phone: data.phone || prev.phone,
                      email: data.email || prev.email,
                      website: data.website || prev.website,
                      address: data.address || prev.address,
                    }));
                  }}
                  className="w-full"
                />
              )}

              <div className="space-y-2">
                <Label>{isRussian ? 'Название *' : 'Name *'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Thai Massage & Spa"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Категория *' : 'Category *'}</Label>
                <CategorySelector
                  value={formData.business_category}
                  onChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    business_category: typeof value === 'string' ? value : value[0] || '' 
                  }))}
                  placeholder={isRussian ? 'Выберите категорию' : 'Select category'}
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
                  <Label>{isRussian ? 'Телефон' : 'Phone'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+66..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRussian ? 'Адрес' : 'Address'}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRussian ? 'Сайт' : 'Website'}</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Provider Type Toggle */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {isRussian ? 'Тип исполнителя' : 'Provider Type'}
                </Label>
                <div className="flex gap-2">
                  {PROVIDER_TYPE_OPTIONS.filter(o => o.id !== 'all').map((opt) => (
                    <Button
                      key={opt.id}
                      type="button"
                      variant={formData.provider_type === opt.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, provider_type: opt.id as 'individual' | 'company' }))}
                      className="flex-1"
                    >
                      <span className="mr-1">{opt.icon}</span>
                      {isRussian ? opt.labelRu : opt.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Response Time */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isRussian ? 'Время отклика (минуты)' : 'Response Time (minutes)'}
                </Label>
                <Input
                  type="number"
                  value={formData.response_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, response_time_minutes: e.target.value }))}
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Среднее время ответа на запрос' : 'Average response time to requests'}
                </p>
              </div>

              {/* Service Domains (for home services) */}
              <div className="space-y-2">
                <Label>{isRussian ? 'Домены услуг' : 'Service Domains'}</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_DOMAINS.map((domain) => (
                    <Button
                      key={domain.id}
                      type="button"
                      variant={formData.service_domains.includes(domain.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const domains = formData.service_domains.includes(domain.id)
                          ? formData.service_domains.filter(d => d !== domain.id)
                          : [...formData.service_domains, domain.id];
                        setFormData(prev => ({ ...prev, service_domains: domains }));
                      }}
                    >
                      <span className="mr-1">{domain.icon}</span>
                      {isRussian ? domain.labelRu : domain.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Badges / Certifications */}
              <div className="space-y-3 border-t pt-4">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  {isRussian ? 'Сертификаты и бейджи' : 'Certifications & Badges'}
                </Label>
                
                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Активен' : 'Active'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Верифицирован' : 'Verified'}</Label>
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Есть страховка' : 'Has Insurance'}</Label>
                  <Switch
                    checked={formData.has_insurance}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_insurance: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>{isRussian ? 'Гарантия на работы' : 'Work Guarantee'}</Label>
                  <Switch
                    checked={formData.has_guarantee}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_guarantee: checked }))}
                  />
                </div>
              </div>
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
              <DialogTitle>{isRussian ? 'Удалить провайдера?' : 'Delete provider?'}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Это действие нельзя отменить. Все услуги провайдера также будут удалены.' : 'This action cannot be undone. All services will also be deleted.'}
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
