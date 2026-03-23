/**
 * Centralized Content Adapters
 * Single Source of Truth for mapping database records to card component props
 * Ensures 100% consistency between vendor/admin forms and public-facing cards
 */

import { MarketplaceProduct } from '@/types/marketplace';
import { Service } from '@/hooks/useServices';
import { HomeServiceProvider } from '@/hooks/useHomeServices';
import type { OwnerProperty, VendorProperty } from '@/types/property';
import { getCurrencySymbol } from '@/lib/config/currencies';

// ============= UNIFIED CARD PROPS =============

export interface UnifiedProductCardProps {
  variant: 'product';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  images?: string[];
  price: string;
  originalPrice?: string;
  discount?: number;
  currency: string;
  rating?: number | null;
  reviewCount?: number;
  isNew?: boolean;
  isPopular?: boolean;
  inStock?: boolean;
  unit?: string;
  tags?: string[];
}

export interface UnifiedServiceCardProps {
  variant: 'service';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  images?: string[];
  price?: string;
  currency: string;
  duration?: string;
  durationMinutes?: number;
  rating?: number | null;
  reviewCount?: number | null;
  languages?: string[];
  providerName?: string;
  providerLogo?: string | null;
  isVerified?: boolean;
  hasMachineTranslation?: boolean;
  categorySlug?: string;
}

export interface HomeServiceProviderCardProps {
  id: string;
  name: string;
  description?: string;
  category: string;
  categoryLabel?: string;
  categoryIcon?: string;
  logoUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  isVerified?: boolean;
  providerType: 'individual' | 'company';
  responseTimeMinutes?: number | null;
  hasInsurance?: boolean;
  hasGuarantee?: boolean;
  languages?: string[];
  serviceDomains?: string[];
  phone?: string | null;
  email?: string | null;
}

// ============= PRODUCT ADAPTERS =============

/**
 * Maps a MarketplaceProduct to unified card props
 * Used by: ProductCard, VendorProducts preview, Admin product preview
 */
export function mapProductToCardProps(
  product: Partial<MarketplaceProduct> & { name_en: string; price: number },
  language: string
): UnifiedProductCardProps {
  const isRu = language === 'ru';
  
  const price = product.price || 0;
  const originalPrice = product.original_price || null;
  const discount = originalPrice && originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return {
    variant: 'product',
    id: product.id || 'preview',
    title: isRu ? (product.name_ru || product.name_en) : product.name_en,
    subtitle: isRu ? (product.vendor_name_ru || product.vendor_name || undefined) : (product.vendor_name || undefined),
    description: isRu ? (product.description_ru || product.description_en || undefined) : (product.description_en || undefined),
    image: product.cover_image || undefined,
    images: product.images || undefined,
    price: `${getCurrencySymbol(product.currency || 'THB')}${price.toLocaleString()}`,
    originalPrice: originalPrice ? `${getCurrencySymbol(product.currency || 'THB')}${originalPrice.toLocaleString()}` : undefined,
    discount: discount > 0 ? discount : undefined,
    currency: product.currency || 'THB',
    rating: product.rating,
    reviewCount: product.review_count,
    isNew: product.is_new,
    isPopular: product.is_popular,
    inStock: product.in_stock,
    unit: isRu ? (product.unit_ru || product.unit) : product.unit,
    tags: product.tags || undefined,
  };
}

/**
 * Maps form data to product card props for live preview
 * Used by: VendorProducts wizard preview step
 */
export function mapProductFormToCardProps(
  formData: {
    name_en: string;
    name_ru?: string;
    description_en?: string;
    description_ru?: string;
    cover_image?: string;
    images?: string[];
    price?: string;
    original_price?: string;
    currency?: string;
    unit?: string;
    unit_ru?: string;
    is_new?: boolean;
    is_popular?: boolean;
    in_stock?: boolean;
    tags?: string;
  },
  language: string
): UnifiedProductCardProps {
  const price = parseFloat(formData.price || '0') || 0;
  const originalPrice = parseFloat(formData.original_price || '0') || 0;
  
  return mapProductToCardProps({
    name_en: formData.name_en,
    name_ru: formData.name_ru || formData.name_en,
    description_en: formData.description_en || null,
    description_ru: formData.description_ru || null,
    cover_image: formData.cover_image || null,
    images: formData.images || null,
    price,
    original_price: originalPrice || null,
    currency: formData.currency || 'THB',
    unit: formData.unit || 'pc',
    unit_ru: formData.unit_ru || 'шт',
    is_new: formData.is_new ?? false,
    is_popular: formData.is_popular ?? false,
    in_stock: formData.in_stock ?? true,
    tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
  } as MarketplaceProduct, language);
}

// ============= SERVICE ADAPTERS =============

/**
 * Maps a Service to unified card props
 * Used by: ServiceCard, VendorServices preview, Admin service preview
 */
