import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  booking_id: string | null;
  sender_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  is_support: boolean;
  sender_type: 'user' | 'support' | 'provider';
}

export interface SupportConversation {
  id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

// UNO Support WhatsApp number
export const UNO_WHATSAPP = '+66922407355';

export const openWhatsApp = (message?: string) => {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  const url = `https://wa.me/${UNO_WHATSAPP.replace('+', '')}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
  window.open(url, '_blank');
};

export const useChat = (bookingId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (bookingId) {
        // Fetch booking-specific messages
        const { data, error } = await supabase
          .from('booking_messages')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedMessages: ChatMessage[] = (data || []).map(msg => ({
          id: msg.id,
          booking_id: msg.booking_id,
          sender_id: msg.sender_id,
          message: msg.message,
          is_read: msg.is_read || false,
          created_at: msg.created_at,
          is_support: false,
          sender_type: msg.sender_id === user.id ? 'user' : 'provider'
        }));

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, bookingId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim()) return false;

    try {
      if (bookingId) {
        const { error } = await supabase
          .from('booking_messages')
          .insert({
            booking_id: bookingId,
            sender_id: user.id,
            message: text.trim()
          });

        if (error) throw error;
        await fetchMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [user, bookingId, fetchMessages]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates for booking messages
  useEffect(() => {
    if (!user || !bookingId) return;

    const channel = supabase
      .channel(`booking_messages_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, bookingId, fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    refetch: fetchMessages,
    openWhatsApp
  };
};

export const useSupportChat = () => {
  const { user } = useAuth();
  
  const startSupportChat = useCallback((topic?: string) => {
    const greeting = topic 
      ? `Здравствуйте! У меня вопрос по теме: ${topic}`
      : 'Здравствуйте! Мне нужна помощь.';
    openWhatsApp(greeting);
  }, []);

  return {
    startSupportChat,
    openWhatsApp,
    whatsappNumber: UNO_WHATSAPP
  };
};
