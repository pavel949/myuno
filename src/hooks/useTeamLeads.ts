import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';

export type LeadStatus = 'pending' | 'contacted' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type LeadRequestType = 'vacation_rental' | 'property_consultation' | 'property_tour' | 'full_management' | 'investment_advice';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  request_type: LeadRequestType;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
  sla_deadline: string | null;
  first_contact_at: string | null;
  last_contact_at: string | null;
  contact_attempts: number;
  lead_source: string;
  // Request details
  property_types: string[] | null;
  districts: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  preferred_dates: Json | null;
  guests_count: number | null;
  children_count: number | null;
  purpose: string | null;
  notes: string | null;
  admin_notes: string | null;
  assigned_to: string | null;
  currency: string | null;
  conversion_order_id: string | null;
}

export interface LeadFilters {
  status?: LeadStatus | 'all';
  requestType?: LeadRequestType | 'all';
  assignedTo?: string | 'all' | 'unassigned';
  overdue?: boolean;
  search?: string;
}

export function useTeamLeads(filters?: LeadFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ['team-leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.requestType && filters.requestType !== 'all') {
        query = query.eq('request_type', filters.requestType);
      }

      if (filters?.assignedTo === 'unassigned') {
        query = query.is('assigned_to', null);
      } else if (filters?.assignedTo && filters.assignedTo !== 'all') {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.overdue) {
        query = query.lt('sla_deadline', new Date().toISOString());
      }

      if (filters?.search) {
        const s = sanitizeSearchTerm(filters.search);
        if (s) query = query.or(`name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Lead[];
    },
    enabled: !!user,
  });

  const recordContact = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status?: LeadStatus; 
      notes?: string;
    }) => {
      // Get current lead data
      const { data: lead } = await supabase
        .from('consultation_requests')
        .select('first_contact_at, contact_attempts')
        .eq('id', id)
        .single();

      const updates: Record<string, any> = {
        last_contact_at: new Date().toISOString(),
        contact_attempts: (lead?.contact_attempts || 0) + 1,
      };

      // Set first_contact_at if this is the first contact
      if (!lead?.first_contact_at) {
        updates.first_contact_at = new Date().toISOString();
      }

      if (status) {
        updates.status = status;
      }

      if (notes) {
        updates.admin_notes = notes;
      }

      const { error } = await supabase
        .from('consultation_requests')
        .update(updates as never)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leads'] });
      toast('Контакт записан', { description: 'Информация о звонке сохранена' });
    },
    onError: () => {
      toast.error('Ошибка', { description: 'Не удалось сохранить контакт' });
    },
  });

  const updateLead = useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Lead> & { id: string }) => {
      const { error } = await supabase
        .from('consultation_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leads'] });
    },
  });

  const assignLead = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string | null }) => {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ assigned_to: userId })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-leads'] });
      toast('Назначено', { description: 'Лид назначен менеджеру' });
    },
  });

  // Computed stats
  const stats = {
    total: leads?.length || 0,
    pending: leads?.filter(l => l.status === 'pending').length || 0,
    contacted: leads?.filter(l => l.status === 'contacted').length || 0,
    inProgress: leads?.filter(l => l.status === 'in_progress' || l.status === 'scheduled').length || 0,
    completed: leads?.filter(l => l.status === 'completed').length || 0,
    overdue: leads?.filter(l => l.sla_deadline && new Date(l.sla_deadline) < new Date() && l.status === 'pending').length || 0,
  };

  // Get leads sorted by SLA urgency
  const sortedByUrgency = [...(leads || [])].sort((a, b) => {
    // Pending first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    
    // Then by SLA deadline
    if (a.sla_deadline && b.sla_deadline) {
      return new Date(a.sla_deadline).getTime() - new Date(b.sla_deadline).getTime();
    }
    
    return 0;
  });

  return {
    leads,
    sortedByUrgency,
    stats,
    isLoading,
    refetch,
    recordContact: recordContact.mutateAsync,
    updateLead: updateLead.mutateAsync,
    assignLead: assignLead.mutateAsync,
    isRecordingContact: recordContact.isPending,
  };
}

// Helper to calculate time remaining for SLA
export function getSlaStatus(slaDeadline: string | null): {
  label: string;
  color: string;
  isOverdue: boolean;
  minutesRemaining: number;
} {
  if (!slaDeadline) {
    return { label: 'Нет SLA', color: 'text-muted-foreground', isOverdue: false, minutesRemaining: Infinity };
  }

  const now = new Date();
  const deadline = new Date(slaDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 0) {
    const overdueMins = Math.abs(diffMins);
    if (overdueMins < 60) {
      return { label: `Просрочено ${overdueMins} мин`, color: 'text-destructive', isOverdue: true, minutesRemaining: diffMins };
    }
    const overdueHours = Math.floor(overdueMins / 60);
    return { label: `Просрочено ${overdueHours} ч`, color: 'text-destructive', isOverdue: true, minutesRemaining: diffMins };
  }

  if (diffMins < 30) {
    return { label: `${diffMins} мин`, color: 'text-accent-amber', isOverdue: false, minutesRemaining: diffMins };
  }

  if (diffMins < 60) {
    return { label: `${diffMins} мин`, color: 'text-warning', isOverdue: false, minutesRemaining: diffMins };
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours < 24) {
    return { label: `${hours}ч ${mins}м`, color: 'text-success', isOverdue: false, minutesRemaining: diffMins };
  }

  const days = Math.floor(hours / 24);
  return { label: `${days} дн`, color: 'text-success', isOverdue: false, minutesRemaining: diffMins };
}
