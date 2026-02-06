import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit, Trash2, Image, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminBouquets, AdminBouquet, BouquetFormData } from '@/hooks/useAdminBouquets';
import { useAdminFlowers } from '@/hooks/useAdminContent';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { toast } from 'sonner';

interface FlowerShop {
  id: string;
  name_en: string;
  name_ru: string;
  delivery_fee: number | null;
  min_order_amount: number | null;
  provider_id: string | null;
}

const CATEGORIES = [
  { id: 'roses', labelEn: 'Roses', labelRu: 'Розы' },
  { id: 'mixed', labelEn: 'Mixed', labelRu: 'Микс' },
  { id: 'tulips', labelEn: 'Tulips', labelRu: 'Тюльпаны' },
  { id: 'peonies', labelEn: 'Peonies', labelRu: 'Пионы' },
  { id: 'orchids', labelEn: 'Orchids', labelRu: 'Орхидеи' },
  { id: 'premium', labelEn: 'Premium', labelRu: 'Премиум' },
];

const SIZES = [
  { id: 'S', labelEn: 'Small', labelRu: 'Маленький' },
  { id: 'M', labelEn: 'Medium', labelRu: 'Средний' },
  { id: 'L', labelEn: 'Large', labelRu: 'Большой' },
];

const STYLES = [
  { id: 'Classic', labelEn: 'Classic', labelRu: 'Классика' },
  { id: 'Romantic', labelEn: 'Romantic', labelRu: 'Романтика' },
  { id: 'Minimal', labelEn: 'Minimal', labelRu: 'Минимализм' },
  { id: 'Bright', labelEn: 'Bright', labelRu: 'Яркий' },
  { id: 'Luxury', labelEn: 'Luxury', labelRu: 'Люкс' },
  { id: 'Elegant', labelEn: 'Elegant', labelRu: 'Элегант' },
  { id: 'Soft', labelEn: 'Soft', labelRu: 'Нежный' },
];

const COLOR_PALETTES = [
  { id: 'Red', labelEn: 'Red', labelRu: 'Красный' },
  { id: 'Pink', labelEn: 'Pink', labelRu: 'Розовый' },
  { id: 'White', labelEn: 'White', labelRu: 'Белый' },
  { id: 'Yellow', labelEn: 'Yellow', labelRu: 'Жёлтый' },
  { id: 'Pastel', labelEn: 'Pastel', labelRu: 'Пастель' },
  { id: 'Mix', labelEn: 'Mix', labelRu: 'Микс' },
];

const OCCASION_TAGS = ['Love', 'Birthday', 'Anniversary', 'ThankYou', 'Sorry', 'Congratulations', 'Corporate', 'Proposal'];

const defaultFormData: BouquetFormData = {
  shop_id: '',
  sku: '',
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  composition_en: '',
  composition_ru: '',
  category: 'roses',
  image: '',
  images: [],
  price: 0,
  currency: 'THB',
  flowers: [],
  colors: [],
  size: 'M',
  style: 'Classic',
  occasion_tags: [],
  color_palette: 'Mix',
  lifeos_tags: [],
  availability_note: 'Flowers may be substituted with equivalent seasonal varieties while preserving style and value.',
  preparation_time_minutes: 90,
  is_popular: false,
  is_active: true,
  stock_quantity: null,
};

