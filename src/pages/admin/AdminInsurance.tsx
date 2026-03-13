import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminInsurance, AdminInsuranceProvider } from '@/hooks/useAdminInsurance';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Plus, MoreVertical, Pencil, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const insuranceTypes = [
  { value: 'health', label: 'Health', labelRu: 'Здоровье' },
  { value: 'travel', label: 'Travel', labelRu: 'Путешествия' },
  { value: 'property', label: 'Property', labelRu: 'Имущество' },
  { value: 'vehicle', label: 'Vehicle', labelRu: 'Транспорт' },
  { value: 'life', label: 'Life', labelRu: 'Жизнь' },
  { value: 'business', label: 'Business', labelRu: 'Бизнес' },
];

const supportedLanguages = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'zh', label: '中文' },
];

interface InsuranceFormData {
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  address: string;
  district: string;
  phone: string;
  email: string;
  website: string;
  insurance_types: string[];
  languages: string[];
  min_coverage_amount: number | null;
  max_coverage_amount: number | null;
  license_number: string;
  has_24h_support: boolean;
  has_online_claims: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
}

const defaultFormData: InsuranceFormData = {
  provider_id: null,
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  cover_image: '',
  images: [],
  address: '',
  district: '',
  phone: '',
  email: '',
  website: '',
  insurance_types: [],
  languages: ['en'],
  min_coverage_amount: null,
  max_coverage_amount: null,
  license_number: '',
  has_24h_support: false,
  has_online_claims: false,
  is_active: true,
  is_verified: false,
  is_featured: false,
};

