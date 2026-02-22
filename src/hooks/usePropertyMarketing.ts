/**
 * @module usePropertyMarketing
 * @description Hooks for property analytics, listing scores, and promotions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { OwnerProperty } from '@/types/property';

// Types
export interface PropertyAnalytics {
  id: string;
  property_id: string;
  date: string;
  views: number;
  search_impressions: number;
  inquiries: number;
  bookings: number;
  clicks: number;
  favorites: number;
  shares: number;
  source: string | null;
}

export interface PropertyPromotion {
  id: string;
  property_id: string;
  owner_id: string;
  promotion_type: 'featured' | 'boost' | 'highlight' | 'top_search';
  starts_at: string;
  ends_at: string;
  cost: number | null;
  currency: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  impressions_delivered: number;
  clicks_delivered: number;
  created_at: string;
}

export interface PropertyListingScore {
  id: string;
  property_id: string;
  overall_score: number;
  photos_score: number;
  description_score: number;
  pricing_score: number;
  amenities_score: number;
  response_score: number;
  reviews_score: number;
  missing_fields: string[];
  improvement_tips: Array<{
    category: string;
    tip_en: string;
    tip_ru: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  last_calculated_at: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalImpressions: number;
  totalInquiries: number;
  totalBookings: number;
  conversionRate: number;
  viewsChange: number;
  bookingsChange: number;
}

// Fetch analytics for a property over a date range
export function usePropertyAnalytics(propertyId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ['property-analytics', propertyId, days],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('property_analytics')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as PropertyAnalytics[];
    },
    enabled: !!propertyId,
  });
}

// Calculate analytics summary
export function usePropertyAnalyticsSummary(propertyId: string | undefined, days = 30) {
  const { data: analytics } = usePropertyAnalytics(propertyId, days);
  const { data: prevAnalytics } = usePropertyAnalytics(propertyId, days * 2);
  
  const summary: AnalyticsSummary = {
    totalViews: 0,
    totalImpressions: 0,
    totalInquiries: 0,
    totalBookings: 0,
    conversionRate: 0,
    viewsChange: 0,
    bookingsChange: 0,
  };
  
  if (analytics && analytics.length > 0) {
    summary.totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0);
    summary.totalImpressions = analytics.reduce((sum, a) => sum + (a.search_impressions || 0), 0);
    summary.totalInquiries = analytics.reduce((sum, a) => sum + (a.inquiries || 0), 0);
    summary.totalBookings = analytics.reduce((sum, a) => sum + (a.bookings || 0), 0);
    
    if (summary.totalViews > 0) {
      summary.conversionRate = Math.round((summary.totalBookings / summary.totalViews) * 100 * 10) / 10;
    }
  }
  
  // Calculate period-over-period change
  if (prevAnalytics && prevAnalytics.length > analytics?.length) {
    const prevPeriod = prevAnalytics.slice(0, prevAnalytics.length - (analytics?.length || 0));
    const prevViews = prevPeriod.reduce((sum, a) => sum + (a.views || 0), 0);
    const prevBookings = prevPeriod.reduce((sum, a) => sum + (a.bookings || 0), 0);
    
    if (prevViews > 0) {
      summary.viewsChange = Math.round(((summary.totalViews - prevViews) / prevViews) * 100);
    }
    if (prevBookings > 0) {
      summary.bookingsChange = Math.round(((summary.totalBookings - prevBookings) / prevBookings) * 100);
    }
  }
  
  return summary;
}

// Fetch listing score for a property
export function usePropertyListingScore(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['property-listing-score', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      
      const { data, error } = await supabase
        .from('property_listing_scores')
        .select('*')
        .eq('property_id', propertyId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        improvement_tips: (data.improvement_tips as unknown as PropertyListingScore['improvement_tips']) || [],
      } as PropertyListingScore;
    },
    enabled: !!propertyId,
  });
}

// Calculate listing health score from property data
export function calculateListingHealthScore(property: OwnerProperty | null): PropertyListingScore | null {
  if (!property) return null;
  
  let photosScore = 0;
  let descriptionScore = 0;
  let pricingScore = 0;
  let amenitiesScore = 0;
  let responseScore = 50; // Default mid-score
  let reviewsScore = 0;
  
  const missingFields: string[] = [];
  const tips: PropertyListingScore['improvement_tips'] = [];
  
  // Photos score (0-100)
  const images = property.images || [];
  if (images.length >= 20) {
    photosScore = 100;
  } else if (images.length >= 10) {
    photosScore = 80;
  } else if (images.length >= 5) {
    photosScore = 60;
    tips.push({
      category: 'photos',
      tip_en: 'Add more photos. Listings with 10+ photos get 50% more views.',
      tip_ru: 'Добавьте больше фото. Объекты с 10+ фото получают на 50% больше просмотров.',
      priority: 'high',
    });
  } else {
    photosScore = Math.max(20, images.length * 12);
    missingFields.push('photos');
    tips.push({
      category: 'photos',
      tip_en: 'Add at least 5 high-quality photos of your property.',
      tip_ru: 'Добавьте минимум 5 качественных фото объекта.',
      priority: 'high',
    });
  }
  
  if (!property.cover_image) {
    photosScore = Math.max(0, photosScore - 20);
    missingFields.push('cover_image');
  }
  
  // Description score (0-100)
  const descLen = (property.description_en || '').length;
  const descRuLen = (property.description_ru || '').length;
  
  if (descLen >= 500 && descRuLen >= 500) {
    descriptionScore = 100;
  } else if (descLen >= 300 || descRuLen >= 300) {
    descriptionScore = 75;
    if (descLen < 500) {
      tips.push({
        category: 'description',
        tip_en: 'Expand your English description to at least 500 characters.',
        tip_ru: 'Расширьте описание на английском до 500 символов.',
        priority: 'medium',
      });
    }
    if (descRuLen < 500) {
      tips.push({
        category: 'description',
        tip_en: 'Add Russian description for Russian-speaking guests.',
        tip_ru: 'Добавьте описание на русском для русскоязычных гостей.',
        priority: 'medium',
      });
    }
  } else if (descLen >= 100) {
    descriptionScore = 50;
    missingFields.push('description');
    tips.push({
      category: 'description',
      tip_en: 'Write a detailed description highlighting unique features.',
      tip_ru: 'Напишите подробное описание с уникальными особенностями.',
      priority: 'high',
    });
  } else {
    descriptionScore = 20;
    missingFields.push('description');
  }
  
  // Pricing score (0-100)
  if (property.price_per_night && property.price_per_night > 0) {
    pricingScore = 70;
    
    if (property.weekly_discount && property.weekly_discount > 0) {
      pricingScore += 10;
    } else {
      tips.push({
        category: 'pricing',
        tip_en: 'Add a weekly discount to attract longer stays.',
        tip_ru: 'Добавьте скидку за неделю для привлечения долгих аренд.',
        priority: 'low',
      });
    }
    
    if (property.monthly_discount && property.monthly_discount > 0) {
      pricingScore += 10;
    }
    
    if (property.seasonal_pricing && Object.keys(property.seasonal_pricing).length > 0) {
      pricingScore += 10;
    } else {
      tips.push({
        category: 'pricing',
        tip_en: 'Set seasonal pricing to maximize revenue during peak periods.',
        tip_ru: 'Настройте сезонные цены для максимизации дохода в высокий сезон.',
        priority: 'medium',
      });
    }
  } else {
    pricingScore = 0;
    missingFields.push('price_per_night');
    tips.push({
      category: 'pricing',
      tip_en: 'Set your nightly price to enable bookings.',
      tip_ru: 'Установите цену за ночь для приёма бронирований.',
      priority: 'high',
    });
  }
  
  // Amenities score (0-100)
  const highlights = property.highlights || [];
  const equipment = property.equipment || [];
  const totalAmenities = highlights.length + equipment.length;
  
  if (totalAmenities >= 15) {
    amenitiesScore = 100;
  } else if (totalAmenities >= 10) {
    amenitiesScore = 80;
  } else if (totalAmenities >= 5) {
    amenitiesScore = 60;
    tips.push({
      category: 'amenities',
      tip_en: 'Add more amenities and highlights to stand out.',
      tip_ru: 'Добавьте больше удобств для выделения объекта.',
      priority: 'medium',
    });
  } else {
    amenitiesScore = totalAmenities * 12;
    missingFields.push('amenities');
  }
  
  // Check for important fields
  if (!property.max_guests) {
    missingFields.push('max_guests');
  }
  if (!property.check_in_time || !property.check_out_time) {
    missingFields.push('check_in_time');
  }
  if (!property.cancellation_policy) {
    missingFields.push('cancellation_policy');
  }
  if (!property.house_rules) {
    tips.push({
      category: 'rules',
      tip_en: 'Add house rules to set clear expectations for guests.',
      tip_ru: 'Добавьте правила дома для чётких ожиданий гостей.',
      priority: 'low',
    });
  }
  
  // Calculate overall score
  const overallScore = Math.round(
    (photosScore * 0.25) + 
    (descriptionScore * 0.20) + 
    (pricingScore * 0.20) + 
    (amenitiesScore * 0.15) + 
    (responseScore * 0.10) + 
    (reviewsScore * 0.10)
  );
  
  return {
    id: '',
    property_id: property.id,
    overall_score: overallScore,
    photos_score: photosScore,
    description_score: descriptionScore,
    pricing_score: pricingScore,
    amenities_score: amenitiesScore,
    response_score: responseScore,
    reviews_score: reviewsScore,
    missing_fields: missingFields,
    improvement_tips: tips.sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    }),
    last_calculated_at: new Date().toISOString(),
  };
}

// Fetch promotions for a property
export function usePropertyPromotions(propertyId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['property-promotions', propertyId],
    queryFn: async () => {
      if (!propertyId || !user) return [];
      
      const { data, error } = await supabase
        .from('property_promotions')
        .select('*')
        .eq('property_id', propertyId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PropertyPromotion[];
    },
    enabled: !!propertyId && !!user,
  });
}

// Create a new promotion
export function useCreatePromotion() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (input: {
      property_id: string;
      promotion_type: PropertyPromotion['promotion_type'];
      starts_at: string;
      ends_at: string;
      cost?: number;
      currency?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('property_promotions')
        .insert({
          property_id: input.property_id,
          owner_id: user.id,
          promotion_type: input.promotion_type,
          starts_at: input.starts_at,
          ends_at: input.ends_at,
          cost: input.cost || null,
          currency: input.currency || 'THB',
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-promotions', variables.property_id] });
      toast.success('Promotion created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create promotion: ' + error.message);
    },
  });
}

// Cancel a promotion
export function useCancelPromotion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ promotionId, propertyId }: { promotionId: string; propertyId: string }) => {
      const { error } = await supabase
        .from('property_promotions')
        .update({ status: 'cancelled' })
        .eq('id', promotionId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['property-promotions', variables.propertyId] });
      toast.success('Promotion cancelled');
    },
  });
}

// Promotion pricing tiers
export const PROMOTION_TIERS = {
  boost: {
    type: 'boost' as const,
    name_en: 'Boost',
    name_ru: 'Буст',
    description_en: '2x visibility in search for 7 days',
    description_ru: '2x видимость в поиске на 7 дней',
    duration_days: 7,
    price: 1500,
    currency: 'THB',
  },
  featured: {
    type: 'featured' as const,
    name_en: 'Featured',
    name_ru: 'Рекомендуемый',
    description_en: 'Featured badge + homepage placement for 14 days',
    description_ru: 'Значок "Рекомендуемый" + размещение на главной 14 дней',
    duration_days: 14,
    price: 3500,
    currency: 'THB',
  },
  top_search: {
    type: 'top_search' as const,
    name_en: 'Top Search',
    name_ru: 'Топ поиска',
    description_en: 'Priority ranking in search results for 30 days',
    description_ru: 'Приоритет в результатах поиска на 30 дней',
    duration_days: 30,
    price: 5000,
    currency: 'THB',
  },
};
