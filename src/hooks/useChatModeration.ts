import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeMessage, ModerationResult } from '@/lib/chatModerationPatterns';
import { toast } from 'sonner';

export interface ChatMessageFlag {
  id: string;
  message_id: string;
  property_id: string;
  booking_id: string | null;
  flag_type: string;
  severity: string;
  detected_pattern: string | null;
  confidence_score: number | null;
  auto_detected: boolean;
  status: string;
  created_at: string;
}

/**
 * Hook for chat moderation functionality
 * - Analyzes messages for policy violations
 * - Tracks user violation history
 * - Manages chat delegation to platform
 */
export function useChatModeration(propertyId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Analyze message before sending
  const analyzeBeforeSend = (message: string): ModerationResult => {
    return analyzeMessage(message);
  };

  // Log a violation flag
  const logViolation = useMutation({
    mutationFn: async (params: {
      messageId: string;
      propertyId: string;
      bookingId?: string;
      result: ModerationResult;
    }) => {
      if (!params.result.isViolation || !params.result.type) return null;

      const { data, error } = await supabase
        .from('chat_message_flags')
        .insert({
          message_id: params.messageId,
          property_id: params.propertyId,
          booking_id: params.bookingId || null,
          flag_type: params.result.type,
          severity: params.result.severity,
          detected_pattern: params.result.detectedPattern,
          confidence_score: params.result.confidence,
          auto_detected: true,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get property delegation status
  const { data: delegationStatus } = useQuery({
    queryKey: ['property-delegation', propertyId],
    queryFn: async () => {
      if (!propertyId) return { isDelegated: false };

      const { data, error } = await supabase
        .from('properties')
        .select('chat_delegated_to_platform')
        .eq('id', propertyId)
        .single();

      if (error) return { isDelegated: false };
      return { isDelegated: data?.chat_delegated_to_platform || false };
    },
    enabled: !!propertyId,
  });

  // Toggle chat delegation
  const toggleDelegation = useMutation({
    mutationFn: async (params: { propertyId: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('properties')
        .update({ chat_delegated_to_platform: params.enabled } as Record<string, unknown>)
        .eq('id', params.propertyId);

      if (error) throw error;
      return params.enabled;
    },
    onSuccess: (enabled) => {
      queryClient.invalidateQueries({ queryKey: ['property-delegation', propertyId] });
      toast.success(
        enabled 
          ? 'Чат делегирован команде myUNO' 
          : 'Делегирование чата отключено'
      );
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });

  // Get flags for a property
  const { data: propertyFlags } = useQuery({
    queryKey: ['chat-flags', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];

      const { data, error } = await supabase
        .from('chat_message_flags')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) return [];
      return data as ChatMessageFlag[];
    },
    enabled: !!propertyId && !!user,
  });

  // Check user violation history
  const { data: userViolations } = useQuery({
    queryKey: ['user-violations', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('chat_violation_history')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('chat_violation_history query error:', error.message);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  return {
    // Analysis
    analyzeBeforeSend,
    logViolation: logViolation.mutateAsync,
    
    // Delegation
    isDelegated: delegationStatus?.isDelegated || false,
    toggleDelegation: (enabled: boolean) => {
      if (propertyId) {
        toggleDelegation.mutate({ propertyId, enabled });
      }
    },
    isTogglingDelegation: toggleDelegation.isPending,
    
    // Flags & History
    propertyFlags: propertyFlags || [],
    userViolations,
    warningLevel: userViolations?.warning_level || 0,
    isRestricted: userViolations?.is_restricted || false,
  };
}

export default useChatModeration;
