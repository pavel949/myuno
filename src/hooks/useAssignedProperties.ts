/**
 * @module useAssignedProperties
 * @description Hook for property managers to fetch their assigned properties
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';

interface PropertyEmbed {
  deleted_at?: string | null;
  management_company_id?: string | null;
  title_en?: string | null;
  title_ru?: string | null;
  cover_image?: string | null;
  address?: string | null;
  district?: string | null;
  is_active?: boolean | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  price_per_night?: number | null;
  currency?: string | null;
  complex_id?: string | null;
  project_id?: string | null;
}

interface AssignmentPermissions {
  calendar?: boolean;
  pricing?: boolean;
  bookings?: boolean;
  guests?: boolean;
}

export interface AssignedProperty {
  id: string;
  property_id: string;
  title: string;
  title_ru: string;
  cover_image: string | null;
  address: string | null;
  district: string | null;
  is_active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night: number | null;
  currency: string;
  complex_id: string | null;
  project_id: string | null;
  permissions: {
    calendar: boolean;
    pricing: boolean;
    bookings: boolean;
    guests: boolean;
  };
  owner_name: string | null;
  upcoming_bookings_count: number;
  today_status: 'available' | 'occupied' | 'checkout' | 'checkin';
}

export interface PropertyManagerStats {
  totalProperties: number;
  activeProperties: number;
  upcomingCheckIns: number;
  currentGuests: number;
}

export function useAssignedProperties() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id || null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['assigned-properties', user?.id, activeCompanyId],
    queryFn: async (): Promise<AssignedProperty[]> => {
      if (!user?.id) return [];

      // Get assignments with property details
      const { data: assignments, error: assignError } = await supabase
        .from('property_manager_assignments')
        .select(`
          id,
          property_id,
          permissions,
          properties!inner (
            id,
            title_en,
            title_ru,
            cover_image,
            address,
            district,
            is_active,
            bedrooms,
            bathrooms,
            price_per_night,
            currency,
            owner_id,
            complex_id,
            project_id,
            deleted_at,
            management_company_id
          )
        `)
        .eq('manager_user_id', user.id)
        .eq('is_active', true);

      if (assignError) {
        throw assignError;
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Get upcoming bookings count for each property
      const propertyIds = assignments.map(a => a.property_id);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: bookings } = await supabase
        .from('property_bookings')
        .select('property_id, check_in, check_out, status')
        .in('property_id', propertyIds)
        .gte('check_out', today)
        .in('status', ['confirmed', 'checked_in']);

      // Calculate stats per property
      const bookingsByProperty = new Map<string, { upcoming: number; today: 'available' | 'occupied' | 'checkout' | 'checkin' }>();
      
      propertyIds.forEach(pid => {
        bookingsByProperty.set(pid, { upcoming: 0, today: 'available' });
      });

      bookings?.forEach(booking => {
        const stats = bookingsByProperty.get(booking.property_id);
        if (stats) {
          stats.upcoming++;
          
          // Determine today's status
          if (booking.check_in === today) {
            stats.today = 'checkin';
          } else if (booking.check_out === today) {
            stats.today = 'checkout';
          } else if (booking.check_in < today && booking.check_out > today) {
            stats.today = 'occupied';
          }
        }
      });

      let visibleAssignments = assignments.filter((assignment) => {
        const property = assignment.properties as PropertyEmbed | null;
        return !property?.deleted_at;
      });

      // In MC mode, only show assignments for properties belonging to the active company
      if (activeCompanyId) {
        visibleAssignments = visibleAssignments.filter((assignment) => {
          const property = assignment.properties as PropertyEmbed | null;
          return property?.management_company_id === activeCompanyId;
        });
      }

      return visibleAssignments.map(assignment => {
        const property = assignment.properties as PropertyEmbed | null;
        const propStats = bookingsByProperty.get(assignment.property_id) || { upcoming: 0, today: 'available' as const };
        
        return {
          id: assignment.id,
          property_id: assignment.property_id,
          title: property.title_en || 'Untitled',
          title_ru: property.title_ru || property.title_en || 'Без названия',
          cover_image: property.cover_image,
          address: property.address,
          district: property.district,
          is_active: property.is_active ?? true,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          price_per_night: property.price_per_night,
          currency: property.currency || 'THB',
          permissions: (assignment.permissions as AssignmentPermissions | null) || {
            calendar: true,
            pricing: true,
            bookings: true,
            guests: true,
          },
          owner_name: null,
          complex_id: property.complex_id || null,
          project_id: property.project_id || null,
          upcoming_bookings_count: propStats.upcoming,
          today_status: propStats.today,
        };
      });
    },
    enabled: !!user?.id,
  });

  // Calculate aggregate stats
  const stats: PropertyManagerStats = {
    totalProperties: data?.length || 0,
    activeProperties: data?.filter(p => p.is_active).length || 0,
    upcomingCheckIns: data?.filter(p => p.today_status === 'checkin').length || 0,
    currentGuests: data?.filter(p => p.today_status === 'occupied').length || 0,
  };

  return {
    properties: data || [],
    stats,
    isLoading,
    error,
    refetch,
    hasProperties: (data?.length || 0) > 0,
  };
}