export default function AdminBouquets() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const { items, isLoading, createItem, updateItem, deleteItem } = useAdminBouquets();
  const { items: shops, isLoading: shopsLoading } = useAdminFlowers();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminBouquet | null>(null);
  const [formData, setFormData] = useState<BouquetFormData>(defaultFormData);

  // Handle URL params for provider-first workflow
  const urlProviderId = searchParams.get('provider');
  const urlAction = searchParams.get('action');

  // Auto-open dialog with provider context from URL
  useEffect(() => {
    if (urlAction === 'new' && !shopsLoading && shops.length > 0) {
      // If provider_id is passed, find matching shop
      if (urlProviderId) {
        const matchingShop = (shops as FlowerShop[]).find(s => s.provider_id === urlProviderId);
        if (matchingShop) {
          setFormData({ ...defaultFormData, shop_id: matchingShop.id });
        }
      }
      setEditingItem(null);
      setIsDialogOpen(true);
    }
  }, [urlAction, urlProviderId, shopsLoading, shops]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: AdminBouquet) => {
    setEditingItem(item);
    setFormData({
      shop_id: item.shop_id || '',
      sku: item.sku || '',
      name_en: item.name_en || '',
      name_ru: item.name_ru || '',
      description_en: item.description_en || '',
      description_ru: item.description_ru || '',
      composition_en: item.composition_en || '',
      composition_ru: item.composition_ru || '',
      category: item.category || 'roses',
      image: item.image || '',
      images: item.images || [],
      price: item.price || 0,
      currency: item.currency || 'THB',
      flowers: item.flowers || [],
      colors: item.colors || [],
      size: item.size || 'M',
      style: item.style || 'Classic',
      occasion_tags: item.occasion_tags || [],
      color_palette: item.color_palette || 'Mix',
      lifeos_tags: item.lifeos_tags || [],
      availability_note: item.availability_note || '',
      preparation_time_minutes: item.preparation_time_minutes || 90,
      is_popular: item.is_popular ?? false,
      is_active: item.is_active ?? true,
      stock_quantity: item.stock_quantity,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.name_ru || !formData.shop_id || !formData.price) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }

    try {
      if (editingItem) {
        await updateItem({ id: editingItem.id, ...formData });
        toast.success(isRussian ? 'Букет обновлён' : 'Bouquet updated');
      } else {
        await createItem(formData);
        toast.success(isRussian ? 'Букет создан' : 'Bouquet created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(isRussian ? 'Ошибка сохранения' : 'Save error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRussian ? 'Удалить букет?' : 'Delete bouquet?')) {
      await deleteItem(id);
      toast.success(isRussian ? 'Удалено' : 'Deleted');
    }
  };

  if (isLoading || shopsLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={isRussian ? 'Букеты' : 'Bouquets'}
        subtitle={isRussian ? `${items.length} товаров` : `${items.length} products`}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            {isRussian ? 'Добавить' : 'Add'}
          </Button>
        }
      />

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {items.map((item) => (
          <div key={item.id} className="bg-card border rounded-xl overflow-hidden">
            <div className="aspect-square relative">
              {item.image ? (
                <img src={item.image} alt={item.name_en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Image className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {item.is_popular && (
                  <Badge variant="default" className="bg-amber-500">
                    {isRussian ? 'Хит' : 'Popular'}
                  </Badge>
                )}
                <Badge variant={item.is_active ? 'default' : 'secondary'}>
                  {item.is_active ? (isRussian ? 'Активен' : 'Active') : (isRussian ? 'Скрыт' : 'Hidden')}
                </Badge>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold truncate">
                {isRussian ? item.name_ru : item.name_en}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {item.shop?.name_en || 'No shop'}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-bold text-primary">
                  {item.price?.toLocaleString()} {item.currency}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {isRussian ? 'Нет букетов. Добавьте первый!' : 'No bouquets. Add the first one!'}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? (isRussian ? 'Редактировать букет' : 'Edit Bouquet')
                : (isRussian ? 'Новый букет' : 'New Bouquet')
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Shop Selection */}
            <div className="space-y-2">
              <Label>{isRussian ? 'Магазин *' : 'Shop *'}</Label>
              <Select
                value={formData.shop_id}
                onValueChange={(v) => setFormData({ ...formData, shop_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRussian ? 'Выберите магазин' : 'Select shop'} />
                </SelectTrigger>
                <SelectContent>
                  {(shops as FlowerShop[]).map((shop) => (
                    <SelectItem key={shop.id} value={shop.id}>
                      {isRussian ? shop.name_ru : shop.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRussian ? 'Название EN *' : 'Name EN *'}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRussian ? 'Название RU *' : 'Name RU *'}</Label>
                <Input
                  value={formData.name_ru}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                />
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRussian ? 'Описание EN' : 'Description EN'}</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRussian ? 'Описание RU' : 'Description RU'}</Label>
                <Textarea
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isRussian ? 'Цена *' : 'Price *'}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRussian ? 'Категория' : 'Category'}</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isRussian ? cat.labelRu : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRussian ? 'Размер' : 'Size'}</Label>
                <Select
                  value={formData.size}
                  onValueChange={(v) => setFormData({ ...formData, size: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {isRussian ? size.labelRu : size.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>{isRussian ? 'Изображение' : 'Image'}</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                folder="bouquets"
              />
            </div>

            {/* Switches */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>{isRussian ? 'Активен' : 'Active'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_popular}
                  onCheckedChange={(v) => setFormData({ ...formData, is_popular: v })}
                />
                <Label>{isRussian ? 'Популярный' : 'Popular'}</Label>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full">
              {editingItem 
                ? (isRussian ? 'Сохранить' : 'Save')
                : (isRussian ? 'Создать' : 'Create')
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
