import { useSupabaseCRUD } from './useSupabaseCRUD';

export interface VendorClinic {
  id: string;
  provider_id: string | null;
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
  created_at: string;
  updated_at: string;
}

export function useVendorClinics(providerId?: string) {
  const { items, isLoading, create, update, remove, refetch } = useSupabaseCRUD<VendorClinic>({
    table: 'clinics',
    providerId,
    providerIdField: 'provider_id',
    orderByColumn: 'created_at',
    orderAscending: false,
    select: 'id,provider_id,name_en,name_ru,description_en,description_ru,clinic_type,specialty,cover_image,images,address,district,lat,lng,phone,email,website,working_hours,languages,is_24h,is_verified,is_featured,is_active,rating,review_count,consultation_price,currency,created_at,updated_at',
  });

  return {
    clinics: items,
    isLoading,
    createClinic: async (clinicData: Partial<VendorClinic> & { provider_id?: string }) => create(clinicData),
    updateClinic: async (id: string, clinicData: Partial<VendorClinic>) => update(id, clinicData),
    deleteClinic: async (id: string) => remove(id),
    refetch,
  };
}
