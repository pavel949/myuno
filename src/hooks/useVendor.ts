import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorProfile {
  id: string;
  user_id: string;
  name: string;
  description_en?: string;
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
  trust_score: number;
  rating?: number;
  review_count?: number;
  total_earnings?: number;
  pending_payout?: number;
  created_at: string;
  updated_at: string;
}

export interface VendorService {
  id: string;
  provider_id: string;
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
  provider_id: string;
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
  provider_id: string;
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
  provider_id: string;
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
      // Use the real providers table
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Map providers table to VendorProfile interface
        setProfile({
          id: data.id,
          user_id: data.user_id || user.id,
          name: data.name,
          description_en: data.description_en || undefined,
          description_ru: data.description_ru || undefined,
          logo_url: data.logo_url || undefined,
          cover_image: data.cover_image || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          address: data.address || undefined,
          lat: data.lat ? Number(data.lat) : undefined,
          lng: data.lng ? Number(data.lng) : undefined,
          business_category: data.business_category || 'services',
          commission_rate: Number(data.commission_rate) || 10,
          is_verified: data.is_verified || false,
          is_active: data.is_active || true,
          trust_score: Number(data.trust_score) || 0,
          rating: data.rating ? Number(data.rating) : undefined,
          review_count: data.review_count || undefined,
          total_earnings: data.total_earnings ? Number(data.total_earnings) : undefined,
          pending_payout: data.pending_payout ? Number(data.pending_payout) : undefined,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching vendor profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (isMounted && data) {
          setProfile({
            id: data.id,
            user_id: data.user_id || user.id,
            name: data.name,
            description_en: data.description_en || undefined,
            description_ru: data.description_ru || undefined,
            logo_url: data.logo_url || undefined,
            cover_image: data.cover_image || undefined,
            phone: data.phone || undefined,
            email: data.email || undefined,
            website: data.website || undefined,
            address: data.address || undefined,
            lat: data.lat ? Number(data.lat) : undefined,
            lng: data.lng ? Number(data.lng) : undefined,
            business_category: data.business_category || 'services',
            commission_rate: Number(data.commission_rate) || 10,
            is_verified: data.is_verified || false,
            is_active: data.is_active || true,
            trust_score: Number(data.trust_score) || 0,
            rating: data.rating ? Number(data.rating) : undefined,
            review_count: data.review_count || undefined,
            total_earnings: data.total_earnings ? Number(data.total_earnings) : undefined,
            pending_payout: data.pending_payout ? Number(data.pending_payout) : undefined,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
        } else if (isMounted) {
          setProfile(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
        }
        console.error('Error fetching vendor profile:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadProfile();
    
    return () => {
      isMounted = false;
    };
  }, [user]);

  const updateProfile = async (updates: Partial<VendorProfile>) => {
    if (!profile) return { error: new Error('No profile found') };
    
    // Map VendorProfile fields to providers table fields
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description_en !== undefined) dbUpdates.description_en = updates.description_en;
    if (updates.description_ru !== undefined) dbUpdates.description_ru = updates.description_ru;
    if (updates.logo_url !== undefined) dbUpdates.logo_url = updates.logo_url;
    if (updates.cover_image !== undefined) dbUpdates.cover_image = updates.cover_image;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.website !== undefined) dbUpdates.website = updates.website;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.lat !== undefined) dbUpdates.lat = updates.lat;
    if (updates.lng !== undefined) dbUpdates.lng = updates.lng;
    if (updates.business_category !== undefined) dbUpdates.business_category = updates.business_category;
    if (updates.commission_rate !== undefined) dbUpdates.commission_rate = updates.commission_rate;
    if (updates.is_verified !== undefined) dbUpdates.is_verified = updates.is_verified;
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;

    const { data, error } = await supabase
      .from('providers')
      .update(dbUpdates)
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      await fetchProfile();
    }
    return { data, error };
  };

