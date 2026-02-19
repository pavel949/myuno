import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type StaffRole = 'cleaner' | 'maintenance' | 'manager' | 'admin' | 'staff';
export type PayType = 'salary' | 'hourly' | 'daily' | 'per_task';

export interface StaffMember {
  id: string;
  owner_id: string;
  name: string;
  role: StaffRole;
  phone?: string;
  email?: string;
  notes?: string;
  hourly_rate?: number;
  daily_rate?: number;
  monthly_salary?: number;
  pay_type: PayType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffPropertyAssignment {
  id: string;
  staff_id: string;
  property_id: string;
  owner_id: string;
  role_at_property?: string;
  is_primary: boolean;
  assigned_at: string;
}

export type StaffMemberInsert = Omit<StaffMember, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useStaffMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-members', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });
}

export function useAllStaffMembers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-members-all', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('staff_members')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });
}

export function useCreateStaffMember() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StaffMemberInsert) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await db
        .from('staff_members')
        .insert({ ...payload, owner_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['staff-members-all'] });
      toast.success('Сотрудник добавлен');
    },
    onError: (e) => {
      console.error(e);
      toast.error('Ошибка при добавлении сотрудника');
    },
  });
}

export function useUpdateStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffMember> & { id: string }) => {
      const { data, error } = await db
        .from('staff_members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as StaffMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['staff-members-all'] });
      toast.success('Данные сотрудника обновлены');
    },
    onError: (e) => {
      console.error(e);
      toast.error('Ошибка при обновлении сотрудника');
    },
  });
}

export function useDeactivateStaffMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db
        .from('staff_members')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members'] });
      queryClient.invalidateQueries({ queryKey: ['staff-members-all'] });
      toast.success('Сотрудник деактивирован');
    },
  });
}

/** Staff assignments to properties */
export function useStaffPropertyAssignments(staffId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['staff-assignments', staffId],
    enabled: !!user,
    queryFn: async () => {
      let q = db
        .from('staff_property_assignments')
        .select('*');
      if (staffId) q = q.eq('staff_id', staffId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as StaffPropertyAssignment[];
    },
  });
}

export function useAssignStaffToProperty() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      propertyId,
      roleAtProperty,
      isPrimary = false,
    }: {
      staffId: string;
      propertyId: string;
      roleAtProperty?: string;
      isPrimary?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await db
        .from('staff_property_assignments')
        .upsert({
          staff_id: staffId,
          property_id: propertyId,
          owner_id: user.id,
          role_at_property: roleAtProperty,
          is_primary: isPrimary,
        }, { onConflict: 'staff_id,property_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
      toast.success('Назначение сохранено');
    },
  });
}

export function useRemoveStaffAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await db
        .from('staff_property_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-assignments'] });
    },
  });
}

export const STAFF_ROLES: { value: StaffRole; labelRu: string; labelEn: string }[] = [
  { value: 'cleaner', labelRu: 'Уборщик/ца', labelEn: 'Cleaner' },
  { value: 'maintenance', labelRu: 'Мастер / Техник', labelEn: 'Maintenance' },
  { value: 'manager', labelRu: 'Управляющий', labelEn: 'Manager' },
  { value: 'admin', labelRu: 'Администратор', labelEn: 'Admin' },
  { value: 'staff', labelRu: 'Сотрудник', labelEn: 'Staff' },
];

export const PAY_TYPES: { value: PayType; labelRu: string; labelEn: string }[] = [
  { value: 'salary', labelRu: 'Оклад (в месяц)', labelEn: 'Monthly Salary' },
  { value: 'hourly', labelRu: 'Почасовая', labelEn: 'Hourly Rate' },
  { value: 'daily', labelRu: 'Дневная ставка', labelEn: 'Daily Rate' },
  { value: 'per_task', labelRu: 'За задачу', labelEn: 'Per Task' },
];
