import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CACHE_PROFILES } from '@/lib/queryConfig';

export interface DashboardStats {
  providers: number;
  services: number;
  activeProviders: number;
  pendingProviders: number;
  // Verticals
  yachts: number;
  tours: number;
  properties: number;
  restaurants: number;
  salons: number;
  clinics: number;
  gyms: number;
  vehicles: number;
  events: number;
  // Users
  totalUsers: number;
  unoTeamMembers: number;
  // Orders/Bookings
  totalBookings: number;
  pendingBookings: number;
  // Moderation
  pendingProperties: number;
  pendingContent: number;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Use GET with count:'exact' instead of HEAD requests to avoid errors
      const countOptions = { count: 'exact' as const, head: false };
      
      // Parallel queries for performance - using proper count method
      const [
        providersRes,
        servicesRes,
        yachtsRes,
        toursRes,
        propertiesRes,
        restaurantsRes,
        salonsRes,
        clinicsRes,
        gymsRes,
        vehiclesRes,
        eventsRes,
        profilesRes,
        unoTeamRes,
        bookingsRes,
      ] = await Promise.all([
        supabase.from('providers').select('id', countOptions).limit(1),
        supabase.from('services').select('id', countOptions).limit(1),
        supabase.from('yachts').select('id', countOptions).limit(1),
        supabase.from('tours').select('id', countOptions).limit(1),
        supabase.from('properties').select('id', countOptions).limit(1),
        supabase.from('restaurants').select('id', countOptions).limit(1),
        supabase.from('salons').select('id', countOptions).limit(1),
        supabase.from('clinics').select('id', countOptions).limit(1),
        supabase.from('gyms').select('id', countOptions).limit(1),
        supabase.from('vehicles').select('id', countOptions).limit(1),
        supabase.from('events').select('id', countOptions).limit(1),
        supabase.from('profiles').select('id', countOptions).limit(1),
        supabase.from('user_roles').select('id', countOptions).eq('role', 'uno_team').limit(1),
        supabase.from('bookings').select('id', countOptions).limit(1),
      ]);

      // Get pending moderation counts
      const [pendingPropertiesRes, pendingYachtsRes, pendingToursRes] = await Promise.all([
        supabase.from('owner_properties').select('id', countOptions).eq('approval_status', 'pending').limit(1),
        supabase.from('yachts').select('id', countOptions).eq('approval_status', 'pending').limit(1),
        supabase.from('tours').select('id', countOptions).eq('approval_status', 'pending').limit(1),
      ]);

      // Get active/pending providers counts
      const [activeProvidersRes, pendingProvidersRes, pendingBookingsRes] = await Promise.all([
        supabase.from('providers').select('id', countOptions).eq('is_active', true).limit(1),
        supabase.from('providers').select('id', countOptions).eq('is_verified', false).limit(1),
        supabase.from('bookings').select('id', countOptions).eq('status', 'submitted').limit(1),
      ]);

      const pendingProperties = pendingPropertiesRes.count || 0;
      const pendingYachts = pendingYachtsRes.count || 0;
      const pendingTours = pendingToursRes.count || 0;
      const totalPendingContent = pendingProperties + pendingYachts + pendingTours + (pendingProvidersRes.count || 0);

      return {
        providers: providersRes.count || 0,
        services: servicesRes.count || 0,
        activeProviders: activeProvidersRes.count || 0,
        pendingProviders: pendingProvidersRes.count || 0,
        yachts: yachtsRes.count || 0,
        tours: toursRes.count || 0,
        properties: propertiesRes.count || 0,
        restaurants: restaurantsRes.count || 0,
        salons: salonsRes.count || 0,
        clinics: clinicsRes.count || 0,
        gyms: gymsRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        events: eventsRes.count || 0,
        totalUsers: profilesRes.count || 0,
        unoTeamMembers: unoTeamRes.count || 0,
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
        pendingProperties,
        pendingContent: totalPendingContent,
      };
    },
    ...CACHE_PROFILES.ADMIN,
  });
}
