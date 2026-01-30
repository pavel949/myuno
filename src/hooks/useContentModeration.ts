import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ContentType = 
  | 'owner_properties' | 'tours' | 'water_activities' | 'restaurants' | 'salons' | 'clinics' 
  | 'gyms' | 'vehicles' | 'properties' | 'yachts' | 'events'
  | 'babysitters' | 'cleaning_services' | 'legal_services' | 'pet_services'
  | 'education_providers' | 'pharmacies' | 'insurance_providers' 
  | 'flower_shops' | 'stores' | 'vendor_locations';

// Column mappings for tables with different column names
const COLUMN_MAPPINGS: Record<string, { imageColumn: string; titleColumn: string }> = {
  babysitters: { imageColumn: 'photo', titleColumn: 'name_en' },
  tours: { imageColumn: 'cover_image', titleColumn: 'title_en' },
  properties: { imageColumn: 'cover_image', titleColumn: 'title_en' },
  events: { imageColumn: 'cover_image', titleColumn: 'title_en' },
  water_activities: { imageColumn: 'cover_image', titleColumn: 'title_en' },
  owner_properties: { imageColumn: 'cover_image', titleColumn: 'title' },
  vendor_locations: { imageColumn: 'cover_image', titleColumn: 'name' },
  // Default for others: cover_image and name_en
};

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PendingContent {
  id: string;
  content_type: ContentType;
  title: string;
  provider_name: string;
  provider_id: string | null;
  owner_user_id: string | null; // The user ID to send notifications to
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
  vendor_locations: { en: 'Vendor Locations', ru: 'Локации поставщиков' },
};

export const getContentTypeLabel = (type: ContentType, language: string) => {
  return language === 'ru' ? contentTypeLabels[type].ru : contentTypeLabels[type].en;
};

