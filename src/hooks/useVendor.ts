import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_name_ru?: string;
  description?: string;
  description_ru?: string;
  logo_url?: string;
  cover_image?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  lat?: number;
  lng?: number;
  business_category: string;
  commission_rate: number;
  is_verified: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  total_earnings: number;
  pending_payout: number;
  created_at: string;
  updated_at: string;
}

export interface VendorService {
  id: string;
  vendor_id: string;
  name: string;
  name_ru?: string;
  description?: string;
  description_ru?: string;
  category?: string;
  price: number;
  currency: string;
  duration_minutes?: number;
  images?: string[];
  is_active: boolean;
  max_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface VendorBooking {
  id: string;
  vendor_id: string;
  booking_id?: string;
  service_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  amount: number;
  commission_amount: number;
  net_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  service?: VendorService;
}

export interface VendorPayout {
  id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method?: string;
  payment_details?: Record<string, unknown>;
  processed_at?: string;
  notes?: string;
  created_at: string;
}

export interface VendorAnalytics {
  id: string;
  vendor_id: string;
  date: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  revenue: number;
  commission: number;
  net_revenue: number;
  new_customers: number;
  avg_rating?: number;
}

export function useVendorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendor_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data as unknown as VendorProfile | null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<VendorProfile>) => {
    if (!profile) return { error: new Error('No profile found') };
    
    const { data, error } = await supabase
      .from('vendor_profiles' as any)
      .update(updates)
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as unknown as VendorProfile);
    }
    return { data, error };
  };

  const createProfile = async (profileData: Partial<VendorProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('vendor_profiles' as any)
      .insert({
        ...profileData,
        user_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setProfile(data as unknown as VendorProfile);
    }
    return { data, error };
  };

  return { profile, isLoading, error, updateProfile, createProfile, refetch: fetchProfile };
}

export function useVendorServices(vendorId?: string) {
  const [services, setServices] = useState<VendorService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = useCallback(async () => {
    if (!vendorId) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendor_services' as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices((data || []) as unknown as VendorService[]);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = async (serviceData: Partial<VendorService>) => {
    if (!vendorId) return { error: new Error('No vendor ID') };

    const { data, error } = await supabase
      .from('vendor_services' as any)
      .insert({ ...serviceData, vendor_id: vendorId })
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const updateService = async (serviceId: string, updates: Partial<VendorService>) => {
    const { data, error } = await supabase
      .from('vendor_services' as any)
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('vendor_services' as any)
      .delete()
      .eq('id', serviceId);

    if (!error) await fetchServices();
    return { error };
  };

  return { services, isLoading, createService, updateService, deleteService, refetch: fetchServices };
}

export function useVendorBookings(vendorId?: string, options?: { status?: string; limit?: number }) {
  const [bookings, setBookings] = useState<VendorBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!vendorId) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      let query = supabase
        .from('vendor_bookings' as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .order('scheduled_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings((data || []) as unknown as VendorBooking[]);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, options?.status, options?.limit]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { data, error } = await supabase
      .from('vendor_bookings' as any)
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (!error) await fetchBookings();
    return { data, error };
  };

  return { bookings, isLoading, updateBookingStatus, refetch: fetchBookings };
}

export function useVendorAnalytics(vendorId?: string, days: number = 30) {
  const [analytics, setAnalytics] = useState<VendorAnalytics[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    avgRating: 0,
    pendingPayout: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!vendorId) {
      setAnalytics([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('vendor_analytics' as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      const analyticsData = (data || []) as unknown as VendorAnalytics[];
      setAnalytics(analyticsData);

      const totals = analyticsData.reduce(
        (acc, day) => ({
          totalRevenue: acc.totalRevenue + (day.net_revenue || 0),
          totalBookings: acc.totalBookings + (day.total_bookings || 0),
          completedBookings: acc.completedBookings + (day.completed_bookings || 0),
          cancelledBookings: acc.cancelledBookings + (day.cancelled_bookings || 0),
          ratingSum: acc.ratingSum + (day.avg_rating || 0),
          ratingCount: acc.ratingCount + (day.avg_rating ? 1 : 0),
        }),
        { totalRevenue: 0, totalBookings: 0, completedBookings: 0, cancelledBookings: 0, ratingSum: 0, ratingCount: 0 }
      );

      setSummary({
        totalRevenue: totals.totalRevenue,
        totalBookings: totals.totalBookings,
        completedBookings: totals.completedBookings,
        cancelledBookings: totals.cancelledBookings,
        avgRating: totals.ratingCount > 0 ? totals.ratingSum / totals.ratingCount : 0,
        pendingPayout: 0,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, summary, isLoading, refetch: fetchAnalytics };
}

export function useVendorPayouts(vendorId?: string) {
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayouts = useCallback(async () => {
    if (!vendorId) {
      setPayouts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendor_payouts' as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts((data || []) as unknown as VendorPayout[]);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const requestPayout = async (amount: number, paymentMethod: string, paymentDetails: Record<string, unknown>) => {
    if (!vendorId) return { error: new Error('No vendor ID') };

    const { data, error } = await supabase
      .from('vendor_payouts' as any)
      .insert({
        vendor_id: vendorId,
        amount,
        payment_method: paymentMethod,
        payment_details: paymentDetails,
        status: 'pending',
      })
      .select()
      .single();

    if (!error) await fetchPayouts();
    return { data, error };
  };

  return { payouts, isLoading, requestPayout, refetch: fetchPayouts };
}
