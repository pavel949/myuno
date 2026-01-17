import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VisaServiceProvider {
  id: string;
  name_en: string;
  name_ru: string;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
}

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
  requirements: { en?: string[]; ru?: string[] } | null;
  documents_required: { en?: string[]; ru?: string[] } | null;
  process_steps: { en?: string[]; ru?: string[] } | null;
  is_popular: boolean;
  is_renewable: boolean | null;
  // Computed fields
  processing_time?: string;
  validity_period?: string;
  price?: number;
  provider?: VisaServiceProvider;
}

interface UseVisaServicesOptions {
  visaType?: string;
  providerId?: string;
}

export function useVisaServices(options: UseVisaServicesOptions = {}) {
  const [services, setServices] = useState<VisaService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchServices = async () => {
      setIsLoading(true);
      let query = supabase
        .from('visa_services')
        .select(`
          *,
          provider:legal_services!visa_services_provider_id_fkey(
            id,
            name_en,
            name_ru,
            rating,
            review_count,
            is_verified
          )
        `)
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

      if (isMounted) {
        if (!error && data) {
          const mappedServices = data.map((s) => {
            const service = s as Record<string, unknown>;
            const processingDays = service.processing_days as number | null;
            const validityMonths = service.validity_months as number | null;
            
            return {
              ...service,
              requirements: service.requirements || null,
              documents_required: service.documents_required || null,
              process_steps: service.process_steps || null,
              // Computed fields
              processing_time: processingDays ? `${processingDays} days` : null,
              validity_period: validityMonths 
                ? validityMonths >= 12 
                  ? `${Math.floor(validityMonths / 12)} year${Math.floor(validityMonths / 12) > 1 ? 's' : ''}`
                  : `${validityMonths} months`
                : null,
              price: (service.service_fee as number) || (service.total_price as number),
              provider: service.provider as VisaServiceProvider | undefined,
            } as VisaService;
          });
          setServices(mappedServices);
        }
        setIsLoading(false);
      }
    };
    fetchServices();
    
    return () => { isMounted = false; };
  }, [options.visaType, options.providerId]);

  return { services, isLoading };
}

export function useVisaService(id: string) {
  const [service, setService] = useState<VisaService | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    if (!id) return;
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('visa_services')
        .select(`
          *,
          provider:legal_services!visa_services_provider_id_fkey(
            id,
            name_en,
            name_ru,
            rating,
            review_count,
            is_verified
          )
        `)
        .eq('id', id)
        .single();
      if (isMounted) {
        if (!error && data) {
          setService({
            ...data,
            requirements: data.requirements || null,
            documents_required: data.documents_required || null,
            process_steps: (data as any).process_steps || null,
            processing_time: data.processing_days ? `${data.processing_days} days` : null,
            validity_period: data.validity_months 
              ? data.validity_months >= 12 
                ? `${Math.floor(data.validity_months / 12)} year${Math.floor(data.validity_months / 12) > 1 ? 's' : ''}`
                : `${data.validity_months} months`
              : null,
            price: data.service_fee || data.total_price,
            provider: (data as any).provider,
          } as unknown as VisaService);
        }
        setIsLoading(false);
      }
    };
    fetchService();
    
    return () => { isMounted = false; };
  }, [id]);

  return { service, isLoading };
}
