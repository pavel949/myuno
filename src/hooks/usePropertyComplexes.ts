import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { typedFrom } from '@/lib/untypedTables';

export interface PropertyComplex {
  id: string;
  owner_id?: string | null;
  name: string;
  name_ru?: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
  address?: string;
  district?: string;
  // Classification
  complex_type?: string;
  total_units?: number;
  total_buildings?: number;
  year_built?: number;
  total_floors?: number;
  // Location
  lat?: number;
  lng?: number;
  // Media
  cover_image?: string;
  images?: string[];
  video_url?: string;
  // Amenities & Services
  amenities?: string[];
  services?: string[];
  security_features?: string[];
  infrastructure?: string[];
  // Management
  management_company_id?: string;
  cam_fee_per_sqm?: number;
  cam_includes?: string[];
  juristic_person_name?: string;
  juristic_phone?: string;
  juristic_email?: string;
  // Status
  is_active?: boolean;
  authoring_space_id?: string;
  approval_status?: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export type ComplexFormData = Omit<PropertyComplex, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'authoring_space_id' | 'approval_status' | 'rejection_reason'>;

const db = supabase;

export function usePropertyComplexes(editableScope?: { companyId?: string; includeCompany: boolean; platformAdmin?: boolean }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['property-complexes', user?.id, editableScope?.companyId, editableScope?.includeCompany, editableScope?.platformAdmin],
    enabled: !!user,
    queryFn: async () => {
      let query = db.from('property_complexes').select('*');
      if (editableScope && !editableScope.platformAdmin) {
        // A company role is only an affordance; stored RLS remains authority.
        query = editableScope.includeCompany && editableScope.companyId
          ? query.or(`owner_id.eq.${user!.id},management_company_id.eq.${editableScope.companyId}`)
          : query.eq('owner_id', user!.id);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return (data || []) as PropertyComplex[];
    },
  });
}

export function useCreateComplex() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ComplexFormData) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db
        .from('property_complexes')
        .insert({ ...payload, owner_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс создан');
    },
  });
}

export function useUpdateComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PropertyComplex> & { id: string }) => {
      const { data, error } = await db
        .from('property_complexes')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PropertyComplex;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс обновлён');
    },
  });
}

export function useDeleteComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('property_complexes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
      toast.success('Комплекс удалён');
    },
  });
}

export function useAssignPropertyToComplex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, complexId }: { propertyId: string; complexId: string | null }) => {
      const { error } = await db
        .from('properties')
        .update({ complex_id: complexId })
        .eq('id', propertyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-complexes'] });
    },
  });
}

// Frontend-first rollout bridge only. Do not reinterpret permission, transport,
// row-not-found or unrelated relation errors as an absent catalogue view.
function isMissingPublicComplexCatalogue(error: unknown, status?: number): boolean {
  if (!error || typeof error !== 'object' || (status !== undefined && status !== 404)) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (typeof message !== 'string') return false;
  return (code === '42P01' && /^relation "(?:public\.)?public_complex_catalog" does not exist$/.test(message))
    || (code === 'PGRST205' && message === "Could not find the table 'public.public_complex_catalog' in the schema cache");
}

const complexAmenityColumns = 'amenities, services, security_features, infrastructure, name, name_ru';
const complexNameColumns = 'id,name,name_ru';

/** Hook to get amenities inherited from a property's complex */
export function useComplexAmenities(complexId: string | null | undefined) {
  return useQuery({
    queryKey: ['complex-amenities', complexId],
    enabled: !!complexId,
    queryFn: async () => {
      let result = await typedFrom('public_complex_catalog')
        .select(complexAmenityColumns)
        .eq('id', complexId!)
        .single();
      if (isMissingPublicComplexCatalogue(result.error, result.status)) {
        result = await db.from('property_complexes')
          .select(complexAmenityColumns)
          .eq('id', complexId!)
          .eq('is_active', true)
          .single();
      }
      if (result.error) throw result.error;
      return result.data as Pick<PropertyComplex, 'amenities' | 'services' | 'security_features' | 'infrastructure' | 'name' | 'name_ru'>;
    },
    staleTime: 10 * 60 * 1000,
  });
}


/** Safe names used for grouping. Public catalogue + independently authorized
 * private names are projections of the same canonical complexes, never authority. */
export async function readPropertyComplexNames(ids?: string[]) {
  if (ids && !ids.length) return [];
  const readCatalogue = async () => {
    let query = typedFrom('public_complex_catalog').select(complexNameColumns);
    if (ids) query = query.in('id', ids);
    const result = await query.order('name');
    if (!isMissingPublicComplexCatalogue(result.error, result.status)) return result;
    // Same explicit public columns, active rows only, and existing RLS still applies.
    let legacy = db.from('property_complexes').select(complexNameColumns).eq('is_active', true);
    if (ids) legacy = legacy.in('id', ids);
    return await legacy.order('name');
  };
  let privateQuery = db.from('property_complexes').select(complexNameColumns);
  if (ids) privateQuery = privateQuery.in('id', ids);
  const [catalogue, independent] = await Promise.all([readCatalogue(), privateQuery.order('name')]);
  if (catalogue.error) throw catalogue.error;
  if (independent.error) throw independent.error;
  const rows = [...(catalogue.data || []), ...(independent.data || [])] as Array<{ id: string; name: string; name_ru: string | null }>;
  return [...new Map(rows.map(row => [row.id, row])).values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Guest detail never falls back to private rows, including for signed-in admins. */
export const PUBLIC_COMPLEX_DETAIL_COLUMNS = 'id,name,name_ru,description_en,description_ru,address,district,cover_image,images,video_url,amenities,services,security_features,infrastructure';
export type PublicComplexDetail = Pick<PropertyComplex, 'id' | 'name' | 'name_ru' | 'description_en' | 'description_ru' | 'address' | 'district' | 'cover_image' | 'images' | 'video_url' | 'amenities' | 'services' | 'security_features' | 'infrastructure'>;
export function usePublicComplexDetail(id?: string | null) {
  return useQuery({
    queryKey: ['public-complex-detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await typedFrom('public_complex_catalog')
        .select(PUBLIC_COMPLEX_DETAIL_COLUMNS).eq('id', id!).maybeSingle();
      if (error) throw error;
      return data as PublicComplexDetail | null;
    },
  });
}
