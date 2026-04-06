import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface TeamChannel {
  id: string;
  slug: string;
  name_en: string;
  name_ru: string;
  description: string | null;
  icon: string;
  allowed_specializations: string[];
  is_private: boolean;
  is_announcements_only: boolean;
  created_at: string;
}

export interface TeamMessage {
  id: string;
  sender_id: string;
  channel: string;
  content: string;
  reply_to: string | null;
  attachments: unknown;
  is_pinned: boolean;
  reactions: unknown;
  mentioned_users: string[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  sender?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Hook for team chat channels
 */
export function useTeamChannels() {
  const { data: channels, isLoading } = useQuery({
    queryKey: ['team-channels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_channels')
        .select('*')
        .order('slug');

      if (error) throw error;
      return (data || []) as TeamChannel[];
    },
  });

  return { channels, isLoading };
}

/**
 * Hook for team chat messages in a channel
 */
export function useTeamMessages(channelSlug: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<TeamMessage[]>([]);

  // Fetch initial messages
  const { data: initialMessages, isLoading } = useQuery({
    queryKey: ['team-messages', channelSlug],
    queryFn: async () => {
      const { data: messagesData, error: messagesError } = await supabase
        .from('team_messages')
        .select('*')
        .eq('channel', channelSlug)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) return [];

      // Get sender details
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
      const { data: membersData } = await supabase
        .from('team_members')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds);

      // Combine data
      const messages = messagesData.map(m => {
        const sender = membersData?.find(member => member.user_id === m.sender_id);
        return {
          ...m,
          reactions: (m.reactions || {}) as unknown,
          attachments: m.attachments as unknown,
          sender: sender ? {
            display_name: sender.display_name,
            avatar_url: sender.avatar_url,
          } : undefined,
        };
      });

      return messages.reverse();
    },
    enabled: !!channelSlug,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!channelSlug) return;

    const subscription = supabase
      .channel(`team-chat-${channelSlug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages',
          filter: `channel=eq.${channelSlug}`,
        },
        async (payload) => {
          const newMessage = payload.new as TeamMessage;
          
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('team_members')
            .select('display_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .maybeSingle();

          const messageWithSender: TeamMessage = {
            ...newMessage,
            sender: senderData || undefined,
          };

          setRealtimeMessages(prev => [...prev, messageWithSender]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelSlug]);

  // Combine initial and realtime messages
  const messages = [...(initialMessages || []), ...realtimeMessages];

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      replyTo,
      attachments = [],
      mentionedUsers = [],
    }: {
      content: string;
      replyTo?: string;
      attachments?: Record<string, unknown>[];
      mentionedUsers?: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_messages')
        .insert([{
          sender_id: user.id,
          channel: channelSlug,
          content,
          reply_to: replyTo || null,
          attachments: attachments as unknown as Json,
          mentioned_users: mentionedUsers,
        }]);

      if (error) throw error;
    },
    onError: () => {
      toast({ title: 'Ошибка отправки', variant: 'destructive' });
    },
  });

  // Add reaction mutation
  const addReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get current reactions
      const { data: message } = await supabase
        .from('team_messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      const reactions = (message?.reactions as Record<string, string[]>) || {};
      const currentUsers = reactions[emoji] || [];
      
      // Toggle user's reaction
      const updatedUsers = currentUsers.includes(user.id)
        ? currentUsers.filter(id => id !== user.id)
        : [...currentUsers, user.id];

      const updatedReactions = {
        ...reactions,
        [emoji]: updatedUsers,
      };

      // Remove emoji key if no users
      if (updatedUsers.length === 0) {
        delete updatedReactions[emoji];
      }

      const { error } = await supabase
        .from('team_messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-messages', channelSlug] });
    },
  });

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('team_messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('sender_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-messages', channelSlug] });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    addReaction: addReaction.mutateAsync,
    deleteMessage: deleteMessage.mutateAsync,
  };
}
