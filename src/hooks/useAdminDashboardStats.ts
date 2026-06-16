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
  education: number;
  pets: number;
  cleaning: number;
  babysitters: number;
  flowers: number;
  pharmacies: number;
  stores: number;
  insurance: number;
  waterActivities: number;
  // Users
  totalUsers: number;
  unoTeamMembers: number;
  // Orders/Bookings
  totalBookings: number;
  pendingBookings: number;
  // Moderation
  pendingProperties: number;
  pendingContent: number;
  // Support
  openTickets: number;
  // Inbox sources (commit 3 — Action Inbox)
  openDisputes: number;
  pendingPartnerApplications: number;
  pendingManualPayments: number;
  unpaidOrders24h: number;
}

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const countOptions = { count: 'exact' as const, head: false };
      
      // Verticals: canonical source is listings (see docs/DATA_SOURCE_MAPPING.md)
      const { data: listingCounts, error: listingsError } = await supabase
        .from('listings')
        .select('vertical');
      
      // Count by vertical from listings
      const verticalCounts: Record<string, number> = {};
      if (!listingsError && listingCounts) {
        listingCounts.forEach((row) => {
          const v = row.vertical;
          verticalCounts[v] = (verticalCounts[v] || 0) + 1;
        });
      }

      // Non-listings tables: salons, gyms, events, flower_shops, etc. (see DATA_SOURCE_MAPPING.md)
      const [
        providersRes,
        servicesRes,
        propertiesRes,
        profilesRes,
        unoTeamRes,
        bookingsRes,
        salonsRes,
        gymsRes,
        eventsRes,
        pharmaciesRes,
        storesRes,
        insuranceRes,
        waterRes,
        flowersRes,
      ] = await Promise.all([
        supabase.from('providers').select('id', countOptions).limit(1),
        supabase.from('services').select('id', countOptions).limit(1),
        supabase.from('properties').select('id', countOptions).limit(1),
        supabase.from('profiles').select('id', countOptions).limit(1),
        supabase.from('user_roles').select('id', countOptions).eq('role', 'uno_team').limit(1),
        supabase.from('bookings').select('id', countOptions).limit(1),
        supabase.from('salons').select('id', countOptions).limit(1),
        supabase.from('gyms').select('id', countOptions).limit(1),
        supabase.from('events').select('id', countOptions).limit(1),
        supabase.from('pharmacies').select('id', countOptions).limit(1),
        supabase.from('marketplace_products').select('id', countOptions).limit(1),
        supabase.from('insurance_plans').select('id', countOptions).limit(1),
        supabase.from('water_activities').select('id', countOptions).limit(1),
        supabase.from('flower_shops').select('id', countOptions).limit(1),
      ]);

      // Pending moderation + Inbox sources (commit 3)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [
        pendingPropertiesRes,
        pendingListingsRes,
        openTicketsRes,
        openDisputesRes,
        pendingPartnerAppsRes,
        pendingManualPaymentsRes,
        unpaidOrdersRes,
      ] = await Promise.all([
        supabase.from('properties').select('id', countOptions).eq('approval_status', 'pending').limit(1),
        supabase.from('listings').select('id', countOptions).eq('approval_status', 'pending').limit(1),
        supabase.from('support_tickets').select('id', countOptions).in('status', ['open', 'in_progress']).limit(1),
        supabase.from('disputes').select('id', countOptions).eq('status', 'open').limit(1),
        supabase.from('partner_applications').select('id', countOptions).eq('status', 'pending').limit(1),
        supabase.from('manual_payment_requests').select('id', countOptions).in('status', ['pending', 'awaiting_review']).limit(1),
        supabase.from('orders').select('id', countOptions).eq('status', 'pending').lt('created_at', oneDayAgo).limit(1),
      ]);

      // Active/pending providers
      const [activeProvidersRes, pendingProvidersRes, pendingBookingsRes] = await Promise.all([
        supabase.from('providers').select('id', countOptions).eq('is_active', true).limit(1),
        supabase.from('providers').select('id', countOptions).eq('is_verified', false).limit(1),
        supabase.from('bookings').select('id', countOptions).eq('status', 'submitted').limit(1),
      ]);

      const pendingProperties = pendingPropertiesRes.count || 0;
      const pendingListings = pendingListingsRes.count || 0;
      const totalPendingContent = pendingProperties + pendingListings;

      return {
        providers: providersRes.count || 0,
        services: servicesRes.count || 0,
        activeProviders: activeProvidersRes.count || 0,
        pendingProviders: pendingProvidersRes.count || 0,
        // Verticals from listings table
        yachts: verticalCounts['yacht'] || 0,
        tours: verticalCounts['experience'] || 0,
        restaurants: verticalCounts['restaurant'] || 0,
        clinics: verticalCounts['clinic'] || 0,
        vehicles: verticalCounts['vehicle'] || 0,
        education: verticalCounts['education'] || 0,
        pets: verticalCounts['pet_service'] || 0,
        cleaning: verticalCounts['cleaning'] || 0,
        babysitters: verticalCounts['babysitter'] || 0,
        // Non-listings tables
        properties: propertiesRes.count || 0,
        salons: salonsRes.count || 0,
        gyms: gymsRes.count || 0,
        events: eventsRes.count || 0,
        flowers: flowersRes.count || 0,
        pharmacies: pharmaciesRes.count || 0,
        stores: storesRes.count || 0,
        insurance: insuranceRes.count || 0,
        waterActivities: waterRes.count || 0,
        // Users
        totalUsers: profilesRes.count || 0,
        unoTeamMembers: unoTeamRes.count || 0,
        // Bookings
        totalBookings: bookingsRes.count || 0,
        pendingBookings: pendingBookingsRes.count || 0,
        pendingProperties,
        pendingContent: totalPendingContent,
        openTickets: openTicketsRes.count || 0,
        // Inbox sources
        openDisputes: openDisputesRes.count || 0,
        pendingPartnerApplications: pendingPartnerAppsRes.count || 0,
        pendingManualPayments: pendingManualPaymentsRes.count || 0,
        unpaidOrders24h: unpaidOrdersRes.count || 0,
      };
    },
    ...CACHE_PROFILES.ADMIN,
  });
}
