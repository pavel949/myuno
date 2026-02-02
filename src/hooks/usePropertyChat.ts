import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface PropertyChatMessage {
  id: string;
  property_id: string | null;
  booking_id: string | null;
  sender_id: string;
  sender_name: string | null;
  sender_type: 'owner' | 'guest' | 'manager' | 'support';
  message: string;
  attachments: Json | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatAttachment {
  type: 'image' | 'document';
  url: string;
  name: string;
  size?: number;
}

export function usePropertyChat(options: { propertyId?: string; bookingId?: string }) {
  const { propertyId, bookingId } = options;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['property-chat', propertyId, bookingId];

  const { data: messages, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      // First, verify ownership of the property/booking
      if (bookingId) {
        const { data: booking, error: bookingError } = await supabase
          .from('property_bookings')
          .select('id, owner_id')
          .eq('id', bookingId)
          .eq('owner_id', user.id) // Security: verify ownership
          .single();
        
        if (bookingError || !booking) {
          console.warn('Chat access denied: booking not found or not owned');
          return [];
        }
      } else if (propertyId) {
        const { data: property, error: propError } = await supabase
          .from('owner_properties')
          .select('id, owner_id')
          .eq('id', propertyId)
          .eq('owner_id', user.id) // Security: verify ownership
          .single();
        
        if (propError || !property) {
          console.warn('Chat access denied: property not found or not owned');
          return [];
        }
      }

      let query = supabase
        .from('property_chat_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (bookingId) {
        query = query.eq('booking_id', bookingId);
      } else if (propertyId) {
        query = query.eq('property_id', propertyId).is('booking_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PropertyChatMessage[];
    },
    enabled: !!user && (!!propertyId || !!bookingId),
    ...CACHE_PROFILES.REALTIME,
  });

  const sendMessage = useMutation({
    mutationFn: async (params: {
      message: string;
      senderType: 'owner' | 'guest' | 'manager';
      senderName?: string;
      attachments?: ChatAttachment[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_chat_messages')
        .insert({
          property_id: propertyId || null,
          booking_id: bookingId || null,
          sender_id: user.id,
          sender_name: params.senderName || user.email || 'Unknown',
          sender_type: params.senderType,
          message: params.message,
          attachments: params.attachments as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PropertyChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user) throw new Error('Not authenticated');
      
      // Only mark as read messages that user has access to
      // The ownership check above already verified access, but we filter to be safe
      const { error } = await supabase
        .from('property_chat_messages')
        .update({ is_read: true })
        .in('id', messageIds)
        .neq('sender_id', user.id); // Only mark others' messages as read

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user || (!propertyId && !bookingId)) return;

    const filter = bookingId 
      ? `booking_id=eq.${bookingId}` 
      : `property_id=eq.${propertyId}`;

    const channel = supabase
      .channel(`property_chat_${propertyId || bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_chat_messages',
          filter,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, propertyId, bookingId, queryClient, queryKey]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    markAsRead: markAsRead.mutateAsync,
  };
}

// Chat item interface for owner inbox
export interface OwnerChatItem {
  id: string;
  type: 'property' | 'booking';
  propertyId: string;
  bookingId?: string;
  title: string;
  titleRu?: string;
  propertyTitle?: string;
  propertyTitleRu?: string;
  coverImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  // Booking details for guest chats
  guestName?: string;
  guestPhone?: string;
  checkIn?: string;
  checkOut?: string;
  bookingStatus?: string;
}

// Hook for fetching all chats for owner
export function useOwnerChats() {
  const { user } = useAuth();

  const { data: chats, isLoading, refetch } = useQuery({
    queryKey: ['owner-chats', user?.id],
    queryFn: async (): Promise<OwnerChatItem[]> => {
      if (!user) return [];

      // Parallel fetch for better performance
      const [propertiesRes, messagesCountRes, bookingsRes] = await Promise.all([
        supabase
          .from('owner_properties')
          .select('id, title, title_ru, cover_image')
          .eq('owner_id', user.id),
        supabase
          .from('property_chat_messages')
          .select('property_id, booking_id, message, created_at, is_read, sender_type')
          .order('created_at', { ascending: false })
          .limit(500), // Reasonable limit for performance
        supabase
          .from('property_bookings')
          .select('id, property_id, guest_name, guest_phone, check_in, check_out, status')
          .eq('owner_id', user.id)
          .order('check_in', { ascending: false })
          .limit(100),
      ]);

      const properties = propertiesRes.data || [];
      const allMessages = messagesCountRes.data || [];
      const allBookings = bookingsRes.data || [];

      if (properties.length === 0) return [];

      const propertyIds = new Set(properties.map(p => p.id));

      // Filter messages to owned properties
      const messages = allMessages.filter(m => m.property_id && propertyIds.has(m.property_id));

      // Create chat map
      const chatMap = new Map<string, OwnerChatItem>();

      // First, add property-level chats (general inquiries without booking)
      properties.forEach(prop => {
        const propMessages = messages.filter(m => m.property_id === prop.id && !m.booking_id);
        const unreadCount = propMessages.filter(m => !m.is_read && m.sender_type !== 'owner').length;
        
        if (propMessages.length > 0) {
          chatMap.set(`property-${prop.id}`, {
            id: prop.id,
            type: 'property',
            propertyId: prop.id,
            title: prop.title,
            titleRu: prop.title_ru || undefined,
            coverImage: prop.cover_image || undefined,
            lastMessage: propMessages[0]?.message,
            lastMessageTime: propMessages[0]?.created_at,
            unreadCount,
          });
        }
      });

      // Add booking chats (guest conversations)
      allBookings.forEach(booking => {
        if (!propertyIds.has(booking.property_id)) return;
        
        const bMessages = messages.filter(m => m.booking_id === booking.id);
        const unreadCount = bMessages.filter(m => !m.is_read && m.sender_type !== 'owner').length;
        const property = properties.find(p => p.id === booking.property_id);

        // Include booking if it has messages OR is active/upcoming (for easy access)
        const hasMessages = bMessages.length > 0;
        const isActiveOrUpcoming = ['confirmed', 'pending'].includes(booking.status || '');
        
        if (hasMessages || isActiveOrUpcoming) {
          chatMap.set(`booking-${booking.id}`, {
            id: booking.id,
            type: 'booking',
            propertyId: booking.property_id,
            bookingId: booking.id,
            title: booking.guest_name || 'Guest',
            titleRu: booking.guest_name || undefined,
            propertyTitle: property?.title,
            propertyTitleRu: property?.title_ru || undefined,
            coverImage: property?.cover_image || undefined,
            lastMessage: bMessages[0]?.message,
            lastMessageTime: bMessages[0]?.created_at || booking.check_in,
            unreadCount,
            // Booking details
            guestName: booking.guest_name || undefined,
            guestPhone: booking.guest_phone || undefined,
            checkIn: booking.check_in || undefined,
            checkOut: booking.check_out || undefined,
            bookingStatus: booking.status || undefined,
          });
        }
      });

      // Sort by last message time (most recent first)
      return Array.from(chatMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    },
    enabled: !!user,
    ...CACHE_PROFILES.DYNAMIC,
  });

  const totalUnread = chats?.reduce((sum, chat) => sum + chat.unreadCount, 0) || 0;

  return {
    chats,
    isLoading,
    totalUnread,
    refetch,
  };
}

// Hook for support/admin chat
export function useSupportChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['support-chat', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get owner's own messages to support
      const { data: ownMessages, error } = await supabase
        .from('property_chat_messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('sender_type', 'owner')
        .is('property_id', null)
        .is('booking_id', null)
        .order('created_at', { ascending: true });

      // Get support replies addressed to this user (via metadata.recipient_id)
      const { data: supportReplies, error: replyError } = await supabase
        .from('property_chat_messages')
        .select('*')
        .eq('sender_type', 'support')
        .is('property_id', null)
        .is('booking_id', null)
        .order('created_at', { ascending: true });

      if (error || replyError) throw error || replyError;

      // Filter support replies to only include those addressed to this user
      const filteredSupportReplies = (supportReplies || []).filter(reply => {
        // Check if reply has recipient_id in metadata/attachments
        const metadata = reply.attachments as Record<string, unknown> | null;
        return metadata?.recipient_id === user.id;
      });

      // Merge and sort by creation time
      const allMessages = [...(ownMessages || []), ...filteredSupportReplies].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      return allMessages as PropertyChatMessage[];
    },
    enabled: !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_chat_messages')
        .insert({
          sender_id: user.id,
          sender_name: user.email || 'Owner',
          sender_type: 'owner',
          message,
          property_id: null,
          booking_id: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PropertyChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-chat', user?.id] });
    },
  });

  // Realtime subscription for support messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`support_chat_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as PropertyChatMessage;
          if (
            (newMessage.sender_id === user.id || newMessage.sender_type === 'support') &&
            !newMessage.property_id &&
            !newMessage.booking_id
          ) {
            queryClient.invalidateQueries({ queryKey: ['support-chat', user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
  };
}
