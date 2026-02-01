import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SalonStaff } from '@/components/beauty/StaffPicker';

export function useSalonStaff(salonId: string | undefined) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['salon-staff', salonId],
    queryFn: async (): Promise<SalonStaff[]> => {
      if (!salonId) return [];

      const { data, error } = await supabase
        .from('salon_staff')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) throw error;
      return (data || []) as SalonStaff[];
    },
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get available staff for a specific day
  const getAvailableStaff = useMemo(() => {
    return (dayOfWeek: string) => {
      if (!data) return [];
      
      return data.filter(staff => {
        if (!staff.working_days) return true; // Available all days if not specified
        return staff.working_days.includes(dayOfWeek.toLowerCase());
      });
    };
  }, [data]);

  // Get staff by specialization
  const getStaffBySpecialization = useMemo(() => {
    return (specialization: string) => {
      if (!data) return [];
      
      return data.filter(staff => 
        staff.specializations?.includes(specialization)
      );
    };
  }, [data]);

  return {
    staff: data || [],
    isLoading,
    error,
    getAvailableStaff,
    getStaffBySpecialization,
  };
}

// Hook to get a single staff member
export function useSalonStaffMember(staffId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ['salon-staff-member', staffId],
    queryFn: async (): Promise<SalonStaff | null> => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from('salon_staff')
        .select('*')
        .eq('id', staffId)
        .single();

      if (error) return null;
      return data as SalonStaff;
    },
    enabled: !!staffId,
  });

  return { staff: data, isLoading };
}