  const createProfile = async (profileData: {
    business_name: string;
    business_name_ru?: string;
    description?: string;
    description_ru?: string;
    business_category: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    commission_rate?: number;
    is_verified?: boolean;
    is_active?: boolean;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Map to providers table structure
    const { data, error } = await supabase
      .from('providers')
      .insert({
        user_id: user.id,
        name: profileData.business_name,
        description_en: profileData.description,
        description_ru: profileData.description_ru,
        business_category: profileData.business_category,
        phone: profileData.phone,
        email: profileData.email,
        website: profileData.website,
        address: profileData.address,
        commission_rate: profileData.commission_rate || 10,
        is_verified: profileData.is_verified || false,
        is_active: profileData.is_active !== false,
      })
      .select()
      .single();

    if (!error && data) {
      await fetchProfile();
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
        .from('vendor_services')
        .select('*')
        .eq('provider_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices((data || []) as VendorService[]);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadServices = async () => {
      if (!vendorId) {
        setServices([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vendor_services')
          .select('*')
          .eq('provider_id', vendorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setServices((data || []) as VendorService[]);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadServices();
    
    return () => {
      isMounted = false;
    };
  }, [vendorId]);

  const createService = async (serviceData: Partial<VendorService>) => {
    if (!vendorId) return { error: new Error('No vendor ID') };

    const insertData = { ...serviceData, provider_id: vendorId };
    const { data, error } = await supabase
      .from('vendor_services')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const updateService = async (serviceId: string, updates: Partial<VendorService>) => {
    const { data, error } = await supabase
      .from('vendor_services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single();

    if (!error) await fetchServices();
    return { data, error };
  };

  const deleteService = async (serviceId: string) => {
    const { error } = await supabase
      .from('vendor_services')
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
        .from('vendor_bookings')
        .select('*')
        .eq('provider_id', vendorId)
        .order('scheduled_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBookings((data || []) as VendorBooking[]);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, options?.status, options?.limit]);

  useEffect(() => {
    let isMounted = true;
    
    const loadBookings = async () => {
      if (!vendorId) {
        setBookings([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let query = supabase
          .from('vendor_bookings')
          .select('*')
          .eq('provider_id', vendorId)
          .order('scheduled_at', { ascending: false });

        if (options?.status) {
          query = query.eq('status', options.status);
        }
        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (isMounted) {
          setBookings((data || []) as VendorBooking[]);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadBookings();
    
    return () => {
      isMounted = false;
    };
  }, [vendorId, options?.status, options?.limit]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { data, error } = await supabase
      .from('vendor_bookings')
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
        .from('vendor_analytics')
        .select('*')
        .eq('provider_id', vendorId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      const analyticsData = (data || []) as VendorAnalytics[];
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
    let isMounted = true;
    
    const loadAnalytics = async () => {
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
          .from('vendor_analytics')
          .select('*')
          .eq('provider_id', vendorId)
          .gte('date', startDate.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (error) throw error;
        
        if (isMounted) {
          const analyticsData = (data || []) as VendorAnalytics[];
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
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadAnalytics();
    
    return () => {
      isMounted = false;
    };
  }, [vendorId, days]);

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
        .from('vendor_payouts')
        .select('*')
        .eq('provider_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts((data || []) as VendorPayout[]);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    let isMounted = true;
    
    const loadPayouts = async () => {
      if (!vendorId) {
        setPayouts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('vendor_payouts')
          .select('*')
          .eq('provider_id', vendorId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (isMounted) {
          setPayouts((data || []) as VendorPayout[]);
        }
      } catch (err) {
        console.error('Error fetching payouts:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadPayouts();
    
    return () => {
      isMounted = false;
    };
  }, [vendorId]);

  const requestPayout = async (amount: number, paymentMethod: string, paymentDetails: Record<string, unknown>) => {
    if (!vendorId) return { error: new Error('No vendor ID') };

    const insertData = {
      provider_id: vendorId,
      amount,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      status: 'pending',
    };
    const { data, error } = await supabase
      .from('vendor_payouts')
      .insert(insertData as any)
      .select()
      .single();

    if (!error) await fetchPayouts();
    return { data, error };
  };

  return { payouts, isLoading, requestPayout, refetch: fetchPayouts };
}
