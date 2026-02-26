import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PropertyOwnershipInvite {
  id: string;
  property_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_name: string | null;
  invite_type: 'ownership_transfer' | 'delegate';
  delegate_role: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  property?: {
    id: string;
    title: string;
    cover_image: string | null;
    address: string | null;
  };
}

/**
 * Hook for managing property ownership invitations
 */
export function usePropertyOwnershipInvites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending invites for current user (by email)
  const { data: pendingInvites, isLoading } = useQuery({
    queryKey: ['property-ownership-invites', user?.email],
    queryFn: async (): Promise<PropertyOwnershipInvite[]> => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from('property_ownership_invites')
        .select(`
          *,
          property:owner_properties!property_id(id, title, cover_image, address)
        `)
        .eq('invitee_email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return (data || []) as unknown as PropertyOwnershipInvite[];
    },
    enabled: !!user?.email,
  });

  // Accept an ownership transfer invitation
  const acceptInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the invite details
      const { data: invite, error: inviteError } = await supabase
        .from('property_ownership_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError) throw inviteError;
      if (!invite) throw new Error('Invite not found');

      // Update invite status
      const { error: updateInviteError } = await supabase
        .from('property_ownership_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', inviteId);

      if (updateInviteError) throw updateInviteError;

      // Transfer ownership if this is an ownership_transfer invite
      if (invite.invite_type === 'ownership_transfer') {
        const { error: transferError } = await supabase
          .from('properties')
          .update({
            owner_id: user.id,
            created_on_behalf: false,
            ownership_transferred_at: new Date().toISOString(),
          } as any)
          .eq('id', invite.property_id);

        if (transferError) throw transferError;

        // Create delegate entry for original creator (as trustee)
        await supabase
          .from('property_delegates')
          .insert({
            property_id: invite.property_id,
            user_id: invite.inviter_id,
            invited_by: user.id,
            role: 'trustee',
            status: 'active',
            permissions: {
              view: true,
              edit: true,
              financials: true,
              bookings: true,
              maintenance: true,
            },
          });
      }

      return invite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-ownership-invites'] });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    },
  });

  // Decline an invitation
  const declineInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('property_ownership_invites')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-ownership-invites'] });
    },
  });

  return {
    pendingInvites: pendingInvites || [],
    isLoading,
    acceptInvite: acceptInvite.mutateAsync,
    declineInvite: declineInvite.mutateAsync,
    isAccepting: acceptInvite.isPending,
    isDeclining: declineInvite.isPending,
  };
}

/**
 * Hook for sending property ownership invitations
 */
export function useSendOwnershipInvite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      propertyId: string;
      inviteeEmail: string;
      inviteeName?: string;
      inviteType: 'ownership_transfer' | 'delegate';
      delegateRole?: string;
      message?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('property_ownership_invites')
        .insert({
          property_id: input.propertyId,
          inviter_id: user.id,
          invitee_email: input.inviteeEmail,
          invitee_name: input.inviteeName,
          invite_type: input.inviteType,
          delegate_role: input.delegateRole,
          message: input.message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-ownership-invites'] });
    },
  });
}

/**
 * Hook for transferring property ownership
 */
export function useTransferOwnership() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      propertyId: string;
      newOwnerEmail: string;
      newOwnerName?: string;
      keepAsDelegate?: boolean;
      delegateRole?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create ownership transfer invite
      const { data: invite, error: inviteError } = await supabase
        .from('property_ownership_invites')
        .insert({
          property_id: input.propertyId,
          inviter_id: user.id,
          invitee_email: input.newOwnerEmail,
          invitee_name: input.newOwnerName,
          invite_type: 'ownership_transfer',
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Update property to mark as pending transfer
      const { error: propertyError } = await supabase
        .from('properties')
        .update({
          actual_owner_email: input.newOwnerEmail,
          actual_owner_name: input.newOwnerName,
          created_on_behalf: true,
        } as any)
        .eq('id', input.propertyId);

      if (propertyError) throw propertyError;

      return invite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-ownership-invites'] });
    },
  });
}
