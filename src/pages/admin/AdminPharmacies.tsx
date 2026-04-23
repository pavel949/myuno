import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminPharmacies, AdminPharmacy } from '@/hooks/useAdminPharmacies';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Plus, MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface PharmacyFormData {
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  cover_image: string;
  images: string[];
  address: string;
  phone: string;
  email: string;
  website: string;
  delivery_available: boolean;
  delivery_fee: number;
  delivery_radius_km: number;
  min_order_amount: number;
  is_24h: boolean;
  has_pharmacist: boolean;
  license_number: string;
  is_active: boolean;
  is_verified: boolean;
}

const defaultFormData: PharmacyFormData = {
  provider_id: null,
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  cover_image: '',
  images: [],
  address: '',
  phone: '',
  email: '',
  website: '',
  delivery_available: false,
  delivery_fee: 0,
  delivery_radius_km: 5,
  min_order_amount: 0,
  is_24h: false,
  has_pharmacist: true,
  license_number: '',
  is_active: true,
  is_verified: false,
};

const AdminPharmacies = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterProviderId = searchParams.get('provider') || undefined;
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { pharmacies, isLoading, createPharmacy, updatePharmacy, deletePharmacy } = useAdminPharmacies(filterProviderId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminPharmacy | null>(null);
  const [formData, setFormData] = useState<PharmacyFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (authLoading || adminLoading) {
    return (
      <PageContainer>
        <PageHeader title="Pharmacies" />
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
    navigate(APP_ROUTES.HOME);
    return null;
  }

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingItem(null);
  };

  const openEditDialog = (item: AdminPharmacy) => {
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
      phone: item.phone || '',
      email: item.email || '',
      website: item.website || '',
      delivery_available: item.delivery_available || false,
      delivery_fee: item.delivery_fee || 0,
      delivery_radius_km: item.delivery_radius_km || 5,
      min_order_amount: item.min_order_amount || 0,
      is_24h: item.is_24h || false,
      has_pharmacist: item.has_pharmacist ?? true,
      license_number: item.license_number || '',
      is_active: item.is_active ?? true,
      is_verified: item.is_verified || false,
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
        await updatePharmacy(editingItem.id, formData);
      } else {
        await createPharmacy(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deletePharmacy(id);
    setDeleteConfirmId(null);
  };

  return (
    <PageContainer>
      <PageHeader
        title={language === 'en' ? 'Pharmacies' : 'Аптеки'}
        actions={
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Pharmacy' : 'Добавить аптеку'}
          </Button>
        }
      />

      {!filterProviderId && (
        <div className="mb-4">
          <ProviderSelector
            value=""
            onChange={(v) => navigate(v ? `/admin/pharmacies?provider=${v}` : '/admin/pharmacies')}
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
      ) : pharmacies.length === 0 ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No pharmacies found' : 'Аптеки не найдены'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className="p-4">
              <div className="flex items-start gap-4">
                {pharmacy.cover_image && (
                  <img
                    src={pharmacy.cover_image}
                    alt={pharmacy.name_en}
                    className="w-20 h-20 rounded-none object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {language === 'en' ? pharmacy.name_en : pharmacy.name_ru}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{pharmacy.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {pharmacy.is_24h && (
                      <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-none">24/7</span>
                    )}
                    {pharmacy.delivery_available && (
                      <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-none">
                        {language === 'en' ? 'Delivery' : 'Доставка'}
                      </span>
                    )}
                    {!pharmacy.is_active && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-none">
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
                    <DropdownMenuItem onClick={() => openEditDialog(pharmacy)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Edit' : 'Редактировать'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(pharmacy.id)}
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
                ? (language === 'en' ? 'Edit Pharmacy' : 'Редактировать аптеку')
                : (language === 'en' ? 'Add Pharmacy' : 'Добавить аптеку')}
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
                    placeholder="Pharmacy name"
                  />
                </div>
                <div>
                  <Label>Название (RU) *</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                    placeholder="Название аптеки"
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

              {/* Images */}
              <div>
                <Label>{language === 'en' ? 'Cover Image' : 'Обложка'}</Label>
                <ImageUpload
                  value={formData.cover_image}
                  onChange={(v) => setFormData({ ...formData, cover_image: v })}
                  folder="pharmacies"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Gallery' : 'Галерея'}</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(v) => setFormData({ ...formData, images: v })}
                  folder="pharmacies"
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
                  <Label>{language === 'en' ? 'Phone' : 'Телефон'}</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{language === 'en' ? 'Website' : 'Сайт'}</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              {/* License */}
              <div>
                <Label>{language === 'en' ? 'License Number' : 'Номер лицензии'}</Label>
                <Input
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                />
              </div>

              {/* Delivery Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Delivery Available' : 'Доставка доступна'}</Label>
                  <Switch
                    checked={formData.delivery_available}
                    onCheckedChange={(v) => setFormData({ ...formData, delivery_available: v })}
                  />
                </div>
                {formData.delivery_available && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>{language === 'en' ? 'Delivery Fee' : 'Стоимость доставки'}</Label>
                      <Input
                        type="number"
                        value={formData.delivery_fee}
                        onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>{language === 'en' ? 'Radius (km)' : 'Радиус (км)'}</Label>
                      <Input
                        type="number"
                        value={formData.delivery_radius_km}
                        onChange={(e) => setFormData({ ...formData, delivery_radius_km: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>{language === 'en' ? 'Min Order' : 'Мин. заказ'}</Label>
                      <Input
                        type="number"
                        value={formData.min_order_amount}
                        onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Open 24/7' : 'Работает 24/7'}</Label>
                  <Switch
                    checked={formData.is_24h}
                    onCheckedChange={(v) => setFormData({ ...formData, is_24h: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'en' ? 'Has Pharmacist' : 'Есть фармацевт'}</Label>
                  <Switch
                    checked={formData.has_pharmacist}
                    onCheckedChange={(v) => setFormData({ ...formData, has_pharmacist: v })}
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
              {language === 'en' ? 'Delete Pharmacy?' : 'Удалить аптеку?'}
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

export default AdminPharmacies;
