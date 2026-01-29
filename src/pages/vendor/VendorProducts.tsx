import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useVendorProducts, VendorProduct } from '@/hooks/useVendorProducts';
import { useVendorProfile } from '@/hooks/useVendor';
import { useMarketplaceCategories } from '@/hooks/useMarketplaceCategories';
import { useFormDraft } from '@/hooks/useFormDraft';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Image,
  Settings,
  Eye,
  FileText,
  Tag,
  DollarSign
} from 'lucide-react';
import { ImageUpload, MultiImageUpload } from '@/components/upload/ImageUpload';
import { ApprovalStatusBadge, ApprovalStatus } from '@/components/vendor/ApprovalStatusBadge';
import {
  VendorFormWizard,
  WizardStepContent,
  VendorFormSection,
  CompactField,
  DraftIndicator,
  DraftRestorationBanner,
  CardPreview,
  CardPreviewSection,
} from '@/components/vendor';

interface ProductFormData {
  name_en: string;
  name_ru: string;
  description_en: string;
  description_ru: string;
  category_slug: string;
  subcategory: string;
  cover_image: string;
  images: string[];
  price: string;
  original_price: string;
  currency: string;
  unit: string;
  unit_ru: string;
  in_stock: boolean;
  is_popular: boolean;
  is_new: boolean;
  tags: string;
  weight_kg: string;
  is_shippable_international: boolean;
}

const initialFormData: ProductFormData = {
  name_en: '',
  name_ru: '',
  description_en: '',
  description_ru: '',
  category_slug: '',
  subcategory: '',
  cover_image: '',
  images: [],
  price: '',
  original_price: '',
  currency: 'THB',
  unit: 'pc',
  unit_ru: 'шт',
  in_stock: true,
  is_popular: false,
  is_new: true,
  tags: '',
  weight_kg: '',
  is_shippable_international: false,
};

