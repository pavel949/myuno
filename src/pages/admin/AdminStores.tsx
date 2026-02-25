import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminStores, AdminStore } from '@/hooks/useAdminStores';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { Plus, MoreVertical, Pencil, Trash2, Store } from 'lucide-react';
import { toast } from 'sonner';

const storeCategories = [
  { value: 'grocery', label: 'Grocery', labelRu: 'Продукты' },
  { value: 'electronics', label: 'Electronics', labelRu: 'Электроника' },
  { value: 'fashion', label: 'Fashion', labelRu: 'Одежда' },
  { value: 'home', label: 'Home & Garden', labelRu: 'Дом и сад' },
  { value: 'beauty', label: 'Beauty', labelRu: 'Красота' },
  { value: 'sports', label: 'Sports', labelRu: 'Спорт' },
  { value: 'toys', label: 'Toys', labelRu: 'Игрушки' },
  { value: 'pets', label: 'Pet Supplies', labelRu: 'Зоотовары' },
  { value: 'other', label: 'Other', labelRu: 'Другое' },
];

interface StoreFormData {
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  category: string;
  cover_image: string;
  images: string[];
  address: string;
  phone: string;
  delivery_available: boolean;
  delivery_fee: number;
  min_order_amount: number;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
}

const defaultFormData: StoreFormData = {
  provider_id: null,
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  category: 'grocery',
  cover_image: '',
  images: [],
  address: '',
  phone: '',
  delivery_available: true,
  delivery_fee: 0,
  min_order_amount: 0,
  is_active: true,
  is_verified: false,
  is_featured: false,
};

const AdminStores = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterProviderId = searchParams.get('provider') || undefined;
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const { stores, isLoading, createStore, updateStore, deleteStore } = useAdminStores(filterProviderId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminStore | null>(null);
  const [formData, setFormData] = useState<StoreFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (authLoading || adminLoading) {
    return (
      <PageContainer>
        <PageHeader title="Stores" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    navigate('/auth');
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

  const openEditDialog = (item: AdminStore) => {
    setEditingItem(item);
    setFormData({
      provider_id: item.provider_id,
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      category: item.category || 'grocery',
      cover_image: item.cover_image || '',
      images: item.images || [],
      address: item.address || '',
      phone: item.phone || '',
      delivery_available: item.delivery_available ?? true,
      delivery_fee: item.delivery_fee || 0,
      min_order_amount: item.min_order_amount || 0,
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
        await updateStore(editingItem.id, formData);
      } else {
        await createStore(formData);
      }
      setIsDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStore(id);
    setDeleteConfirmId(null);
  };

  const getCategoryLabel = (cat: string) => {
    const found = storeCategories.find((c) => c.value === cat);
    return found ? (language === 'en' ? found.label : found.labelRu) : cat;
  };

  return (
    <PageContainer>
      <PageHeader
        title={language === 'en' ? 'Stores' : 'Магазины'}
        actions={
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Add Store' : 'Добавить магазин'}
          </Button>
        }
      />

      {!filterProviderId && (
        <div className="mb-4">
          <ProviderSelector
            value=""
            onChange={(v) => navigate(v ? `/admin/stores?provider=${v}` : '/admin/stores')}
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
      ) : stores.length === 0 ? (
        <Card className="p-8 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {language === 'en' ? 'No stores found' : 'Магазины не найдены'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <Card key={store.id} className="p-4">
              <div className="flex items-start gap-4">
                {store.cover_image && (
                  <img
                    src={store.cover_image}
                    alt={store.name_en}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {language === 'en' ? store.name_en : store.name_ru}
                  </h3>
                  <p className="text-sm text-muted-foreground">{getCategoryLabel(store.category)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {store.is_featured && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded">
                        {language === 'en' ? 'Featured' : 'Рекомендуемый'}
                      </span>
                    )}
                    {store.delivery_available && (
                      <span className="text-xs bg-info/10 text-info px-2 py-0.5 rounded">
                        {language === 'en' ? 'Delivery' : 'Доставка'}
                      </span>
                    )}
                    {!store.is_active && (
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
                    <DropdownMenuItem onClick={() => openEditDialog(store)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {language === 'en' ? 'Edit' : 'Редактировать'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteConfirmId(store.id)}
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
                ? (language === 'en' ? 'Edit Store' : 'Редактировать магазин')
                : (language === 'en' ? 'Add Store' : 'Добавить магазин')}
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

              {/* Category */}
              <div>
                <Label>{language === 'en' ? 'Category' : 'Категория'}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === 'en' ? cat.label : cat.labelRu}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name (EN) *</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="Store name"
                  />
                </div>
                <div>
                  <Label>Название (RU) *</Label>
                  <Input
                    value={formData.name_ru}
                    onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                    placeholder="Название магазина"
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
                  folder="stores"
                />
              </div>
              <div>
                <Label>{language === 'en' ? 'Gallery' : 'Галерея'}</Label>
                <MultiImageUpload
                  value={formData.images}
                  onChange={(v) => setFormData({ ...formData, images: v })}
                  folder="stores"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>{language === 'en' ? 'Delivery Fee' : 'Стоимость доставки'}</Label>
                      <Input
                        type="number"
                        value={formData.delivery_fee}
                        onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
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
              {language === 'en' ? 'Delete Store?' : 'Удалить магазин?'}
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

export default AdminStores;
