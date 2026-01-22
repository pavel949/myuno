import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ContentType = 
  | 'owner_properties' | 'tours' | 'water_activities' | 'restaurants' | 'salons' | 'clinics' 
  | 'gyms' | 'vehicles' | 'properties' | 'yachts' | 'events'
  | 'babysitters' | 'cleaning_services' | 'legal_services' | 'pet_services'
  | 'education_providers' | 'pharmacies' | 'insurance_providers' 
  | 'flower_shops' | 'stores';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PendingContent {
  id: string;
  content_type: ContentType;
  title: string;
  provider_name: string;
  provider_id: string | null;
  created_at: string;
  cover_image: string | null;
  approval_status: ApprovalStatus;
}

const contentTypeLabels: Record<ContentType, { en: string; ru: string }> = {
  owner_properties: { en: 'Owner Properties', ru: 'Объекты собственников' },
  tours: { en: 'Tours', ru: 'Туры' },
  water_activities: { en: 'Water Activities', ru: 'Водные развлечения' },
  restaurants: { en: 'Restaurants', ru: 'Рестораны' },
  salons: { en: 'Beauty Salons', ru: 'Салоны красоты' },
  clinics: { en: 'Clinics', ru: 'Клиники' },
  gyms: { en: 'Gyms', ru: 'Фитнес' },
  vehicles: { en: 'Vehicles', ru: 'Транспорт' },
  properties: { en: 'Properties', ru: 'Недвижимость' },
  yachts: { en: 'Yachts', ru: 'Яхты' },
  events: { en: 'Events', ru: 'Мероприятия' },
  babysitters: { en: 'Babysitters', ru: 'Няни' },
  cleaning_services: { en: 'Cleaning', ru: 'Клининг' },
  legal_services: { en: 'Legal', ru: 'Юридические' },
  pet_services: { en: 'Pet Services', ru: 'Услуги для питомцев' },
  education_providers: { en: 'Education', ru: 'Образование' },
  pharmacies: { en: 'Pharmacies', ru: 'Аптеки' },
  insurance_providers: { en: 'Insurance', ru: 'Страхование' },
  flower_shops: { en: 'Flowers', ru: 'Цветы' },
  stores: { en: 'Stores', ru: 'Магазины' },
};

export const getContentTypeLabel = (type: ContentType, language: string) => {
  return language === 'ru' ? contentTypeLabels[type].ru : contentTypeLabels[type].en;
};

export const allContentTypes: ContentType[] = [
  'owner_properties', 'tours', 'water_activities', 'restaurants', 'salons', 'clinics',
  'gyms', 'vehicles', 'properties', 'yachts', 'events',
  'babysitters', 'cleaning_services', 'legal_services', 'pet_services',
  'education_providers', 'pharmacies', 'insurance_providers',
  'flower_shops', 'stores'
];

export function useContentModeration() {
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPendingContent = useCallback(async (
    statusFilter: ApprovalStatus = 'pending',
    typeFilter?: ContentType
  ) => {
    setIsLoading(true);
    const allContent: PendingContent[] = [];

    const tablesToFetch = typeFilter ? [typeFilter] : allContentTypes;

    try {
      for (const table of tablesToFetch) {
        // Special handling for owner_properties - different structure
        if (table === 'owner_properties') {
          const { data, error } = await supabase
            .from('owner_properties')
            .select(`
              id,
              title,
              owner_id,
              created_at,
              cover_image,
              approval_status
            `)
            .eq('approval_status', statusFilter)
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching owner_properties:`, error);
            continue;
          }

          if (data) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              content_type: 'owner_properties' as ContentType,
              title: item.title || 'Untitled',
              provider_name: 'Owner',
              provider_id: item.owner_id,
              created_at: item.created_at,
              cover_image: item.cover_image,
              approval_status: item.approval_status as ApprovalStatus,
            }));
            allContent.push(...mapped);
          }
          continue;
        }

        // Determine title column based on table
        const titleColumn = ['tours', 'water_activities', 'properties', 'events'].includes(table)
          ? 'title_en'
          : 'name_en';

        const { data, error } = await supabase
          .from(table)
          .select(`
            id,
            ${titleColumn},
            provider_id,
            created_at,
            cover_image,
            approval_status,
            providers:provider_id (
              business_name
            )
          `)
          .eq('approval_status', statusFilter)
          .order('created_at', { ascending: false });

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          continue;
        }

        if (data) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            content_type: table as ContentType,
            title: item[titleColumn] || 'Untitled',
            provider_name: item.providers?.business_name || 'Unknown',
            provider_id: item.provider_id,
            created_at: item.created_at,
            cover_image: item.cover_image,
            approval_status: item.approval_status as ApprovalStatus,
          }));
          allContent.push(...mapped);
        }
      }

      // Sort by created_at descending
      allContent.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPendingContent(allContent);
    } catch (error) {
      console.error('Error fetching pending content:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending content',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const sendPropertyModerationEmail = useCallback(async (
    propertyId: string,
    action: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('property-moderation-email', {
        body: { propertyId, action, rejectionReason }
      });
      if (error) {
        console.error('Failed to send moderation email:', error);
      }
    } catch (err) {
      console.error('Email send error:', err);
    }
  }, []);

  const approveContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    reviewerId: string
  ) => {
    try {
      // Use 'as any' to avoid TypeScript union type complexity with dynamic table names
      const { error } = await (supabase.from(contentType) as any)
        .update({
          approval_status: 'approved',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          is_verified: true,
        })
        .eq('id', contentId);

      if (error) throw error;

      // Send email notification for owner properties
      if (contentType === 'owner_properties') {
        sendPropertyModerationEmail(contentId, 'approved');
      }

      toast({
        title: '✅ Approved',
        description: 'Content has been approved and is now visible to users',
      });

      return true;
    } catch (error) {
      console.error('Error approving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve content',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, sendPropertyModerationEmail]);

  const rejectContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    reviewerId: string,
    rejectionReason: string
  ) => {
    try {
      // Use 'as any' to avoid TypeScript union type complexity with dynamic table names
      const { error } = await (supabase.from(contentType) as any)
        .update({
          approval_status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', contentId);

      if (error) throw error;

      // Send email notification for owner properties
      if (contentType === 'owner_properties') {
        sendPropertyModerationEmail(contentId, 'rejected', rejectionReason);
      }

      toast({
        title: '❌ Rejected',
        description: 'Content has been rejected. Vendor will be notified.',
      });

      return true;
    } catch (error) {
      console.error('Error rejecting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject content',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, sendPropertyModerationEmail]);

  const getContentDetails = useCallback(async (
    contentType: ContentType,
    contentId: string
  ): Promise<Record<string, any> | null> => {
    try {
      // Use 'as any' to avoid TypeScript union type complexity with dynamic table names
      const query = (supabase.from(contentType) as any).select('*');
      
      // Only add provider join for non-owner_properties tables
      if (contentType !== 'owner_properties') {
        query.select('*, providers:provider_id (*)');
      }
      
      const { data, error } = await query.eq('id', contentId).single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching content details:', error);
      return null;
    }
  }, []);

  return {
    pendingContent,
    isLoading,
    fetchPendingContent,
    approveContent,
    rejectContent,
    getContentDetails,
  };
}
