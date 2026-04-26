/**
 * @module usePortalChat
 * Real-time chat hook for Owner Portal (owner <-> MC communication).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface PortalMessage {
  id: string;
  property_id: string;
  sender_id: string;
  sender_role: 'owner' | 'mc';
  message: string;
  is_read: boolean;
  created_at: string;
}

export function usePortalChat(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['portal-chat', propertyId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<PortalMessage[]> => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('portal_messages')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as PortalMessage[];
    },
    enabled: !!propertyId && !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!propertyId) return;
    const channel = supabase
      .channel(`portal-chat-${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_messages',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          queryClient.setQueryData(queryKey, (old: PortalMessage[] | undefined) => {
            const newMsg = payload.new as PortalMessage;
            if (!old) return [newMsg];
            // Avoid duplicates
            if (old.some(m => m.id === newMsg.id)) return old;
            return [...old, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (args: { message: string; senderRole: 'owner' | 'mc' }) => {
      if (!propertyId || !user) throw new Error('Missing context');
      const { data, error } = await (supabase as any)
        .from('portal_messages')
        .insert({
          property_id: propertyId,
          sender_id: user.id,
          sender_role: args.senderRole,
          message: args.message,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageIds: string[]) => {
      if (!messageIds.length) return;
      const { error } = await (supabase as any)
        .from('portal_messages')
        .update({ is_read: true })
        .in('id', messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    sendMessage: sendMessage.mutateAsync,
    isSending: sendMessage.isPending,
    markAsRead: markAsRead.mutateAsync,
  };
}