const VendorProducts = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { hasRole } = useUserContext();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { categories, isLoading: categoriesLoading } = useMarketplaceCategories();
  
  // Get marketplace_vendor_id from provider profile
  const marketplaceVendorId = (profile as any)?.marketplace_vendor_id;
  const { products, isLoading: productsLoading, createProduct, updateProduct, deleteProduct } = useVendorProducts(marketplaceVendorId);
  
  const isAdmin = hasRole('admin');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const isRussian = language === 'ru';

  const {
    formData,
    setFormData,
    updateField,
    hasDraft,
    lastSaved,
    clearDraft,
    resetForm: resetDraft,
    restoreDraft,
  } = useFormDraft<ProductFormData>({
    key: 'vendor_product',
    initialData: initialFormData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const wizardSteps = useMemo(() => [
    { 
      id: 'basic', 
      title: 'Basic Info', 
      titleRu: 'Основное',
      icon: <FileText className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name_en.trim()) {
          newErrors.name_en = isRussian ? 'Обязательное поле' : 'Required field';
        }
        if (!formData.category_slug) {
          newErrors.category_slug = isRussian ? 'Выберите категорию' : 'Select category';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : 'Validation failed';
      }
    },
    { 
      id: 'details', 
      title: 'Details', 
      titleRu: 'Детали',
      icon: <Settings className="h-4 w-4" />,
      validate: () => {
        const newErrors: Record<string, string> = {};
        if (!formData.price) {
          newErrors.price = isRussian ? 'Укажите цену' : 'Set price';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 ? null : 'Validation failed';
      }
    },
    { 
      id: 'photos', 
      title: 'Photos', 
      titleRu: 'Фото',
      icon: <Image className="h-4 w-4" />,
      validate: () => null
    },
    { 
      id: 'review', 
      title: 'Review', 
      titleRu: 'Проверка',
      icon: <Eye className="h-4 w-4" />,
      validate: () => null
    },
  ], [formData, isRussian]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (hasDraft && !editingProduct && !isDialogOpen) {
      setShowDraftBanner(true);
    }
  }, []);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingProduct(null);
    setCurrentStep(0);
    setErrors({});
    clearDraft();
  };

  const openEditDialog = (product: VendorProduct) => {
    setEditingProduct(product);
    setFormData({
      name_en: product.name_en,
      name_ru: product.name_ru || '',
      description_en: product.description_en || '',
      description_ru: product.description_ru || '',
      category_slug: product.category_slug || '',
      subcategory: product.subcategory || '',
      cover_image: product.cover_image || '',
      images: product.images || [],
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      currency: product.currency || 'THB',
      unit: product.unit || 'pc',
      unit_ru: product.unit_ru || 'шт',
      in_stock: product.in_stock ?? true,
      is_popular: product.is_popular ?? false,
      is_new: product.is_new ?? false,
      tags: product.tags?.join(', ') || '',
      weight_kg: product.weight_kg?.toString() || '',
      is_shippable_international: product.is_shippable_international ?? false,
    });
    setCurrentStep(0);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name_en || !formData.price || !formData.category_slug) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Please fill required fields');
      return;
    }

    if (!marketplaceVendorId) {
      toast.error(isRussian ? 'Профиль продавца не настроен. Обратитесь в поддержку.' : 'Marketplace vendor profile not set up. Contact support.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productData: Partial<VendorProduct> = {
        name_en: formData.name_en,
        name_ru: formData.name_ru || formData.name_en,
        description_en: formData.description_en || null,
        description_ru: formData.description_ru || null,
        category_slug: formData.category_slug,
        subcategory: formData.subcategory || null,
        cover_image: formData.cover_image || null,
        images: formData.images.length > 0 ? formData.images : null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        currency: formData.currency,
        unit: formData.unit,
        unit_ru: formData.unit_ru,
        in_stock: formData.in_stock,
        is_popular: formData.is_popular,
        is_new: formData.is_new,
        is_active: true,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : 0,
        is_shippable_international: formData.is_shippable_international,
      };

      if (editingProduct) {
        const updateData = isAdmin 
          ? productData 
          : { ...productData, approval_status: 'pending' };
        const { error } = await updateProduct(editingProduct.id, updateData);
        if (error) throw error;
        toast.success(isRussian 
          ? (isAdmin ? 'Товар обновлён' : 'Товар обновлён и отправлен на модерацию') 
          : (isAdmin ? 'Product updated' : 'Product updated and sent for moderation'));
      } else {
        const { error } = await createProduct({ 
          ...productData, 
          vendor_id: marketplaceVendorId,
          approval_status: isAdmin ? 'approved' : 'pending'
        });
        if (error) throw error;
        toast.success(isRussian 
          ? (isAdmin ? 'Товар добавлен' : 'Товар добавлен и отправлен на модерацию') 
          : (isAdmin ? 'Product added' : 'Product added and sent for moderation'));
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await deleteProduct(productId);
      if (error) throw error;
      toast.success(isRussian ? 'Товар удалён' : 'Product deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting product');
    }
  };

  const getCategoryName = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat ? (isRussian ? cat.name_ru : cat.name_en) : slug;
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

  if (!profile) {
    return (
      <AppLayout>
        <PageContainer>
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Профиль не найден' : 'Profile not found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Пожалуйста, настройте ваш профиль вендора' : 'Please set up your vendor profile first'}
              </p>
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!marketplaceVendorId) {
    return (
      <AppLayout>
        <PageContainer>
          <PageHeader 
            title={isRussian ? 'Мои товары' : 'My Products'}
            showBack
          />
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Профиль продавца не настроен' : 'Marketplace profile not set up'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian 
                  ? 'Для продажи товаров необходимо подключить профиль маркетплейса.' 
                  : 'To sell products, you need to set up your marketplace vendor profile.'}
              </p>
              <Button onClick={() => navigate('/vendor/onboarding')}>
                {isRussian ? 'Настроить профиль' : 'Set Up Profile'}
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRussian ? 'Мои товары' : 'My Products'}
          showBack
        />

        {showDraftBanner && (
          <div className="mb-4">
            <DraftRestorationBanner
              onRestore={() => {
                restoreDraft();
                setShowDraftBanner(false);
                setIsDialogOpen(true);
              }}
              onDiscard={() => {
                clearDraft();
                setShowDraftBanner(false);
              }}
            />
          </div>
        )}

        <Button 
          className="w-full mb-4" 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRussian ? 'Добавить товар' : 'Add Product'}
        </Button>

        {productsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">
                {isRussian ? 'Нет товаров' : 'No products'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Добавьте свой первый товар' : 'Add your first product'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {product.cover_image ? (
                      <img 
                        src={product.cover_image} 
                        alt={product.name_en}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">
                              {isRussian ? product.name_ru : product.name_en}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryName(product.category_slug)}
                            </Badge>
                            <ApprovalStatusBadge 
                              status={product.approval_status as ApprovalStatus} 
                              rejectionReason={product.rejection_reason}
                            />
                            {product.is_new && (
                              <Badge className="text-xs bg-info">
                                {isRussian ? 'Новинка' : 'New'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {product.price} {product.currency}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Tag className="h-3 w-3" />
                              {product.in_stock ? (isRussian ? 'В наличии' : 'In stock') : (isRussian ? 'Нет' : 'Out')}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {isRussian ? 'Редактировать' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteConfirmId(product.id)}
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open && !isSubmitting) {
            setIsDialogOpen(false);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingProduct 
                  ? (isRussian ? 'Редактировать товар' : 'Edit Product')
                  : (isRussian ? 'Добавить товар' : 'Add Product')
                }
              </DialogTitle>
              {hasDraft && (
                <DraftIndicator 
                  hasDraft={hasDraft}
                  lastSaved={lastSaved} 
                  onClear={clearDraft}
                  onRestore={restoreDraft}
                />
              )}
            </DialogHeader>

            <VendorFormWizard
              steps={wizardSteps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Save Product"
              submitLabelRu="Сохранить товар"
              className="flex-1 overflow-hidden"
            >
              {/* Step 1: Basic Info */}
              <WizardStepContent stepId="basic" currentStepId={wizardSteps[currentStep].id}>
                <div className="space-y-4">
                  <VendorFormSection title={isRussian ? 'Название' : 'Name'}>
                    <CompactField
                      label={isRussian ? 'Название (EN) *' : 'Name (EN) *'}
                      error={errors.name_en}
                    >
                      <Input
                        value={formData.name_en}
                        onChange={(e) => updateField('name_en', e.target.value)}
                        placeholder="Product name in English"
                      />
                    </CompactField>
                    <CompactField label={isRussian ? 'Название (RU)' : 'Name (RU)'}>
                      <Input
                        value={formData.name_ru}
                        onChange={(e) => updateField('name_ru', e.target.value)}
                        placeholder="Название товара на русском"
                      />
                    </CompactField>
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Категория' : 'Category'}>
                    <CompactField
                      label={isRussian ? 'Категория *' : 'Category *'}
                      error={errors.category_slug}
                    >
                      <Select
                        value={formData.category_slug}
                        onValueChange={(value) => updateField('category_slug', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isRussian ? 'Выберите категорию' : 'Select category'} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.slug} value={cat.slug}>
                              {isRussian ? cat.name_ru : cat.name_en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CompactField>
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Описание' : 'Description'}>
                    <CompactField label={isRussian ? 'Описание (EN)' : 'Description (EN)'}>
                      <Textarea
                        value={formData.description_en}
                        onChange={(e) => updateField('description_en', e.target.value)}
                        placeholder="Product description in English"
                        rows={3}
                      />
                    </CompactField>
                    <CompactField label={isRussian ? 'Описание (RU)' : 'Description (RU)'}>
                      <Textarea
                        value={formData.description_ru}
                        onChange={(e) => updateField('description_ru', e.target.value)}
                        placeholder="Описание товара на русском"
                        rows={3}
                      />
                    </CompactField>
                  </VendorFormSection>
                </div>
              </WizardStepContent>

              {/* Step 2: Details */}
              <WizardStepContent stepId="details" currentStepId={wizardSteps[currentStep].id}>
                <div className="space-y-4">
                  <VendorFormSection title={isRussian ? 'Цена' : 'Pricing'}>
                    <div className="grid grid-cols-2 gap-4">
                      <CompactField
                        label={isRussian ? 'Цена *' : 'Price *'}
                        error={errors.price}
                      >
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => updateField('price', e.target.value)}
                          placeholder="0"
                        />
                      </CompactField>
                      <CompactField label={isRussian ? 'Старая цена' : 'Original price'}>
                        <Input
                          type="number"
                          value={formData.original_price}
                          onChange={(e) => updateField('original_price', e.target.value)}
                          placeholder="0"
                        />
                      </CompactField>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <CompactField label={isRussian ? 'Единица (EN)' : 'Unit (EN)'}>
                        <Input
                          value={formData.unit}
                          onChange={(e) => updateField('unit', e.target.value)}
                          placeholder="pc"
                        />
                      </CompactField>
                      <CompactField label={isRussian ? 'Единица (RU)' : 'Unit (RU)'}>
                        <Input
                          value={formData.unit_ru}
                          onChange={(e) => updateField('unit_ru', e.target.value)}
                          placeholder="шт"
                        />
                      </CompactField>
                    </div>
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Наличие' : 'Availability'}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'В наличии' : 'In stock'}</Label>
                        <Switch
                          checked={formData.in_stock}
                          onCheckedChange={(checked) => updateField('in_stock', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Новинка' : 'New arrival'}</Label>
                        <Switch
                          checked={formData.is_new}
                          onCheckedChange={(checked) => updateField('is_new', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Популярное' : 'Popular'}</Label>
                        <Switch
                          checked={formData.is_popular}
                          onCheckedChange={(checked) => updateField('is_popular', checked)}
                        />
                      </div>
                    </div>
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Доставка' : 'Shipping'}>
                    <CompactField label={isRussian ? 'Вес (кг)' : 'Weight (kg)'}>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.weight_kg}
                        onChange={(e) => updateField('weight_kg', e.target.value)}
                        placeholder="0.5"
                      />
                    </CompactField>
                    <div className="flex items-center justify-between pt-2">
                      <Label>{isRussian ? 'Международная доставка' : 'International shipping'}</Label>
                      <Switch
                        checked={formData.is_shippable_international}
                        onCheckedChange={(checked) => updateField('is_shippable_international', checked)}
                      />
                    </div>
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Теги' : 'Tags'}>
                    <CompactField label={isRussian ? 'Теги (через запятую)' : 'Tags (comma separated)'}>
                      <Input
                        value={formData.tags}
                        onChange={(e) => updateField('tags', e.target.value)}
                        placeholder="organic, handmade, eco"
                      />
                    </CompactField>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isRussian ? 'Помогают в поиске товара' : 'Help with product search'}
                    </p>
                  </VendorFormSection>
                </div>
              </WizardStepContent>

              {/* Step 3: Photos */}
              <WizardStepContent stepId="photos" currentStepId={wizardSteps[currentStep].id}>
                <div className="space-y-4">
                  <VendorFormSection title={isRussian ? 'Обложка' : 'Cover Image'}>
                    <ImageUpload
                      value={formData.cover_image}
                      onChange={(url) => updateField('cover_image', url)}
                      folder="products"
                    />
                  </VendorFormSection>

                  <VendorFormSection title={isRussian ? 'Галерея' : 'Gallery'}>
                    <MultiImageUpload
                      value={formData.images}
                      onChange={(urls) => updateField('images', urls)}
                      folder="products"
                      maxImages={6}
                    />
                  </VendorFormSection>
                </div>
              </WizardStepContent>

              {/* Step 4: Review */}
              <WizardStepContent stepId="review" currentStepId={wizardSteps[currentStep].id}>
                <CardPreviewSection>
                  <CardPreview 
                    type="service"
                    image={formData.cover_image}
                    title={formData.name_en}
                    titleRu={formData.name_ru}
                    description={formData.description_en}
                    descriptionRu={formData.description_ru}
                    price={formData.price ? parseFloat(formData.price) : undefined}
                  />
                </CardPreviewSection>

                <VendorFormSection title={isRussian ? 'Сводка' : 'Summary'} className="mt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRussian ? 'Название' : 'Name'}:</span>
                      <span>{formData.name_en || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRussian ? 'Категория' : 'Category'}:</span>
                      <span>{getCategoryName(formData.category_slug) || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRussian ? 'Цена' : 'Price'}:</span>
                      <span>{formData.price ? `${formData.price} ${formData.currency}` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRussian ? 'В наличии' : 'In stock'}:</span>
                      <span>{formData.in_stock ? '✓' : '✗'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{isRussian ? 'Фото' : 'Photos'}:</span>
                      <span>{(formData.cover_image ? 1 : 0) + formData.images.length}</span>
                    </div>
                  </div>
                </VendorFormSection>
              </WizardStepContent>
            </VendorFormWizard>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRussian ? 'Удалить товар?' : 'Delete product?'}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить. Товар будет удалён навсегда.'
                : 'This action cannot be undone. The product will be permanently deleted.'}
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {isRussian ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                {isRussian ? 'Удалить' : 'Delete'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
};

export default VendorProducts;