export function mapServiceToCardProps(
  service: Partial<Service> & { name_en: string },
  language: string
): UnifiedServiceCardProps {
  const isRu = language === 'ru';

  return {
    variant: 'service',
    id: service.id || 'preview',
    title: isRu ? (service.name_ru || service.name_en) : service.name_en,
    subtitle: service.provider?.name,
    description: isRu ? (service.description_ru || service.description_en || undefined) : (service.description_en || undefined),
    image: service.images?.[0],
    images: service.images || undefined,
    price: service.price ? `${getCurrencySymbol(service.currency || 'THB')}${service.price.toLocaleString()}` : undefined,
    currency: service.currency || 'THB',
    duration: service.duration_minutes ? `${service.duration_minutes} ${isRu ? 'мин' : 'min'}` : undefined,
    durationMinutes: service.duration_minutes || undefined,
    rating: service.rating,
    reviewCount: service.review_count,
    languages: service.languages,
    providerName: service.provider?.name,
    providerLogo: service.provider?.logo_url,
    isVerified: service.provider?.is_verified,
    hasMachineTranslation: service.provider?.has_machine_translation,
    categorySlug: service.category?.slug,
  };
}

/**
 * Maps service form data to card props for live preview
 */
export function mapServiceFormToCardProps(
  formData: {
    name_en: string;
    name_ru?: string;
    description_en?: string;
    description_ru?: string;
    images?: string[];
    price?: string | number;
    currency?: string;
    duration_minutes?: string | number;
  },
  language: string,
  providerInfo?: { name?: string; logo_url?: string | null; is_verified?: boolean }
): UnifiedServiceCardProps {
  const price = typeof formData.price === 'string' 
    ? parseFloat(formData.price) || null 
    : formData.price;
  const duration = typeof formData.duration_minutes === 'string'
    ? parseInt(formData.duration_minutes) || null
    : formData.duration_minutes;

  return mapServiceToCardProps({
    name_en: formData.name_en,
    name_ru: formData.name_ru || formData.name_en,
    description_en: formData.description_en || null,
    description_ru: formData.description_ru || null,
    images: formData.images || null,
    price,
    currency: formData.currency || 'THB',
    duration_minutes: duration,
    provider: providerInfo ? {
      name: providerInfo.name || '',
      logo_url: providerInfo.logo_url || null,
      is_verified: providerInfo.is_verified || false,
    } : undefined,
  } as Service, language);
}

// ============= HOME SERVICE PROVIDER ADAPTERS =============

/**
 * Maps a HomeServiceProvider to card props
 * Used by: HomeServiceProviderCard, AdminProviders preview
 */
export function mapHomeServiceProviderToCardProps(
  provider: HomeServiceProvider,
  language: string,
  categoryInfo?: { labelEn: string; labelRu: string; icon: string }
): HomeServiceProviderCardProps {
  const isRu = language === 'ru';

  return {
    id: provider.id,
    name: provider.name,
    description: isRu ? (provider.description_ru || provider.description_en || undefined) : (provider.description_en || undefined),
    category: provider.business_category,
    categoryLabel: categoryInfo ? (isRu ? categoryInfo.labelRu : categoryInfo.labelEn) : provider.business_category,
    categoryIcon: categoryInfo?.icon,
    logoUrl: provider.logo_url,
    rating: provider.rating,
    reviewCount: provider.review_count,
    isVerified: provider.is_verified ?? false,
    providerType: (provider.provider_type as 'individual' | 'company') || 'company',
    responseTimeMinutes: provider.response_time_minutes,
    hasInsurance: provider.has_insurance ?? false,
    hasGuarantee: provider.has_guarantee ?? false,
    languages: [], // TODO: Add languages field to providers table
    serviceDomains: provider.service_domains || [],
    phone: provider.phone,
    email: provider.email,
  };
}

// ============= PROPERTY ADAPTERS =============

export interface UnifiedPropertyCardProps {
  variant: 'property';
  id: string;
  title: string;
  titleRu?: string;
  internalName?: string;
  propertyType?: string;
  coverImage?: string;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  areaSqm?: number;
  district?: string;
  address?: string;
  price?: number;
  pricePerNight?: number;
  pricePeriod?: string;
  currency: string;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  instantBooking?: boolean;
  approvalStatus?: string;
  marketplacePropertyId?: string | null;
  highlights?: string[];
  // Type-specific fields
  floor?: number;
  unitNumber?: string;
  plotSizeSqm?: number;
  poolType?: string;
  totalFloors?: number;
}

/**
 * Type guard to check if property is OwnerProperty
 */
function isOwnerProperty(property: OwnerProperty | VendorProperty): property is OwnerProperty {
  return 'title' in property && !('title_en' in property);
}

/**
 * Maps an OwnerProperty or VendorProperty to unified card props
 * Used by: PropertyListItem, AdminProperties, OwnerProperties
 */
