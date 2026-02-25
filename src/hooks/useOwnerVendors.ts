import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type VendorCategory = 'cleaning' | 'plumbing' | 'electrical' | 'ac' | 'pest' | 'garden' | 'pool' | 'security' | 'appliances' | 'handyman' | 'other';

export const VENDOR_CATEGORIES: { value: VendorCategory; en: string; ru: string }[] = [
  { value: 'cleaning', en: 'Cleaning', ru: 'Уборка' },
  { value: 'plumbing', en: 'Plumbing', ru: 'Сантехника' },
  { value: 'electrical', en: 'Electrical', ru: 'Электрика' },
  { value: 'ac', en: 'Air Conditioning', ru: 'Кондиционеры' },
  { value: 'pest', en: 'Pest Control', ru: 'Дезинсекция' },
  { value: 'garden', en: 'Garden', ru: 'Сад' },
  { value: 'pool', en: 'Pool', ru: 'Бассейн' },
  { value: 'security', en: 'Security', ru: 'Охрана' },
  { value: 'appliances', en: 'Appliances', ru: 'Техника' },
  { value: 'handyman', en: 'Handyman', ru: 'Мастер на все руки' },
  { value: 'other', en: 'Other', ru: 'Другое' },
];

export interface OwnerVendor {
  id: string;
  owner_id: string;
  name: string;
  name_ru: string | null;
  category: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  line_id: string | null;
  address: string | null;
  photo_url: string | null;
  notes: string | null;
  source: string | null;
  is_favorite: boolean;
  is_active: boolean;
  avg_rating: number | null;
  total_jobs: number | null;
  created_at: string;
  updated_at: string;
}

export type VendorInsert = Omit<OwnerVendor, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'avg_rating' | 'total_jobs'>;

const KEY = 'owner-service-vendors';

export function useOwnerVendors() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: vendors, isLoading } = useQuery({
    queryKey: [KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_service_vendors')
        .select('*')
        .order('is_favorite', { ascending: false })
        .order('name');
      if (error) throw error;
      return data as OwnerVendor[];
    },
    enabled: !!user,
  });

  const createVendor = useMutation({
    mutationFn: async (input: Partial<VendorInsert> & { name: string }) => {
      const { data, error } = await supabase
        .from('owner_service_vendors')
        .insert({ ...input, owner_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });

  const updateVendor = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<VendorInsert>) => {
      const { error } = await supabase
        .from('owner_service_vendors')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });

  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owner_service_vendors')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from('owner_service_vendors')
        .update({ is_favorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });

  return { vendors, isLoading, createVendor, updateVendor, deleteVendor, toggleFavorite };
}
