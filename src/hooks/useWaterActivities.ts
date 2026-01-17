import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WaterActivity {
  id: string;
  provider_id: string | null;
  title_en: string;
  title_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  cover_image: string | null;
  images: string[];
  price: number | null;
  price_per: string;
  currency: string;
  duration_minutes: number | null;
  max_participants: number;
  min_participants: number;
  difficulty: string;
  equipment_included: boolean;
  includes: string[];
  requirements: string[];
  location_name: string | null;
  meeting_point: string | null;
  meeting_point_lat: number | null;
  meeting_point_lng: number | null;
  available_times: string[];
  available_days: string[];
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  is_certified: boolean;
  certification_details: string | null;
  safety_briefing_required: boolean;
  age_restriction: number;
}

interface UseWaterActivitiesOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
}

export const useWaterActivities = (options: UseWaterActivitiesOptions = {}) => {
  const [activities, setActivities] = useState<WaterActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivities = useCallback(async (isMounted: { current: boolean }) => {
    if (isMounted.current) setIsLoading(true);
    try {
      let query = supabase.from('water_activities').select('*').eq('is_active', true);
      if (options.category) query = query.eq('category', options.category);
      if (options.featured) query = query.eq('is_featured', true);
      query = query.order('rating', { ascending: false });
      if (options.limit) query = query.limit(options.limit);

      const { data } = await query;
      if (isMounted.current) {
        const formattedActivities: WaterActivity[] = (data || []).map(activity => ({
          ...activity,
          images: activity.images || [],
          includes: activity.includes || [],
          requirements: activity.requirements || [],
          available_times: activity.available_times || [],
          available_days: activity.available_days || [],
        }));
        setActivities(formattedActivities);
      }
    } catch (err) {
      console.error('Error fetching water activities:', err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [options.category, options.featured, options.limit]);

  useEffect(() => {
    const isMounted = { current: true };
    fetchActivities(isMounted);
    return () => { isMounted.current = false; };
  }, [fetchActivities]);
  
  return { activities, isLoading, refetch: () => fetchActivities({ current: true }) };
};

export const useWaterActivity = (activityId: string | undefined) => {
  const [activity, setActivity] = useState<WaterActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!activityId) { setIsLoading(false); return; }
    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('water_activities')
          .select('*')
          .eq('id', activityId)
          .single();
        if (fetchError) throw fetchError;
        if (isMounted && data) {
          setActivity({
            ...data,
            images: data.images || [],
            includes: data.includes || [],
            requirements: data.requirements || [],
            available_times: data.available_times || [],
            available_days: data.available_days || [],
          });
        }
      } catch (err) {
        if (isMounted) setError(err as Error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchActivity();
    
    return () => { isMounted = false; };
  }, [activityId]);

  return { activity, isLoading, error };
};