export function mapPropertyToCardProps(
  property: OwnerProperty | VendorProperty,
  language: string
): UnifiedPropertyCardProps {
  const isRu = language === 'ru';

  if (isOwnerProperty(property)) {
    // OwnerProperty format (title, title_ru)
    // Price: price_per_night for short-term; fallback to price for long-term (month/year)
    const displayPrice = property.price_per_night ?? property.price;
    const pricePeriod = property.price_period ?? 'night';

    return {
      variant: 'property',
      id: property.id,
      title: isRu ? (property.title_ru || property.title) : property.title,
      titleRu: property.title_ru,
      internalName: property.internal_name,
      propertyType: property.property_type,
      coverImage: property.cover_image,
      images: property.images,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.max_guests,
      areaSqm: property.area_sqm,
      district: property.district,
      address: property.address,
      price: displayPrice ?? undefined,
      pricePerNight: property.price_per_night ?? undefined,
      pricePeriod,
      currency: property.deposit_currency || 'THB',
      instantBooking: property.instant_booking,
      approvalStatus: property.approval_status,
      marketplacePropertyId: property.marketplace_property_id,
      highlights: property.highlights,
      floor: (property as any).floor,
      unitNumber: (property as any).unit_number,
      plotSizeSqm: (property as any).plot_size_sqm,
      poolType: (property as any).pool_type,
      totalFloors: (property as any).total_floors,
    };
  } else {
    // VendorProperty format (title_en, title_ru)
    return {
      variant: 'property',
      id: property.id,
      title: isRu ? (property.title_ru || property.title_en) : property.title_en,
      titleRu: property.title_ru,
      internalName: property.internal_name,
      propertyType: property.property_type,
      coverImage: property.cover_image,
      images: property.images,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.max_guests,
      areaSqm: property.area_sqm,
      district: property.district,
      address: property.address,
      price: property.price,
      pricePerNight: property.price,
      pricePeriod: property.price_period || 'night',
      currency: property.currency || 'THB',
      rating: property.rating,
      reviewCount: property.review_count,
      isActive: property.is_active,
      isFeatured: property.is_featured,
      instantBooking: (property as any).instant_booking,
      approvalStatus: (property as any).approval_status,
      floor: (property as any).floor,
      unitNumber: (property as any).unit_number,
      plotSizeSqm: (property as any).plot_size_sqm,
      poolType: (property as any).pool_type,
      totalFloors: (property as any).total_floors,
    };
  }
}

/**
 * Maps property form data to card props for live preview
 * Used by: AddProperty wizard preview step
 */
export function mapPropertyFormToCardProps(
  formData: {
    title?: string;
    title_ru?: string;
    title_en?: string;
    internal_name?: string;
    property_type?: string;
    cover_image?: string;
    images?: string[];
    bedrooms?: number;
    bathrooms?: number;
    max_guests?: number;
    area_sqm?: string | number;
    district?: string;
    address?: string;
    price_per_night?: string | number;
    price?: string | number;
    instant_booking?: boolean;
  },
  language: string
): UnifiedPropertyCardProps {
  const isRu = language === 'ru';
  const title = formData.title || formData.title_en || '';
  const titleRu = formData.title_ru;
  const price = typeof formData.price_per_night === 'string' 
    ? parseFloat(formData.price_per_night) || undefined
    : formData.price_per_night || (typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price);
  const area = typeof formData.area_sqm === 'string' 
    ? parseFloat(formData.area_sqm) || undefined
    : formData.area_sqm;

  return {
    variant: 'property',
    id: 'preview',
    title: isRu ? (titleRu || title) : title,
    titleRu,
    internalName: formData.internal_name,
    propertyType: formData.property_type,
    coverImage: formData.cover_image,
    images: formData.images,
    bedrooms: formData.bedrooms,
    bathrooms: formData.bathrooms,
    maxGuests: formData.max_guests,
    areaSqm: area,
    district: formData.district,
    address: formData.address,
    price,
    pricePerNight: price,
    pricePeriod: 'night',
    currency: 'THB',
    instantBooking: formData.instant_booking,
  };
}

// ============= PREVIEW HELPERS =============

/**
 * Checks if form has enough data to show a meaningful preview
 */
export function canShowPreview(formData: { name_en?: string; title?: string; cover_image?: string; price?: string | number }): boolean {
  return Boolean(formData.name_en || formData.title || formData.cover_image || formData.price);
}

/**
 * Returns placeholder text for empty preview
 */
export function getPreviewPlaceholder(language: string): { title: string; message: string } {
  const isRu = language === 'ru';
  return {
    title: isRu ? 'Предпросмотр' : 'Preview',
    message: isRu ? 'Заполните форму для предпросмотра' : 'Fill the form to see preview',
  };
}
