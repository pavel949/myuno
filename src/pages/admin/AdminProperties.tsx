import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useAdminProperties } from '@/hooks/useAdminContent';
import { VendorProperty } from '@/hooks/useVendorProperties';

import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { ProviderSelector } from '@/components/admin/ProviderSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CanonicalPropertyForm, CanonicalPropertyFormData } from '@/components/property/canonical-form';

const errorLog = createErrorHandler('AdminProperties');

export default function AdminProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const { properties, isLoading: propertiesLoading, createProperty, updateProperty, deleteProperty } = useAdminProperties(filterProviderId || undefined);
  
  // Redirect to unified property creation wizard instead of opening dialog
  React.useEffect(() => {
    if (searchParams.get('action') === 'new') {
      navigate('/owner/properties/new?context=admin&return=/admin/properties');
    }
  }, [searchParams, navigate]);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<VendorProperty | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  const isRussian = language === 'ru';

  // Handle edit query param
  React.useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && properties.length > 0) {
      const property = properties.find(p => p.id === editId);
      if (property) {
        openEditSheet(property);
      }
    }
  }, [searchParams, properties]);

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  React.useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  const openEditSheet = useCallback((property: VendorProperty) => {
    setEditingProperty(property);
    setSelectedProviderId(property.provider_id || '');
    setIsSheetOpen(true);
  }, []);

  const openNewSheet = useCallback(() => {
    setEditingProperty(null);
    setSelectedProviderId('');
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setEditingProperty(null);
    setSelectedProviderId('');
    // Clear edit param from URL
    if (searchParams.has('edit')) {
      navigate('/admin/properties', { replace: true });
    }
  }, [navigate, searchParams]);

  // Convert VendorProperty to CanonicalPropertyFormData for editing
  const getInitialFormData = useCallback((): CanonicalPropertyFormData => {
    if (!editingProperty) {
      return { provider_id: selectedProviderId };
    }

    const modes = (editingProperty as any).listing_modes?.length > 0 
      ? (editingProperty as any).listing_modes 
      : [editingProperty.listing_type || 'rent'];

    return {
      provider_id: editingProperty.provider_id || '',
      internal_name: editingProperty.internal_name || '',
      title_en: editingProperty.title_en,
      title_ru: editingProperty.title_ru || '',
      description_en: editingProperty.description_en || '',
      description_ru: editingProperty.description_ru || '',
      property_type: editingProperty.property_type,
      listing_modes: modes,
      listing_type: editingProperty.listing_type,
      price: editingProperty.price ?? undefined,
      price_per_night: editingProperty.price?.toString() || '',
      price_period: editingProperty.price_period || 'month',
      sale_price: (editingProperty as any).sale_price?.toString() || '',
      is_for_sale: modes.includes('sale'),
      bedrooms: editingProperty.bedrooms || 1,
      bathrooms: editingProperty.bathrooms || 1,
      area_sqm: editingProperty.area_sqm?.toString() || '',
      max_guests: editingProperty.max_guests || 2,
      min_stay_nights: editingProperty.min_stay_nights || 1,
      address: editingProperty.address || '',
      district: editingProperty.district || '',
      lat: editingProperty.lat ?? undefined,
      lng: editingProperty.lng ?? undefined,
      cover_image: editingProperty.cover_image || '',
      images: editingProperty.images || [],
      amenities: editingProperty.amenities || [],
      highlights: (editingProperty as any).highlights || [],
      instant_booking: (editingProperty as any).instant_booking ?? false,
      is_active: editingProperty.is_active ?? true,
    };
  }, [editingProperty, selectedProviderId]);

  const handleSubmit = async (data: CanonicalPropertyFormData) => {
    if (!data.title_en && !data.title) {
      toast.error(isRussian ? 'Введите название' : 'Enter title');
      return;
    }
    
    const providerId = data.provider_id || selectedProviderId;
    if (!providerId) {
      toast.error(isRussian ? 'Выберите провайдера' : 'Select provider');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build listing modes
      const listingModes = data.listing_modes || [];
      if (listingModes.length === 0) {
        if (data.is_for_sale) listingModes.push('sale');
        if (data.price_per_night || data.price) listingModes.push('rent');
        if (listingModes.length === 0) listingModes.push('rent');
      }

      const primaryListingType = listingModes.includes('sale') && !listingModes.includes('rent') 
        ? 'sale' 
        : 'rent';

      const propertyData: any = {
        provider_id: providerId,
        internal_name: data.internal_name || undefined,
        title_en: data.title_en || data.title || '',
        title_ru: data.title_ru || data.title_en || data.title || '',
        description_en: data.description_en || data.description || undefined,
        description_ru: data.description_ru || undefined,
        property_type: data.property_type || 'apartment',
        listing_type: primaryListingType,
        listing_modes: listingModes,
        price: data.price || (data.price_per_night ? parseFloat(data.price_per_night) : undefined),
        price_period: data.price_period || 'month',
        sale_price: data.sale_price ? parseFloat(data.sale_price) : undefined,
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
        cover_image: data.cover_image || undefined,
        images: data.images?.length ? data.images : undefined,
        amenities: data.amenities?.length ? data.amenities : undefined,
        highlights: data.highlights?.length ? data.highlights : undefined,
        instant_booking: data.instant_booking,
        is_active: data.is_active ?? true,
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
        const { error } = await updateProperty(editingProperty.id, propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект обновлён' : 'Property updated');
      } else {
        const { error } = await createProperty(propertyData);
        if (error) throw error;
        toast.success(isRussian ? 'Объект создан' : 'Property created');
      }

      closeSheet();
    } catch (error) {
      errorLog.error(error, 'save_property');
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
      errorLog.error(error, 'delete_property');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
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
          title={isRussian ? 'Управление недвижимостью' : 'Property Management'}
          showBack
        />

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
                {isRussian ? 'Добавьте недвижимость' : 'Add properties'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                variant="list"
                mode="admin"
                onView={() => openEditSheet(property)}
                onEdit={() => openEditSheet(property)}
                onDelete={() => setDeleteConfirmId(property.id)}
                showApprovalStatus
                showInstantBadge
              />
            ))}
          </div>
        )}

        {/* Canonical Property Form Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto max-h-screen flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {editingProperty 
                  ? (isRussian ? 'Редактировать объект' : 'Edit Property')
                  : (isRussian ? 'Новый объект' : 'New Property')}
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 flex-1 overflow-y-auto min-h-0">
              <CanonicalPropertyForm
                key={editingProperty?.id || 'new'}
                initialData={getInitialFormData()}
                onSubmit={handleSubmit}
                onCancel={closeSheet}
                isSubmitting={isSubmitting}
                mode="admin"
                providerSelector={
                  <ProviderSelector
                    value={selectedProviderId}
                    onChange={setSelectedProviderId}
                    label={isRussian ? 'Привязать к провайдеру' : 'Assign to Provider'}
                    required
                  />
                }
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRussian ? 'Удалить объект?' : 'Delete property?'}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              {isRussian 
                ? 'Это действие нельзя отменить.'
                : 'This action cannot be undone.'}
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
