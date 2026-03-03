import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Json } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

export interface GuestChatMessage {
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

export interface GuestChatConversation {
  id: string;
  propertyId: string;
  bookingId?: string;
  propertyTitle: string;
  propertyTitleRu?: string;
  propertyImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  ownerName?: string;
}

/**
 * Hook for guests to chat with property owners/managers
 * Can be used for pre-booking inquiries (propertyId only) or booking-specific chats
 */
export function useGuestPropertyChat(options: { propertyId?: string; bookingId?: string }) {
  const { propertyId, bookingId } = options;
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const queryKey = ['guest-property-chat', propertyId, bookingId, user?.id];

  const { data: messages, isLoading, refetch } = useQuery({
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
        // Pre-booking inquiry: messages for this property without booking
        query = query.eq('property_id', propertyId).is('booking_id', null);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching guest chat messages:', error);
        return [];
      }
      return (data || []) as GuestChatMessage[];
    },
    enabled: !!user && (!!propertyId || !!bookingId),
  });

  const sendMessage = useMutation({
    mutationFn: async (params: {
      message: string;
      senderName?: string;
    }) => {
      if (!user) throw new Error('Требуется авторизация / Authentication required');
      if (!propertyId && !bookingId) throw new Error('Property or booking ID required');

      const { data, error } = await supabase
        .from('property_chat_messages')
        .insert({
          property_id: propertyId || null,
          booking_id: bookingId || null,
          sender_id: user.id,
          sender_name: params.senderName || user.email?.split('@')[0] || 'Guest',
          sender_type: 'guest',
          message: params.message,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify owner via email (fire-and-forget)
      if (propertyId) {
        supabase.functions
          .invoke('notify-chat-message', {
            body: {
              propertyId,
              senderName: params.senderName || user.email?.split('@')[0] || 'Guest',
              messagePreview: params.message,
            },
          })
          .catch((err) => console.warn('[Chat Notify] Error:', err));
      }

      // AI chat moderation (fire-and-forget)
      if (data?.id && propertyId) {
        supabase.functions
          .invoke('ai-chat-moderator', {
            body: {
              message: params.message,
              messageId: data.id,
              propertyId,
              bookingId: bookingId || null,
              senderId: user.id,
            },
          })
          .catch((err) => console.warn('[AI Moderation] Error:', err));
      }

      // Trigger AI auto-reply asynchronously (fire-and-forget)
      if (propertyId) {
        triggerAutoReply(propertyId, bookingId, params.message, params.senderName);
      }

      return data as GuestChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // AI auto-reply trigger (non-blocking)
  const triggerAutoReply = useCallback(
    (propId: string, bId?: string, guestMsg?: string, gName?: string) => {
      supabase.functions
        .invoke('ai-guest-autoreply', {
          body: {
            propertyId: propId,
            bookingId: bId || undefined,
            guestMessage: guestMsg || '',
            guestName: gName || undefined,
            language: language,
          },
        })
        .then(({ error }) => {
          if (error) console.warn('[AI AutoReply] Skipped or failed:', error.message);
        })
        .catch((err) => {
          console.warn('[AI AutoReply] Network error:', err);
        });
    },
    [language]
  );

  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!user || messageIds.length === 0) return;
      
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
      .channel(`guest_chat_${propertyId || bookingId}_${user.id}`)
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

  // Mark messages as read when viewing
  useEffect(() => {
    if (!user || !messages || messages.length === 0) return;

    const unreadFromOthers = messages
      .filter(m => !m.is_read && m.sender_id !== user.id)
      .map(m => m.id);

    if (unreadFromOthers.length > 0) {
      markAsRead.mutate(unreadFromOthers);
    }
  }, [messages, user]);

  return {
    messages: messages || [],
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    refetch,
  };
}

/**
 * Hook for fetching all guest's chat conversations
 */
export function useGuestChatList() {
  const { user } = useAuth();

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['guest-chat-list', user?.id],
    queryFn: async (): Promise<GuestChatConversation[]> => {
      if (!user) return [];

      // Get all messages where user is sender
      const { data: myMessages, error } = await supabase
        .from('property_chat_messages')
        .select('property_id, booking_id, message, created_at, is_read, sender_id, sender_type')
        .eq('sender_id', user.id)
        .eq('sender_type', 'guest')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching guest conversations:', error);
        return [];
      }

      if (!myMessages || myMessages.length === 0) return [];

      // Get unique property IDs
      const propertyIds = [...new Set(myMessages.filter(m => m.property_id).map(m => m.property_id))];
      
      if (propertyIds.length === 0) return [];

      // Fetch property details
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image')
        .in('id', propertyIds as string[]);

      // Get all messages for these properties to check unread count and last message
      const { data: allMessages } = await supabase
        .from('property_chat_messages')
        .select('property_id, booking_id, message, created_at, is_read, sender_id, sender_type')
        .in('property_id', propertyIds as string[])
        .order('created_at', { ascending: false });

      // Build conversation list
      const conversationMap = new Map<string, GuestChatConversation>();

      propertyIds.forEach(propId => {
        if (!propId) return;
        
        const property = properties?.find(p => p.id === propId);
        const propMessages = allMessages?.filter(m => m.property_id === propId && !m.booking_id) || [];
        const unreadCount = propMessages.filter(m => !m.is_read && m.sender_id !== user.id).length;
        const lastMsg = propMessages[0];

        conversationMap.set(`property-${propId}`, {
          id: propId,
          propertyId: propId,
          propertyTitle: property?.title_en || 'Property',
          propertyTitleRu: property?.title_ru || undefined,
          propertyImage: property?.cover_image || undefined,
          lastMessage: lastMsg?.message,
          lastMessageTime: lastMsg?.created_at,
          unreadCount,
        });
      });

      return Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()
      );
    },
    enabled: !!user,
  });

  const totalUnread = conversations?.reduce((sum, c) => sum + c.unreadCount, 0) || 0;

  return {
    conversations: conversations || [],
    isLoading,
    totalUnread,
    refetch,
  };
}
