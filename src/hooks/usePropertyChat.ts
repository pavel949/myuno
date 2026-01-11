import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';

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
      const { error } = await supabase
        .from('property_chat_messages')
        .update({ is_read: true })
        .in('id', messageIds);

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

// Hook for fetching all chats for owner
export function useOwnerChats() {
  const { user } = useAuth();

  const { data: chats, isLoading } = useQuery({
    queryKey: ['owner-chats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get properties with their latest messages
      const { data: properties, error: propError } = await supabase
        .from('owner_properties')
        .select('id, title, title_ru, cover_image')
        .eq('owner_id', user.id);

      if (propError) throw propError;

      // Get latest message for each property/booking
      const { data: messages, error: msgError } = await supabase
        .from('property_chat_messages')
        .select('property_id, booking_id, message, created_at, is_read, sender_type')
        .in('property_id', properties?.map(p => p.id) || [])
        .order('created_at', { ascending: false });

      if (msgError) throw msgError;

      // Group by property/booking
      const chatMap = new Map<string, {
        id: string;
        type: 'property' | 'booking';
        propertyId: string;
        bookingId?: string;
        title: string;
        titleRu?: string;
        coverImage?: string;
        lastMessage?: string;
        lastMessageTime?: string;
        unreadCount: number;
      }>();

      properties?.forEach(prop => {
        const propMessages = messages?.filter(m => m.property_id === prop.id && !m.booking_id) || [];
        const unreadCount = propMessages.filter(m => !m.is_read && m.sender_type !== 'owner').length;
        
        if (propMessages.length > 0) {
          chatMap.set(`property-${prop.id}`, {
            id: prop.id,
            type: 'property',
            propertyId: prop.id,
            title: prop.title,
            titleRu: prop.title_ru,
            coverImage: prop.cover_image,
            lastMessage: propMessages[0]?.message,
            lastMessageTime: propMessages[0]?.created_at,
            unreadCount,
          });
        }
      });

      // Also group booking chats
      const bookingMessages = messages?.filter(m => m.booking_id) || [];
      const bookingIds = [...new Set(bookingMessages.map(m => m.booking_id))].filter(Boolean);
      
      if (bookingIds.length > 0) {
        const { data: bookings } = await supabase
          .from('property_bookings')
          .select('id, property_id, guest_name, check_in, check_out')
          .in('id', bookingIds);

        bookings?.forEach(booking => {
          const bMessages = bookingMessages.filter(m => m.booking_id === booking.id);
          const unreadCount = bMessages.filter(m => !m.is_read && m.sender_type !== 'owner').length;
          const property = properties?.find(p => p.id === booking.property_id);

          chatMap.set(`booking-${booking.id}`, {
            id: booking.id,
            type: 'booking',
            propertyId: booking.property_id,
            bookingId: booking.id,
            title: booking.guest_name || 'Guest',
            titleRu: booking.guest_name,
            coverImage: property?.cover_image,
            lastMessage: bMessages[0]?.message,
            lastMessageTime: bMessages[0]?.created_at,
            unreadCount,
          });
        });
      }

      return Array.from(chatMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    },
    enabled: !!user,
  });

  const totalUnread = chats?.reduce((sum, chat) => sum + chat.unreadCount, 0) || 0;

  return {
    chats,
    isLoading,
    totalUnread,
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

      const { data, error } = await supabase
        .from('property_chat_messages')
        .select('*')
        .eq('sender_id', user.id)
        .eq('sender_type', 'owner')
        .is('property_id', null)
        .is('booking_id', null)
        .order('created_at', { ascending: true });

      // Also get support replies
      const { data: supportReplies, error: replyError } = await supabase
        .from('property_chat_messages')
        .select('*')
        .eq('sender_type', 'support')
        .is('property_id', null)
        .is('booking_id', null)
        .order('created_at', { ascending: true });

      if (error || replyError) throw error || replyError;

      // Merge and sort
      const allMessages = [...(data || []), ...(supportReplies || [])].sort(
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
