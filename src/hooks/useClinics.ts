import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Clinic {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  clinic_type: string;
  specialty: string[];
  cover_image: string | null;
  images: string[];
  address: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: Record<string, string>;
  languages: string[];
  is_24h: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  consultation_price: number | null;
  currency: string;
  provider_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  clinic_id: string;
  name_en: string;
  name_ru: string;
  specialty: string;
  specialty_ru: string | null;
  qualification: string | null;
  qualification_ru: string | null;
  experience_years: number;
  photo: string | null;
  languages: string[];
  consultation_price: number | null;
  currency: string;
  available_days: string[];
  available_times: Record<string, string[]>;
  is_available: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface MedicalService {
  id: string;
  clinic_id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  category: string;
  specialty: string | null;
  price: number;
  currency: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

interface ClinicsFilters {
  specialty?: string;
  clinicType?: string;
  district?: string;
  is24h?: boolean;
  searchQuery?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformClinic(raw: Record<string, any>): Clinic {
  const attrs = raw.attributes || {};
  return {
    id: raw.id,
    name_en: raw.name_en,
    name_ru: raw.name_ru || '',
    description_en: raw.description_en,
    description_ru: raw.description_ru,
    clinic_type: raw.category || attrs.clinic_type || 'clinic',
    specialty: attrs.specialty || [],
    cover_image: raw.cover_image,
    images: raw.images || [],
    address: raw.address,
    district: raw.district,
    lat: raw.lat,
    lng: raw.lng,
    phone: raw.phone,
    email: raw.email,
    website: raw.website,
    working_hours: raw.working_hours || {},
    languages: raw.languages || [],
    is_24h: attrs.is_24h ?? false,
    is_verified: raw.is_verified ?? false,
    is_featured: raw.is_featured ?? false,
    is_active: raw.is_active ?? true,
    rating: raw.rating || 0,
    review_count: raw.review_count || 0,
    consultation_price: raw.price || attrs.consultation_price,
    currency: raw.currency || 'THB',
    provider_id: raw.provider_id,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export function useClinics(filters?: ClinicsFilters) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchClinics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('vertical', 'clinic')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (filters?.specialty && filters.specialty !== 'all') {
        query = query.contains('attributes->specialty', JSON.stringify([filters.specialty]));
      }

      if (filters?.clinicType) {
        query = query.eq('category', filters.clinicType);
      }

      if (filters?.district) {
        query = query.eq('district', filters.district);
      }

      if (filters?.is24h) {
        query = query.eq('attributes->>is_24h', 'true');
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      let result = (data || []).map(transformClinic);

      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        result = result.filter(clinic =>
          clinic.name_en.toLowerCase().includes(searchLower) ||
          clinic.name_ru.toLowerCase().includes(searchLower) ||
          clinic.address?.toLowerCase().includes(searchLower)
        );
      }

      setClinics(result);
    } catch (err) {
      setError(err as Error);
      
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, [filters?.specialty, filters?.clinicType, filters?.district, filters?.is24h, filters?.searchQuery]);

  return { clinics, isLoading, error, refetch: fetchClinics };
}

export function useClinic(id: string | undefined) {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchClinic = async () => {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .eq('vertical', 'clinic')
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (isMounted) setClinic(data ? transformClinic(data) : null);
      } catch (err) {
        if (isMounted) setError(err as Error);
        
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClinic();
    
    return () => { isMounted = false; };
  }, [id]);

  return { clinic, isLoading, error };
}

export function useDoctors(clinicId: string | undefined, specialty?: string) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!clinicId) {
      setDoctors([]);
      setIsLoading(false);
      return;
    }

    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('doctors')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('rating', { ascending: false });

        if (specialty) {
          query = query.eq('specialty', specialty);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (isMounted) setDoctors((data || []) as Doctor[]);
      } catch (err) {
        if (isMounted) setError(err as Error);
        
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDoctors();
    
    return () => { isMounted = false; };
  }, [clinicId, specialty]);

  return { doctors, isLoading, error };
}

export function useMedicalServices(clinicId: string | undefined, category?: string) {
  const [services, setServices] = useState<MedicalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    if (!clinicId) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    const fetchServices = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('medical_services')
          .select('*')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('category')
          .order('price');

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        if (isMounted) setServices((data || []) as MedicalService[]);
      } catch (err) {
        if (isMounted) setError(err as Error);
        
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchServices();
    
    return () => { isMounted = false; };
  }, [clinicId, category]);

  return { services, isLoading, error };
}