export const allContentTypes: ContentType[] = [
  'owner_properties', 'tours', 'water_activities', 'restaurants', 'salons', 'clinics',
  'gyms', 'vehicles', 'properties', 'yachts', 'events',
  'babysitters', 'cleaning_services', 'legal_services', 'pet_services',
  'education_providers', 'pharmacies', 'insurance_providers',
  'flower_shops', 'stores', 'vendor_locations'
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
              owner_user_id: item.owner_id, // For owner_properties, owner_id IS the user_id
              created_at: item.created_at,
              cover_image: item.cover_image,
              approval_status: item.approval_status as ApprovalStatus,
            }));
            allContent.push(...mapped);
          }
          continue;
        }

        // Special handling for vendor_locations - uses org_id instead of provider_id
        if (table === 'vendor_locations') {
          const { data, error } = await supabase
            .from('vendor_locations')
            .select(`
              id,
              name,
              org_id,
              created_at,
              cover_image,
              approval_status
            `)
            .eq('approval_status', statusFilter)
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching vendor_locations:`, error);
            continue;
          }

          if (data) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              content_type: 'vendor_locations' as ContentType,
              title: item.name || 'Untitled',
              provider_name: 'Vendor',
              provider_id: item.org_id,
              owner_user_id: null, // vendor_locations don't have direct user mapping
              created_at: item.created_at,
              cover_image: item.cover_image,
              approval_status: item.approval_status as ApprovalStatus,
            }));
            allContent.push(...mapped);
          }
          continue;
        }

        // Get column mappings for this table
        const mapping = COLUMN_MAPPINGS[table] || { imageColumn: 'cover_image', titleColumn: 'name_en' };
        const { imageColumn, titleColumn } = mapping;

        // Build dynamic select query based on table structure
        let selectQuery = `
          id,
          ${titleColumn},
          provider_id,
          created_at,
          approval_status,
          providers:provider_id (
            name,
            user_id
          )
        `;
        
        // Add image column - handle special cases
        if (imageColumn === 'photo') {
          selectQuery = `
            id,
            ${titleColumn},
            provider_id,
            created_at,
            photo,
            approval_status,
            providers:provider_id (
              name,
              user_id
            )
          `;
        } else {
          selectQuery = `
            id,
            ${titleColumn},
            provider_id,
            created_at,
            cover_image,
            approval_status,
            providers:provider_id (
              name,
              user_id
            )
          `;
        }

        const { data, error } = await supabase
          .from(table)
          .select(selectQuery)
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
            provider_name: item.providers?.name || 'Unknown',
            provider_id: item.provider_id,
            owner_user_id: item.providers?.user_id || null, // Get user_id from provider
            created_at: item.created_at,
            cover_image: item.cover_image || item.photo || null,
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

  // Send in-app notification to content owner/provider
  const sendModerationNotification = useCallback(async (
    contentType: ContentType,
    contentId: string,
    action: 'approved' | 'rejected' | 'info_requested',
    contentTitle: string,
    recipientId: string | null,
    message?: string
  ) => {
    if (!recipientId) {
      console.warn('No recipient ID for notification');
      return;
    }

    const typeLabel = getContentTypeLabel(contentType, 'ru');
    
    let title: string;
    let body: string;
    let notificationType: string;

    switch (action) {
      case 'approved':
        title = '✅ Ваш контент одобрен';
        body = `${typeLabel} "${contentTitle}" успешно прошёл модерацию и теперь доступен пользователям.`;
        notificationType = 'content_approved';
        break;
      case 'rejected':
        title = '❌ Контент отклонён';
        body = `${typeLabel} "${contentTitle}" не прошёл модерацию. Причина: ${message || 'Не указана'}`;
        notificationType = 'content_rejected';
        break;
      case 'info_requested':
        title = '📋 Требуется дополнительная информация';
        body = `По вашему ${typeLabel.toLowerCase()} "${contentTitle}" запрошена информация: ${message || ''}`;
        notificationType = 'content_info_requested';
        break;
    }

    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: recipientId,
        title,
        body,
        type: notificationType,
        data: {
          content_type: contentType,
          content_id: contentId,
          content_title: contentTitle,
          action,
          message
        },
        is_read: false
      });

      if (error) {
        console.error('Failed to send notification:', error);
      }
    } catch (err) {
      console.error('Notification error:', err);
    }
  }, []);

  const approveContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    reviewerId: string,
    contentTitle?: string,
    ownerId?: string | null
  ) => {
    try {
      // Build update payload based on table structure
      // owner_properties uses approved_by/approved_at, others use reviewed_by/reviewed_at
      const updatePayload = contentType === 'owner_properties' 
        ? {
            approval_status: 'approved',
            approved_by: reviewerId,
            approved_at: new Date().toISOString(),
          }
        : {
            approval_status: 'approved',
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
            is_verified: true,
          };

      // Use 'as any' to avoid TypeScript union type complexity with dynamic table names
      const { error } = await (supabase.from(contentType) as any)
        .update(updatePayload)
        .eq('id', contentId);

      if (error) throw error;

      // Send email notification for owner properties
      if (contentType === 'owner_properties') {
        sendPropertyModerationEmail(contentId, 'approved');
      }

      // Send in-app notification to owner/provider
      if (ownerId && contentTitle) {
        sendModerationNotification(
          contentType,
          contentId,
          'approved',
          contentTitle,
          ownerId
        );
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
  }, [toast, sendPropertyModerationEmail, sendModerationNotification]);

  const rejectContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    reviewerId: string,
    rejectionReason: string,
    contentTitle?: string,
    ownerId?: string | null
  ) => {
    try {
      // Determine if this is an info request or rejection
      const isInfoRequest = rejectionReason.startsWith('[ЗАПРОС ИНФОРМАЦИИ / INFO REQUEST]:');
      
      // Build update payload based on table structure
      // owner_properties uses approved_by/approved_at, others use reviewed_by/reviewed_at
      const updatePayload = contentType === 'owner_properties'
        ? {
            approval_status: 'rejected',
            rejection_reason: rejectionReason,
            approved_by: reviewerId,
            approved_at: new Date().toISOString(),
          }
        : {
            approval_status: 'rejected',
            rejection_reason: rejectionReason,
            reviewed_by: reviewerId,
            reviewed_at: new Date().toISOString(),
          };

      // Use 'as any' to avoid TypeScript union type complexity with dynamic table names
      const { error } = await (supabase.from(contentType) as any)
        .update(updatePayload)
        .eq('id', contentId);

      if (error) throw error;

      // Send email notification for owner properties
      if (contentType === 'owner_properties') {
        sendPropertyModerationEmail(contentId, 'rejected', rejectionReason);
      }

      // Send in-app notification to owner/provider
      if (ownerId && contentTitle) {
        const cleanMessage = isInfoRequest 
          ? rejectionReason.replace('[ЗАПРОС ИНФОРМАЦИИ / INFO REQUEST]: ', '')
          : rejectionReason;
        
        sendModerationNotification(
          contentType,
          contentId,
          isInfoRequest ? 'info_requested' : 'rejected',
          contentTitle,
          ownerId,
          cleanMessage
        );
      }

      toast({
        title: isInfoRequest ? '📋 Info Requested' : '❌ Rejected',
        description: isInfoRequest 
          ? 'Request sent to vendor for additional information.'
          : 'Content has been rejected. Vendor will be notified.',
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
  }, [toast, sendPropertyModerationEmail, sendModerationNotification]);

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
