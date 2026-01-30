import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address_text: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAddressData {
  label?: string;
  recipient_name: string;
  phone: string;
  address_text: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

export interface UpdateAddressData extends Partial<CreateAddressData> {
  id: string;
}

export function useUserAddresses() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch all addresses for user
  const { data: addresses = [], isLoading, error } = useQuery({
    queryKey: ['user-addresses', user?.id],
    queryFn: async (): Promise<UserAddress[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get default address
  const defaultAddress = addresses.find(a => a.is_default) || addresses[0] || null;

  // Create new address
  const createMutation = useMutation({
    mutationFn: async (data: CreateAddressData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('user_addresses')
        .insert({
          user_id: user.id,
          label: data.label || 'Home',
          recipient_name: data.recipient_name,
          phone: data.phone,
          address_text: data.address_text,
          city: data.city,
          postal_code: data.postal_code,
          country: data.country || 'Thailand',
          is_default: data.is_default ?? (addresses.length === 0),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      toast.success(language === 'ru' ? 'Адрес сохранён' : 'Address saved');
    },
    onError: (error) => {
      console.error('Create address error:', error);
      toast.error(language === 'ru' ? 'Ошибка сохранения адреса' : 'Failed to save address');
    },
  });

  // Update address
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: UpdateAddressData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('user_addresses')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      toast.success(language === 'ru' ? 'Адрес обновлён' : 'Address updated');
    },
    onError: (error) => {
      console.error('Update address error:', error);
      toast.error(language === 'ru' ? 'Ошибка обновления адреса' : 'Failed to update address');
    },
  });

  // Delete address
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
      toast.success(language === 'ru' ? 'Адрес удалён' : 'Address deleted');
    },
    onError: (error) => {
      console.error('Delete address error:', error);
      toast.error(language === 'ru' ? 'Ошибка удаления адреса' : 'Failed to delete address');
    },
  });

  // Set as default
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', user?.id] });
    },
  });

  return {
    addresses,
    defaultAddress,
    isLoading,
    error,
    createAddress: createMutation.mutate,
    createAddressAsync: createMutation.mutateAsync,
    updateAddress: updateMutation.mutate,
    updateAddressAsync: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutate,
    setDefault: setDefaultMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
