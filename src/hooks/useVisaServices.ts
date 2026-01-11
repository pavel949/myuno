import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VisaService {
  id: string;
  provider_id: string | null;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  visa_type: string;
  service_fee: number;
  government_fee: number;
  total_price: number;
  currency: string;
  processing_days: number | null;
  validity_months: number | null;
  requirements: { en: string; ru: string }[];
  documents_required: { en: string; ru: string }[];
  is_popular: boolean;
}

interface UseVisaServicesOptions {
  visaType?: string;
  providerId?: string;
}

export function useVisaServices(options: UseVisaServicesOptions = {}) {
  const [services, setServices] = useState<VisaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase
        .from('visa_services')
        .select('*')
        .eq('is_active', true)
        .order('is_popular', { ascending: false })
        .order('total_price', { ascending: true });

      if (options.visaType && options.visaType !== 'all') {
        query = query.eq('visa_type', options.visaType);
      }

      if (options.providerId) {
        query = query.eq('provider_id', options.providerId);
      }

      const { data, error } = await query;

      if (!error && data) {
        setServices(
          data.map((s: any) => ({
            ...s,
            requirements: Array.isArray(s.requirements) ? s.requirements : [],
            documents_required: Array.isArray(s.documents_required)
              ? s.documents_required
              : [],
          })) as VisaService[]
        );
      }
      setIsLoading(false);
    };
    fetchServices();
  }, [options.visaType, options.providerId]);

  return { services, isLoading };
}

export function useVisaService(id: string) {
  const [service, setService] = useState<VisaService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('visa_services')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setService({
          ...data,
          requirements: Array.isArray(data.requirements) ? data.requirements : [],
          documents_required: Array.isArray(data.documents_required)
            ? data.documents_required
            : [],
        } as unknown as VisaService);
      }
      setIsLoading(false);
    };
    fetchService();
  }, [id]);

  return { service, isLoading };
}
