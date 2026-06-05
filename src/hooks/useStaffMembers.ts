import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { toast } from 'sonner';

export type StaffRole = 'cleaner' | 'maintenance' | 'manager' | 'admin' | 'staff';
export type PayType = 'salary' | 'hourly' | 'daily' | 'per_task';

export interface StaffMember {
  id: string;
  owner_id: string;
  name: string;
  role: StaffRole;
  custom_title?: string;
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

export type StaffMemberInsert = Omit<StaffMember, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;
const db = supabase;

export function useStaffMembers() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['staff-members', user?.id, activeCompanyId],
    enabled: !!user,
    queryFn: async () => {
      let query = db
        .from('staff_members')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // If user is in an MC, show company-wide staff; otherwise show own staff
      if (activeCompanyId) {
        query = query.eq('company_id', activeCompanyId);
      } else {
        query = query.eq('owner_id', user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });
}

export function useAllStaffMembers() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const activeCompanyId = activeCompany?.company_id ?? null;

  return useQuery({
    queryKey: ['staff-members-all', user?.id, activeCompanyId],
    enabled: !!user,
    queryFn: async () => {
      let query = db
        .from('staff_members')
        .select('*')
        .order('name');

      if (activeCompanyId) {
        query = query.eq('company_id', activeCompanyId);
      } else {
        query = query.eq('owner_id', user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as StaffMember[];
    },
  });
}

export function useCreateStaffMember() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StaffMemberInsert) => {
      if (!user) throw new Error('Not authenticated');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = { 
        ...payload, 
        owner_id: user.id,
      };
      // Auto-link to active MC if user is a member
      if (activeCompany?.company_id) {
        insertData.company_id = activeCompany.company_id;
      }
      const { data, error } = await db
        .from('staff_members')
        .insert(insertData)
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
    onError: () => {
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
    onError: () => {
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

// Staff property assignments removed (table dropped 2026-06-05; Y1 HRIS scope cut).

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
