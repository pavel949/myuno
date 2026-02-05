import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface AdminNotificationItem {
  id: string;
  type: 'booking' | 'consultation' | 'moderation' | 'provider';
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  createdAt: string;
  isRead: boolean;
  link: string;
  priority: 'low' | 'medium' | 'high';
}

export function useAdminNotificationsList() {
  return useQuery({
    queryKey: ['admin-notifications-list'],
    queryFn: async (): Promise<AdminNotificationItem[]> => {
      const notifications: AdminNotificationItem[] = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch recent pending bookings
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('id, created_at, booking_type, status')
        .eq('status', 'submitted')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (pendingBookings) {
        pendingBookings.forEach((booking) => {
          notifications.push({
            id: `booking-${booking.id}`,
            type: 'booking',
            title: 'New booking submitted',
            titleRu: 'Новое бронирование',
            description: `${booking.booking_type} booking needs review`,
            descriptionRu: `Бронирование ${booking.booking_type} ожидает проверки`,
            createdAt: booking.created_at,
            isRead: false,
            link: '/admin/operations?tab=bookings',
            priority: 'high',
          });
        });
      }

      // Fetch recent consultation requests
      const { data: consultations } = await supabase
        .from('consultation_requests')
        .select('id, created_at, name, vertical_id, status')
        .eq('status', 'new')
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (consultations) {
        consultations.forEach((consultation) => {
          notifications.push({
            id: `consultation-${consultation.id}`,
            type: 'consultation',
            title: `New lead: ${consultation.name}`,
            titleRu: `Новый лид: ${consultation.name}`,
            description: `${consultation.vertical_id || 'General'} request`,
            descriptionRu: `Запрос на ${consultation.vertical_id || 'консультацию'}`,
            createdAt: consultation.created_at,
            isRead: false,
            link: '/admin/operations?tab=consultations',
            priority: 'medium',
          });
        });
      }

      // Fetch pending moderation items
      const { data: pendingYachts } = await supabase
        .from('yachts')
        .select('id, name_en, created_at')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pendingYachts) {
        pendingYachts.forEach((yacht) => {
          notifications.push({
            id: `moderation-yacht-${yacht.id}`,
            type: 'moderation',
            title: `Yacht pending: ${yacht.name_en}`,
            titleRu: `Яхта на модерации: ${yacht.name_en}`,
            description: 'Awaiting approval',
            descriptionRu: 'Ожидает одобрения',
            createdAt: yacht.created_at || now.toISOString(),
            isRead: false,
            link: '/admin/operations?tab=moderation',
            priority: 'medium',
          });
        });
      }

      // Fetch unverified providers
      const { data: pendingProviders } = await supabase
        .from('providers')
        .select('id, name, created_at')
        .eq('is_verified', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (pendingProviders) {
        pendingProviders.forEach((provider) => {
          notifications.push({
            id: `provider-${provider.id}`,
            type: 'provider',
            title: `Provider pending: ${provider.name || 'Unknown'}`,
            titleRu: `Провайдер на верификации: ${provider.name || 'Неизвестен'}`,
            description: 'Needs verification',
            descriptionRu: 'Требуется верификация',
            createdAt: provider.created_at || now.toISOString(),
            isRead: false,
            link: '/admin/operations?tab=moderation',
            priority: 'low',
          });
        });
      }

      // Sort by date, newest first
      return notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    ...CACHE_PROFILES.ADMIN,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
