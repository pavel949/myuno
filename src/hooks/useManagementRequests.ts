import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type RequestType = 'add_property' | 'request_management' | 'transfer_ownership' | 'invite_delegate';
export type RequesterType = 'owner' | 'manager' | 'agency';
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface ManagementRequest {
  id: string;
  property_id: string | null;
  requester_id: string;
  requester_type: RequesterType;
  target_email: string;
  target_user_id: string | null;
  request_type: RequestType;
  proposed_terms: Record<string, any>;
  proposed_role: string;
  proposed_permissions: {
    view: boolean;
    edit: boolean;
    financial: boolean;
    bookings: boolean;
  };
  message: string | null;
  status: RequestStatus;
  response_message: string | null;
  responded_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: {
    id: string;
    title: string;
    title_ru: string | null;
  } | null;
  requester?: {
    email: string;
    user_metadata: Record<string, any>;
  } | null;
}

export interface CreateRequestInput {
  property_id?: string;
  target_email: string;
  request_type: RequestType;
  requester_type: RequesterType;
  proposed_role?: string;
  proposed_permissions?: Partial<ManagementRequest['proposed_permissions']>;
  proposed_terms?: Record<string, any>;
  message?: string;
}

// Fetch incoming requests (where user is the target)
export function useIncomingRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-requests', 'incoming', user?.id],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('property_management_requests')
        .select(`
          *,
          property:owner_properties(id, title, title_ru)
        `)
        .or(`target_email.eq.${user.email},target_user_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ManagementRequest[];
    },
    enabled: !!user,
  });
}

// Fetch outgoing requests (where user is the requester)
export function useOutgoingRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-requests', 'outgoing', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('property_management_requests')
        .select(`
          *,
          property:owner_properties(id, title, title_ru)
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ManagementRequest[];
    },
    enabled: !!user,
  });
}

// Create a new management request
export function useCreateManagementRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_management_requests')
        .insert({
          ...input,
          requester_id: user.id,
          proposed_permissions: {
            view: true,
            edit: false,
            financial: false,
            bookings: false,
            ...input.proposed_permissions,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-requests'] });
      toast.success('Приглашение отправлено');
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

// Respond to a request (accept/decline)
export function useRespondToRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      status, 
      response_message 
    }: { 
      requestId: string; 
      status: 'accepted' | 'declined'; 
      response_message?: string;
    }) => {
      const { data, error } = await supabase
        .from('property_management_requests')
        .update({
          status,
          response_message,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // If accepted, create the delegate relationship
      if (status === 'accepted' && data) {
        const request = data as unknown as ManagementRequest;
        
        if (request.property_id) {
          const { error: delegateError } = await supabase
            .from('property_delegates')
            .insert({
              property_id: request.property_id,
              user_id: request.target_user_id,
              invited_email: request.target_email,
              role: request.proposed_role,
              permissions: request.proposed_permissions,
              invited_by: request.requester_id,
              status: 'active',
            });

          if (delegateError) throw delegateError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['management-requests'] });
      queryClient.invalidateQueries({ queryKey: ['property-delegates'] });
      
      if (variables.status === 'accepted') {
        toast.success('Приглашение принято');
      } else {
        toast.info('Приглашение отклонено');
      }
    },
    onError: (error) => {
      toast.error('Ошибка: ' + error.message);
    },
  });
}

// Cancel a request (by requester)
export function useCancelRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('property_management_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['management-requests'] });
      toast.info('Приглашение отменено');
    },
  });
}

// Get pending requests count (for badges)
export function usePendingRequestsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['management-requests', 'count', user?.id],
    queryFn: async () => {
      if (!user?.email) return 0;

      const { count, error } = await supabase
        .from('property_management_requests')
        .select('*', { count: 'exact', head: true })
        .or(`target_email.eq.${user.email},target_user_id.eq.${user.id}`)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}
