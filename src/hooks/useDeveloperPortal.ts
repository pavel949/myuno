/**
 * Hook for developer portal — checks if current user is a developer
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ProjectUpdate } from './useProjectUpdates';

export interface DeveloperProfile {
  id: string;
  name_en: string;
  name_ru: string;
  slug: string | null;
  logo_url: string | null;
  cover_image: string | null;
  description_en: string | null;
  description_ru: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  founded_year: number | null;
  is_verified: boolean;
  subscription_tier: string;
  user_id: string | null;
  devmod_status: string | null;
}

export interface DeveloperProjectUnit {
  id: string;
  project_id: string;
  unit_type: string;
  unit_code: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  floor: number | null;
  view_type: string | null;
  floor_plan_url: string | null;
  floor_plan_image_url: string | null;
  price: number | null;
  price_per_sqm: number | null;
  currency: string | null;
  status: string | null;
  notes: string | null;
  // Developer Module fields (added by devmod_03 migration)
  floor_plan_id: string | null;
  pin_x_pct: number | null;
  pin_y_pct: number | null;
  unit_status: string | null;
  status_version: number | null;
}

export interface DeveloperProjectDocument {
  id: string;
  property_id: string;
  title: string;
  title_ru: string | null;
  document_type: string;
  file_url: string | null;
  file_name: string | null;
  is_sensitive: boolean | null;
  description: string | null;
  uploaded_by: string | null;
}

export function useDeveloperProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['developer-profile', user?.id],
    queryFn: async (): Promise<DeveloperProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name_en: data.name_en,
        name_ru: data.name_ru,
        slug: data.slug,
        logo_url: data.logo_url,
        cover_image: data.cover_image ?? null,
        description_en: data.description_en,
        description_ru: (data as Record<string, unknown>).description_ru as string | null ?? null,
        website: data.website,
        phone: data.phone,
        email: data.email,
        founded_year: (data as Record<string, unknown>).founded_year as number | null ?? null,
        is_verified: data.is_verified ?? false,
        subscription_tier: (data as Record<string, unknown>).subscription_tier as string || 'free',
        user_id: (data as Record<string, unknown>).user_id as string | null,
        devmod_status: (data as Record<string, unknown>).devmod_status as string | null ?? null,
      };
    },
    enabled: !!user,
  });
}

export function useUpdateDeveloperProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DeveloperProfile> & { id: string }) => {
      const { id, ...fields } = data;
      const { error } = await supabase.from('developers').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      toast.success('Профиль компании обновлён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения'),
  });
}

// ── Project Units (operational CRUD, not public development_units) ──

export function useProjectUnitsForEditor(projectId?: string) {
  return useQuery({
    queryKey: ['project-units-editor', projectId],
    queryFn: async (): Promise<DeveloperProjectUnit[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', projectId)
        .order('unit_code', { ascending: true });
      if (error) throw error;
      return (data || []) as DeveloperProjectUnit[];
    },
    enabled: !!projectId,
  });
}

export function useUpsertProjectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unit: Partial<DeveloperProjectUnit> & { project_id: string }) => {
      if (unit.id) {
        const { id, project_id, ...fields } = unit;
        const { error } = await supabase.from('project_units').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { id: _id, ...insertFields } = unit;
        const { error } = await supabase.from('project_units').insert(insertFields as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-units-editor'] });
      toast.success('Юнит сохранён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения'),
  });
}

export function useDeleteProjectUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_units').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-units-editor'] });
      toast.success('Юнит удалён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка удаления'),
  });
}

// ── Project Documents ──

export function useProjectDocuments(projectId?: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async (): Promise<DeveloperProjectDocument[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DeveloperProjectDocument[];
    },
    enabled: !!projectId,
  });
}

export function useAddProjectDocument() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Omit<DeveloperProjectDocument, 'id' | 'uploaded_by'>) => {
      const { error } = await supabase.from('property_documents').insert({
        ...doc,
        uploaded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      toast.success('Документ загружен');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка загрузки'),
  });
}

export function useDeleteProjectDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('property_documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-documents'] });
      toast.success('Документ удалён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка удаления'),
  });
}

// ── Construction Progress Updates ──

export function useUpsertProjectUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (update: Partial<ProjectUpdate> & { project_id: string }) => {
      if (update.id) {
        const { id, project_id, ...fields } = update;
        const { error } = await supabase.from('nb_project_updates').update(fields as never).eq('id', id);
        if (error) throw error;
      } else {
        const { id: _id, ...insertFields } = update;
        const { error } = await supabase.from('nb_project_updates').insert(insertFields as never);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-updates', vars.project_id] });
      toast.success('Обновление сохранено');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения'),
  });
}

export function useDeleteProjectUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('nb_project_updates').delete().eq('id', id);
      if (error) throw error;
      return project_id;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-updates', vars.project_id] });
      toast.success('Обновление удалено');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка удаления'),
  });
}

// ── Floor Plans ──

export interface FloorPlan {
  id: string;
  project_id: string;
  name: string;
  display_order: number;
  image_url: string;
  image_width_px: number;
  image_height_px: number;
}

export function useFloorPlans(projectId?: string) {
  return useQuery({
    queryKey: ['floor-plans', projectId],
    queryFn: async (): Promise<FloorPlan[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase.from('floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data || []) as FloorPlan[];
    },
    enabled: !!projectId,
  });
}

export function useUpsertFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Partial<FloorPlan> & { project_id: string; name: string; image_url: string; image_width_px: number; image_height_px: number }) => {
      if (plan.id) {
        const { id, project_id, ...fields } = plan;
        const { error } = await supabase.from('floor_plans').update(fields).eq('id', id);
        if (error) throw error;
      } else {
        const { id: _id, ...insertFields } = plan;
        const { data, error } = await supabase.from('floor_plans').insert(insertFields).select('id').single();
        if (error) throw error;
        return (data as { id: string }).id;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['floor-plans', vars.project_id] });
      toast.success('Флорплан сохранён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения'),
  });
}

export function useDeleteFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('floor_plans').delete().eq('id', id);
      if (error) throw error;
      return project_id;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['floor-plans', vars.project_id] });
      toast.success('Флорплан удалён');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка удаления'),
  });
}

export function useUpdateUnitPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, floorPlanId, pinXPct, pinYPct, projectId }: {
      unitId: string;
      floorPlanId: string;
      pinXPct: number;
      pinYPct: number;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from('project_units')
        .update({ floor_plan_id: floorPlanId, pin_x_pct: pinXPct, pin_y_pct: pinYPct } as never)
        .eq('id', unitId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-units-editor', vars.projectId] });
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения пина'),
  });
}

export function useRemoveUnitPin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, projectId }: { unitId: string; projectId: string }) => {
      const { error } = await supabase
        .from('project_units')
        .update({ floor_plan_id: null, pin_x_pct: null, pin_y_pct: null } as never)
        .eq('id', unitId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-units-editor', vars.projectId] });
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка'),
  });
}

// ── Soft Hold ──

export interface SoftHoldResult {
  success: true;
  hold_id: string | null;
  expires_at: string;
  warning?: string;
}

interface SoftHoldFailure {
  success: false;
  reason: 'conflict' | 'bad_request' | 'internal' | 'method_not_allowed';
  message: string;
}

export function useSoftHold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      unitId: string;
      expectedVersion: number;
      leadId?: string;
      projectId: string;
    }): Promise<SoftHoldResult> => {
      const { data, error } = await supabase.functions.invoke('devmod-unit-hold', {
        body: {
          unit_id: opts.unitId,
          expected_version: opts.expectedVersion,
          lead_id: opts.leadId ?? null,
        },
      });
      if (error) throw new Error(String(error));
      const result = data as SoftHoldResult | SoftHoldFailure;
      if (!result.success) {
        const msg = (result as SoftHoldFailure).reason === 'conflict'
          ? 'Юнит уже занят. Попробуйте другой.'
          : ((result as SoftHoldFailure).message ?? 'Ошибка удержания');
        throw new Error(msg);
      }
      return result as SoftHoldResult;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['project-units-editor', vars.projectId] });
      toast.success('Юнит удержан на 30 минут');
    },
    onError: (e: Error) => toast.error(e.message || 'Не удалось создать удержание'),
  });
}

// ── Booking Fee Checkout ──

export function useCreateBookingCheckout() {
  return useMutation({
    mutationFn: async (opts: {
      unitId: string;
      holdId: string;
      projectId: string;
      successUrl: string;
      cancelUrl: string;
    }): Promise<{ checkout_url: string; session_id: string }> => {
      const { data, error } = await supabase.functions.invoke('devmod-create-booking-checkout', {
        body: {
          unit_id: opts.unitId,
          hold_id: opts.holdId,
          project_id: opts.projectId,
          success_url: opts.successUrl,
          cancel_url: opts.cancelUrl,
        },
      });
      if (error) throw new Error(String(error));
      const result = data as { error?: string; checkout_url?: string; session_id?: string };
      if (result.error) throw new Error(result.error);
      if (!result.checkout_url) throw new Error('No checkout URL returned');
      return result as { checkout_url: string; session_id: string };
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка создания платежа'),
  });
}

// ── KYC / Buyer ──

export interface BuyerRecord {
  id: string;
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  first_name: string;
  last_name: string;
  nationality: string;
  passport_number: string | null;
  passport_expiry: string | null;
}

export function useBuyerStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['buyer-kyc-status', user?.id],
    queryFn: async (): Promise<BuyerRecord | null> => {
      if (!user) return null;
      const { data, error } = await supabase.functions.invoke('devmod-buyer-kyc', {
        body: { action: 'status' },
      });
      if (error) return null;
      const result = data as { buyer: BuyerRecord | null };
      return result.buyer ?? null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useSubmitKycLite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      firstName: string;
      lastName: string;
      nationality: string;
      dateOfBirth?: string;
      phone?: string;
      email?: string;
      leadId?: string;
    }): Promise<{ buyer_id: string; kyc_status: string }> => {
      const { data, error } = await supabase.functions.invoke('devmod-buyer-kyc', {
        body: {
          action: 'lite',
          first_name: opts.firstName,
          last_name: opts.lastName,
          nationality: opts.nationality,
          date_of_birth: opts.dateOfBirth ?? null,
          phone: opts.phone ?? null,
          email: opts.email ?? null,
          lead_id: opts.leadId ?? null,
        },
      });
      if (error) throw new Error(String(error));
      const result = data as { error?: string; buyer_id?: string; kyc_status?: string };
      if (result.error) throw new Error(result.error);
      return result as { buyer_id: string; kyc_status: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer-kyc-status'] });
      toast.success('Данные сохранены');
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка сохранения KYC'),
  });
}

// ── Masked Communications (Phase 3) ──

export interface MaskedChannelResult {
  channel_id: string;
  masked_email: string;
  expires_at: string;
  reused: boolean;
}

export function useCreateMaskedChannel() {
  return useMutation({
    mutationFn: async (opts: {
      leadId: string;
      buyerId?: string;
      reservationId?: string;
      stage?: string;
    }): Promise<MaskedChannelResult> => {
      const { data, error } = await supabase.functions.invoke('devmod-masked-channel-create', {
        body: {
          lead_id: opts.leadId,
          buyer_id: opts.buyerId ?? null,
          reservation_id: opts.reservationId ?? null,
          stage: opts.stage ?? 'inquiry',
        },
      });
      if (error) throw new Error(String(error));
      const result = data as { error?: string } & MaskedChannelResult;
      if (result.error) throw new Error(result.error);
      return result as MaskedChannelResult;
    },
    onError: (e: Error) => toast.error(e.message || 'Ошибка создания канала'),
  });
}

export function useDeveloperProjects(developerId?: string) {
  return useQuery({
    queryKey: ['developer-projects', developerId],
    queryFn: async () => {
      if (!developerId) return [];
      const { data, error } = await supabase
        .from('property_projects')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!developerId,
  });
}

export function useApplyAsDeveloper() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name_en: string; name_ru: string; email?: string; phone?: string; website?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const slug = data.name_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { error } = await supabase.from('developers').insert({
        ...data,
        user_id: user.id,
        slug,
        is_active: true,
        is_verified: false,
        is_featured: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      toast.success('Заявка отправлена');
    },
    onError: () => toast.error('Ошибка при создании'),
  });
}
