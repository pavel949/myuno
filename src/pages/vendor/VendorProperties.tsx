import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVendorProfile } from '@/hooks/useVendor';
import { useVendorProperties, VendorProperty } from '@/hooks/useVendorProperties';
import { useFormDraft } from '@/hooks/useFormDraft';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  Building2, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Bed,
  Bath,
  Ruler,
  MapPin,
  Zap,
} from 'lucide-react';
import { ApprovalStatusBadge } from '@/components/vendor/ApprovalStatusBadge';
import { DraftRestorationBanner } from '@/components/vendor';
import { CanonicalPropertyForm, CanonicalPropertyFormData } from '@/components/property/canonical-form';

const VendorProperties = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { profile, isLoading: profileLoading } = useVendorProfile();
  const { properties, isLoading: propertiesLoading, createProperty, updateProperty, deleteProperty } = useVendorProperties(profile?.id);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<VendorProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const isRussian = language === 'ru';

  // Draft management
  const {
    hasDraft,
    clearDraft,
    restoreDraft,
  } = useFormDraft<any>({
    key: 'vendor_property',
    initialData: {},
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate('/vendor/onboarding');
    }
  }, [profile, profileLoading, user, navigate]);

  useEffect(() => {
    if (hasDraft && !editingProperty && !isSheetOpen) {
      setShowDraftBanner(true);
    }
  }, []);

  const openEditSheet = useCallback((property: VendorProperty) => {
    setEditingProperty(property);
    setIsSheetOpen(true);
  }, []);

  const openNewSheet = useCallback(() => {
    setEditingProperty(null);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingProperty(null);
  }, []);

  // Convert VendorProperty to CanonicalPropertyFormData for editing
  const getInitialFormData = useCallback((): CanonicalPropertyFormData => {
    if (!editingProperty) {
      return {};
    }

    // Build deduped, cover-first images list — prevents the cover from
    // appearing twice when it's also persisted inside `images`.
    const cover = editingProperty.cover_image || '';
    const seen = new Set<string>();
    const images: string[] = [];
    if (cover) {
      images.push(cover);
      seen.add(cover);
    }
    for (const u of editingProperty.images || []) {
      if (u && !seen.has(u)) {
        images.push(u);
        seen.add(u);
      }
    }

    return {
      internal_name: (editingProperty as any).internal_name || '',
      title_en: editingProperty.title_en,
      title_ru: editingProperty.title_ru || '',
      description_en: editingProperty.description_en || '',
      description_ru: editingProperty.description_ru || '',
      property_type: editingProperty.property_type,
      listing_type: editingProperty.listing_type,
      price: editingProperty.price ?? undefined,
      price_per_night: editingProperty.price?.toString() || '',
      price_period: editingProperty.price_period || 'month',
      bedrooms: editingProperty.bedrooms || 1,
      bathrooms: editingProperty.bathrooms || 1,
      area_sqm: editingProperty.area_sqm?.toString() || '',
      max_guests: editingProperty.max_guests || 2,
      min_stay_nights: editingProperty.min_stay_nights || 1,
      address: editingProperty.address || '',
      district: editingProperty.district || '',
      lat: editingProperty.lat ?? undefined,
      lng: editingProperty.lng ?? undefined,
      cover_image: images[0] || '',
      images,
      amenities: editingProperty.amenities || [],
      instant_booking: (editingProperty as any).instant_booking ?? false,
      is_active: editingProperty.is_active ?? true,
    };
  }, [editingProperty]);

  const handleSubmit = async (data: CanonicalPropertyFormData) => {
    if (!data.title_en && !data.title) {
      toast.error(isRussian ? 'Введите название' : 'Enter title');
      return;
    }

    if (!data.price_per_night && !data.price) {
      toast.error(isRussian ? 'Укажите цену' : 'Set price');
      return;
    }

    setIsSubmitting(true);
    try {
      const propertyData: Partial<VendorProperty> = {
        title_en: data.title_en || data.title || '',
        title_ru: data.title_ru || data.title_en || data.title || '',
        description_en: data.description_en || data.description || undefined,
        description_ru: data.description_ru || undefined,
        property_type: data.property_type || 'apartment',
        listing_type: data.listing_type || (data.is_for_sale ? 'sale' : 'rent'),
        price: data.price || (data.price_per_night ? parseFloat(data.price_per_night) : undefined),
        price_period: data.price_period || 'month',
        currency: 'THB',
        bedrooms: data.bedrooms || 1,
        bathrooms: data.bathrooms || 1,
        area_sqm: data.area_sqm ? parseInt(String(data.area_sqm)) : undefined,
        max_guests: data.max_guests || 2,
        min_stay_nights: data.min_stay_nights || 1,
        address: data.address || undefined,
        district: data.district || undefined,
        lat: data.lat,
        lng: data.lng,
        cover_image: (data.images?.[0] ?? data.cover_image) || undefined,
        images: data.images?.length
          ? Array.from(new Set(data.images.filter(Boolean)))
          : undefined,
        amenities: data.amenities?.length ? data.amenities : undefined,
        is_active: data.is_active ?? true,
      };

      const dataWithExtras = {
        ...propertyData,
        instant_booking: data.instant_booking,
        internal_name: data.internal_name,
        // House rules from canonical form
        pets_allowed: data.pets_allowed,
        smoking_allowed: data.smoking_allowed,
        parties_allowed: data.parties_allowed,
        children_friendly: data.children_friendly,
        cancellation_policy: data.cancellation_policy,
        weekly_discount: data.weekly_discount,
        monthly_discount: data.monthly_discount,
        house_rules: data.house_rules,
        house_rules_ru: data.house_rules_ru,
        check_in_time: data.check_in_time,
        check_out_time: data.check_out_time,
        deposit_amount: data.deposit_amount ? parseFloat(data.deposit_amount) : undefined,
        view_type: data.view_type,
        furnishing_level: data.furnishing_level,
        equipment: data.equipment,
      };

      if (editingProperty) {
        const { error } = await updateProperty(editingProperty.id, dataWithExtras);
        if (error) throw error;
        toast.success(isRussian ? 'Объект обновлён' : 'Property updated');
      } else {
        const { error } = await createProperty(dataWithExtras);
        if (error) throw error;
        toast.success(isRussian ? 'Объект создан' : 'Property created');
      }

      closeSheet();
      clearDraft();
    } catch (error) {
      console.error('Error saving property:', error);
      toast.error(isRussian ? 'Ошибка при сохранении' : 'Error saving property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      const { error } = await deleteProperty(propertyId);
      if (error) throw error;
      toast.success(isRussian ? 'Объект удалён' : 'Property deleted');
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error(isRussian ? 'Ошибка при удалении' : 'Error deleting property');
    }
  };

  const formatPrice = (price: number, period?: string) => {
    const periodLabel = period === 'day' 
      ? (isRussian ? '/день' : '/day')
      : period === 'month'
        ? (isRussian ? '/мес' : '/mo')
        : period === 'year'
          ? (isRussian ? '/год' : '/yr')
          : '';
    return `฿${price.toLocaleString()}${periodLabel}`;
  };

  if (authLoading || profileLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!profile) return null;

  return (
    <PageContainer>
      {showDraftBanner && (
        <div className="mb-4">
          <DraftRestorationBanner
            onRestore={() => {
              restoreDraft();
              setShowDraftBanner(false);
              setIsSheetOpen(true);
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
        onClick={openNewSheet}
      >
        <Plus className="h-4 w-4 mr-2" />
        {isRussian ? 'Добавить объект' : 'Add Property'}
      </Button>

      {propertiesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">
              {isRussian ? 'Нет объектов' : 'No properties'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Добавьте свою недвижимость' : 'Add your properties'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {properties.map((property) => (
            <Card key={property.id} className={!property.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {property.cover_image ? (
                    <img 
                      src={property.cover_image} 
                      alt={property.title_en}
                      className="w-20 h-20 rounded-none object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-none bg-muted flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {isRussian ? property.title_ru : property.title_en}
                          </h3>
                          {(property as any).instant_booking && (
                            <Badge className="bg-warning text-warning-foreground text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              {isRussian ? 'Мгновенно' : 'Instant'}
                            </Badge>
                          )}
                          <ApprovalStatusBadge 
                            status={(property as any).approval_status} 
                            rejectionReason={(property as any).rejection_reason}
                          />
                          {!property.is_active && (
                            <Badge variant="outline" className="text-xs">
                              {isRussian ? 'Неактивен' : 'Inactive'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-1">
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms}
                          </span>
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms}
                          </span>
                          {property.area_sqm && (
                            <span className="flex items-center gap-1">
                              <Ruler className="h-3 w-3" />
                              {property.area_sqm}м²
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">
                            {property.price && formatPrice(property.price, property.price_period)}
                          </span>
                          {property.district && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.district}
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
                          <DropdownMenuItem onClick={() => openEditSheet(property)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {isRussian ? 'Редактировать' : 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteConfirmId(property.id)}
                            className="text-destructive"
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

      {/* Canonical Property Form Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingProperty 
                ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                : (isRussian ? 'Новый объект' : 'New Property')}
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6">
            <CanonicalPropertyForm
              key={editingProperty?.id || 'new'}
              initialData={getInitialFormData()}
              onSubmit={handleSubmit}
              onCancel={closeSheet}
              isSubmitting={isSubmitting}
              mode="vendor"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isRussian ? 'Удалить объект?' : 'Delete property?'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {isRussian ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {isRussian ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              {isRussian ? 'Удалить' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default VendorProperties;
