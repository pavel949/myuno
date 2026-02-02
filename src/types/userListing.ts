// Types for C2C user listings

export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';
export type ListingStatus = 'draft' | 'pending' | 'active' | 'sold' | 'expired' | 'removed';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type SellerType = 'business' | 'individual';

export interface UserListing {
  id: string;
  user_id: string;
  
  // Basic info
  title_en: string;
  title_ru: string | null;
  description_en: string | null;
  description_ru: string | null;
  
  // Categorization
  category_slug: string | null;
  subcategory: string | null;
  
  // Pricing
  price: number;
  original_price: number | null;
  currency: string;
  is_negotiable: boolean;
  
  // Condition
  condition: ItemCondition;
  
  // Media
  cover_image: string | null;
  images: string[] | null;
  
  // Location & Contact
  location: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  show_phone: boolean;
  
  // Status
  status: ListingStatus;
  moderation_status: ModerationStatus;
  rejection_reason: string | null;
  
  // Metrics
  views_count: number;
  favorites_count: number;
  
  // Timestamps
  published_at: string | null;
  expires_at: string | null;
  sold_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListingDraft {
  title_en: string;
  title_ru?: string;
  description_en?: string;
  description_ru?: string;
  category_slug?: string;
  subcategory?: string;
  price?: number;
  currency: string;
  is_negotiable: boolean;
  condition: ItemCondition;
  cover_image?: string;
  images?: string[];
  location?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  show_phone: boolean;
}

export const CONDITION_LABELS = {
  new: { en: 'New', ru: 'Новый' },
  like_new: { en: 'Like New', ru: 'Как новый' },
  good: { en: 'Good', ru: 'Хорошее' },
  fair: { en: 'Fair', ru: 'Удовлетворительное' },
  for_parts: { en: 'For Parts', ru: 'На запчасти' },
} as const;

export const STATUS_LABELS = {
  draft: { en: 'Draft', ru: 'Черновик' },
  pending: { en: 'Pending Review', ru: 'На проверке' },
  active: { en: 'Active', ru: 'Активно' },
  sold: { en: 'Sold', ru: 'Продано' },
  expired: { en: 'Expired', ru: 'Истекло' },
  removed: { en: 'Removed', ru: 'Удалено' },
} as const;