const AdminInsurance = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterProviderId = searchParams.get('provider') || undefined;
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { insuranceProviders, isLoading, createInsuranceProvider, updateInsuranceProvider, deleteInsuranceProvider } = useAdminInsurance(filterProviderId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminInsuranceProvider | null>(null);
  const [formData, setFormData] = useState<InsuranceFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (authLoading || adminLoading) {
    return (
      <PageContainer>
        <PageHeader title="Insurance" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    navigate(APP_ROUTES.AUTH);
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingItem(null);
  };

  const openEditDialog = (item: AdminInsuranceProvider) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id,
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      cover_image: item.cover_image || '',
      images: item.images || [],
      address: item.address || '',
      district: item.district || '',
      phone: item.phone || '',
      email: item.email || '',
      website: item.website || '',
      insurance_types: item.insurance_types || [],
      languages: item.languages || ['en'],
      min_coverage_amount: item.min_coverage_amount,
      max_coverage_amount: item.max_coverage_amount,
      license_number: item.license_number || '',
      has_24h_support: item.has_24h_support || false,
      has_online_claims: item.has_online_claims || false,
      is_active: item.is_active ?? true,
      is_verified: item.is_verified || false,
      is_featured: item.is_featured || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en.trim() || !formData.name_ru.trim()) {
      toast.error('Please fill in required fields (names)');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateInsuranceProvider(editingItem.id, formData);
      } else {
        await createInsuranceProvider(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteInsuranceProvider(id);
    setDeleteConfirmId(null);
  };

  const toggleInsuranceType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      insurance_types: prev.insurance_types.includes(type)
        ? prev.insurance_types.filter((t) => t !== type)
        : [...prev.insurance_types, type],
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  return (
    <PageContainer>
      <PageHeader
        title={language === 'en' ? 'Insurance Providers' : 'Страховые компании'}
        actions={
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Provider' : 'Добавить компанию'}
          </Button>
        }
      />

      {!filterProviderId && (
        <div className="mb-4">
          <ProviderSelector
            value=""
            onChange={(v) => navigate(v ? `/admin/insurance?provider=${v}` : '/admin/insurance')}
            label={language === 'en' ? 'Filter by Provider' : 'Фильтр по провайдеру'}
          />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : insuranceProviders.length === 0 ? (
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No insurance providers found' : 'Страховые компании не найдены'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {insuranceProviders.map((provider) => (
            <Card key={provider.id} className="p-4">
              <div className="flex items-start gap-4">
                {provider.cover_image && (
                  <img
                    src={provider.cover_image}
                    alt={provider.name_en}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {language === 'en' ? provider.name_en : provider.name_ru}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {provider.insurance_types?.slice(0, 3).map((t) => {
                      const found = insuranceTypes.find((it) => it.value === t);
                      return found ? (language === 'en' ? found.label : found.labelRu) : t;
                    }).join(', ')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {provider.has_24h_support && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded">24/7</span>
                    )}
                    {provider.has_online_claims && (
                      <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded">
                        {language === 'en' ? 'Online Claims' : 'Онлайн-заявки'}
                      </span>
                    )}
                    {!provider.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {language === 'en' ? 'Inactive' : 'Неактивно'}
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
                    <DropdownMenuItem onClick={() => openEditDialog(provider)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Edit' : 'Редактировать'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(provider.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Delete' : 'Удалить'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingItem
                ? (language === 'en' ? 'Edit Insurance Provider' : 'Редактировать страховую компанию')
                : (language === 'en' ? 'Add Insurance Provider' : 'Добавить страховую компанию')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              {/* Provider */}
              <ProviderSelector
                value={formData.provider_id || ''}
                onChange={(v) => setFormData({ ...formData, provider_id: v || null })}
                label={language === 'en' ? 'Provider' : 'Провайдер'}
              />

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name (EN) *</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label>Название (RU) *</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                    placeholder="Название компании"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description (EN)</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Описание (RU)</Label>
                  <Textarea
                    value={formData.description_ru}
                    onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                    placeholder="Описание"
                    rows={3}
                  />
                </div>
              </div>

              {/* Insurance Types */}
              <div>
                <Label className="mb-2 block">{language === 'en' ? 'Insurance Types' : 'Типы страхования'}</Label>
                <div className="flex flex-wrap gap-3">
                  {insuranceTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={formData.insurance_types.includes(type.value)}
                        onCheckedChange={() => toggleInsuranceType(type.value)}
                      />
                      <label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                        {language === 'en' ? type.label : type.labelRu}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>{language === 'en' ? 'Cover Image' : 'Обложка'}</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(v) => setFormData({ ...formData, cover_image: v })}
                  folder="insurance"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Gallery' : 'Галерея'}</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(v) => setFormData({ ...formData, images: v })}
                  folder="insurance"
                  maxImages={6}
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Address' : 'Адрес'}</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'District' : 'Район'}</Label>
                  <Input
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Phone' : 'Телефон'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Website' : 'Сайт'}</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'License Number' : 'Номер лицензии'}</Label>
                  <Input
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  />
                </div>
              </div>

              {/* Coverage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'en' ? 'Min Coverage (AED)' : 'Мин. покрытие (AED)'}</Label>
                  <Input
                    type="number"
                    value={formData.min_coverage_amount ?? ''}
                    onChange={(e) => setFormData({ ...formData, min_coverage_amount: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Max Coverage (AED)' : 'Макс. покрытие (AED)'}</Label>
                  <Input
                    type="number"
                    value={formData.max_coverage_amount ?? ''}
                    onChange={(e) => setFormData({ ...formData, max_coverage_amount: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label className="mb-2 block">{language === 'en' ? 'Supported Languages' : 'Языки поддержки'}</Label>
                <div className="flex flex-wrap gap-3">
                  {supportedLanguages.map((lang) => (
                    <div key={lang.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.value}`}
                        checked={formData.languages.includes(lang.value)}
                        onCheckedChange={() => toggleLanguage(lang.value)}
                      />
                      <label htmlFor={`lang-${lang.value}`} className="text-sm cursor-pointer">
                        {lang.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? '24/7 Support' : 'Поддержка 24/7'}</Label>
                  <Switch
                    checked={formData.has_24h_support}
                    onCheckedChange={(v) => setFormData({ ...formData, has_24h_support: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Online Claims' : 'Онлайн-заявки'}</Label>
                  <Switch
                    checked={formData.has_online_claims}
                    onCheckedChange={(v) => setFormData({ ...formData, has_online_claims: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Active' : 'Активно'}</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Featured' : 'Рекомендуемый'}</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Verified' : 'Проверено'}</Label>
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(v) => setFormData({ ...formData, is_verified: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? (language === 'en' ? 'Saving...' : 'Сохранение...')
                : (language === 'en' ? 'Save' : 'Сохранить')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Insurance Provider?' : 'Удалить страховую компанию?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en'
                ? 'This action cannot be undone.'
                : 'Это действие нельзя отменить.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'en' ? 'Cancel' : 'Отмена'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {language === 'en' ? 'Delete' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default AdminInsurance;
