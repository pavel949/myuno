import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export interface MCSubscriptionInfo {
  paid_slots: number;
  used_slots: number;
  can_activate_more: boolean;
  available_slots: number;
  subscription_status: string;
  subscription_end: string | null;
}

export interface MCPropertySlot {
  id: string;
  company_id: string;
  property_id: string;
  is_active: boolean;
  activated_at: string;
  deactivated_at: string | null;
}

export function useMCSubscription() {
  const { activeCompany } = useActiveCompany();
  const companyId = activeCompany?.company_id;
  const queryClient = useQueryClient();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['mc-subscription', companyId],
    queryFn: async (): Promise<MCSubscriptionInfo> => {
      const { data, error } = await supabase.functions.invoke('check-mc-subscription', {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data as MCSubscriptionInfo;
    },
    enabled: !!companyId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: slots = [] } = useQuery({
    queryKey: ['mc-property-slots', companyId],
    queryFn: async (): Promise<MCPropertySlot[]> => {
      const { data, error } = await supabase
        .from('mc_property_slots')
        .select('*')
        .eq('company_id', companyId!)
        .order('activated_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MCPropertySlot[];
    },
    enabled: !!companyId,
  });

  const isPropertyActive = (propertyId: string): boolean => {
    return slots.some(s => s.property_id === propertyId && s.is_active);
  };

  const activateProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      if (!companyId) throw new Error('No active company');
      const { error } = await supabase
        .from('mc_property_slots')
        .upsert({
          company_id: companyId,
          property_id: propertyId,
          is_active: true,
          activated_at: new Date().toISOString(),
          deactivated_at: null,
        }, { onConflict: 'property_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-property-slots', companyId] });
      queryClient.invalidateQueries({ queryKey: ['mc-subscription', companyId] });
      toast.success('Property activated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateProperty = useMutation({
    mutationFn: async (propertyId: string) => {
      const { error } = await supabase
        .from('mc_property_slots')
        .update({ is_active: false, deactivated_at: new Date().toISOString() })
        .eq('property_id', propertyId)
        .eq('company_id', companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mc-property-slots', companyId] });
      queryClient.invalidateQueries({ queryKey: ['mc-subscription', companyId] });
      toast.success('Property deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createCheckout = async (quantity: number) => {
    if (!companyId) return;
    const { data, error } = await supabase.functions.invoke('create-mc-subscription', {
      body: { company_id: companyId, quantity },
    });
    if (error) { toast.error('Failed to create checkout'); return; }
    if (data?.url) {
      window.location.href = data.url;
    } else if (data?.updated) {
      toast.success(`Slots updated to ${data.paid_slots}`);
      queryClient.invalidateQueries({ queryKey: ['mc-subscription', companyId] });
    }
  };

  const openBillingPortal = async () => {
    if (!companyId) return;
    const { data, error } = await supabase.functions.invoke('mc-customer-portal', {
      body: { company_id: companyId },
    });
    if (error) { toast.error('Failed to open billing portal'); return; }
    if (data?.url) window.open(data.url, '_blank');
  };

  return {
    subscription: subscription ?? null,
    slots,
    isLoading,
    isPropertyActive,
    activateProperty: activateProperty.mutate,
    deactivateProperty: deactivateProperty.mutate,
    createCheckout,
    openBillingPortal,
    paidSlots: subscription?.paid_slots ?? 0,
    usedSlots: subscription?.used_slots ?? 0,
    canActivateMore: subscription?.can_activate_more ?? false,
  };
}
