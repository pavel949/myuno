import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorActivity {
  id: string;
  provider_id?: string;
  title_en: string;
  title_ru: string;
  description_en?: string;
  description_ru?: string;
  category: string;
  difficulty?: string;
  duration_minutes?: number;
  price?: number;
  price_per?: string;
  currency?: string;
  min_participants?: number;
  max_participants?: number;
  age_restriction?: number;
  meeting_point?: string;
  meeting_point_lat?: number;
  meeting_point_lng?: number;
  location_name?: string;
  includes?: string[];
  requirements?: string[];
  equipment_included?: boolean;
  is_certified?: boolean;
  certification_details?: string;
  safety_briefing_required?: boolean;
  cover_image?: string;
  images?: string[];
  available_days?: string[];
  available_times?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export function useVendorActivities(providerId?: string) {
  const [activities, setActivities] = useState<VendorActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    if (!providerId) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('water_activities')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities((data || []) as unknown as VendorActivity[]);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!providerId) {
        if (isMounted) {
          setActivities([]);
          setIsLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setIsLoading(true);
        const { data, error } = await supabase
          .from('water_activities')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) setActivities((data || []) as unknown as VendorActivity[]);
      } catch (err) {
        console.error('Error fetching activities:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [providerId]);

  const createActivity = async (activityData: Partial<VendorActivity>) => {
    if (!providerId) return { error: new Error('No provider ID') };

    const insertData = { ...activityData, provider_id: providerId };
    const { data, error } = await supabase
      .from('water_activities')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchActivities();
    return { data, error };
  };

  const updateActivity = async (activityId: string, updates: Partial<VendorActivity>) => {
    const { data, error } = await supabase
      .from('water_activities')
      .update(updates)
      .eq('id', activityId)
      .select()
      .single();

    if (!error) await fetchActivities();
    return { data, error };
  };

  const deleteActivity = async (activityId: string) => {
    const { error } = await supabase
      .from('water_activities')
      .delete()
      .eq('id', activityId);

    if (!error) await fetchActivities();
    return { error };
  };

  return { activities, isLoading, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}
