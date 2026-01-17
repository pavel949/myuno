import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Yacht } from './useYachts';

export function useVendorYachts(providerId?: string) {
  const { user } = useAuth();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchYachts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase.from('yachts').select('*');
    
    if (providerId) {
      query = query.eq('provider_id', providerId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (!error && data) setYachts(data as Yacht[]);
    setIsLoading(false);
  }, [user, providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user) return;
      if (isMounted) setIsLoading(true);
      
      let query = supabase.from('yachts').select('*');
      
      if (providerId) {
        query = query.eq('provider_id', providerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (isMounted) {
        if (!error && data) setYachts(data as Yacht[]);
        setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [user, providerId]);

  const createYacht = async (yachtData: Partial<Yacht> & { provider_id?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    const insertData = { ...yachtData };
    if (providerId) {
      insertData.provider_id = providerId;
    }
    const { data, error } = await supabase
      .from('yachts')
      .insert(insertData as any)
      .select()
      .single();
    
    if (!error) await fetchYachts();
    return { data, error };
  };

  const updateYacht = async (id: string, yachtData: Partial<Yacht>) => {
    const { data, error } = await supabase
      .from('yachts')
      .update(yachtData as any)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) await fetchYachts();
    return { data, error };
  };

  const deleteYacht = async (id: string) => {
    const { error } = await supabase
      .from('yachts')
      .delete()
      .eq('id', id);
    
    if (!error) await fetchYachts();
    return { error };
  };

  return { yachts, isLoading, createYacht, updateYacht, deleteYacht, refetch: fetchYachts };
}
