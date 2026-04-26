import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createErrorHandler } from '@/lib/errorHandler';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import type { Database } from '@/integrations/supabase/types';

type MccLeadRow = Database['public']['Tables']['mcc_leads']['Row'];
type ConsultationRow = Database['public']['Tables']['consultation_requests']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const errorLog = createErrorHandler('useLeadHub');

export type LeadSource = 'mcc' | 'consultations' | 'registered' | 'all';
export type LeadPriority = 'hot' | 'warm' | 'cold';
export type LeadStatus = 'new' | 'contacted' | 'engaged' | 'qualified' | 'converted' | 'lost';

// Unified lead type combining mcc_leads and consultation_requests
export interface UnifiedLead {
  id: string;
  source_table: 'mcc_leads' | 'consultation_requests' | 'profiles';
  name: string;
  email: string | null;
  phone: string | null;
  priority: LeadPriority;
  status: string;
  score: number | null;
  ai_score: number | null;
  ai_priority: string | null;
  ai_reasoning: string | null;
  source_channel: string | null;
  request_type: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
}

interface LeadHubFilters {
  source?: LeadSource;
  priority?: LeadPriority | null;
  status?: string | null;
  search?: string;
}

interface LeadStats {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  converted: number;
  withAiScore: number;
  fromConsultations: number;
  fromMCC: number;
  fromRegistered: number;
}

// Map consultation_requests ai_priority to lead priority
function mapAiPriorityToLeadPriority(aiPriority: string | null): LeadPriority {
  if (!aiPriority) return 'warm';
  const lowerPriority = aiPriority.toLowerCase();
  if (lowerPriority.includes('hot') || lowerPriority.includes('high')) return 'hot';
  if (lowerPriority.includes('cold') || lowerPriority.includes('low')) return 'cold';
  return 'warm';
}

// Map consultation status to lead status
function mapConsultationStatus(status: string | null): string {
  if (!status) return 'new';
  const statusMap: Record<string, string> = {
    'pending': 'new',
    'contacted': 'contacted',
    'scheduled': 'engaged',
    'in_progress': 'engaged',
    'completed': 'converted',
    'cancelled': 'lost',
  };
  return statusMap[status] || 'new';
}

export function useLeadHub(filters: LeadHubFilters = {}) {
  const queryClient = useQueryClient();
  const { source = 'all', priority, status, search } = filters;

  // Fetch leads from both tables
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['lead-hub', source, priority, status, search],
    queryFn: async () => {
      const unifiedLeads: UnifiedLead[] = [];

      // Fetch from mcc_leads if needed
      if (source === 'mcc' || source === 'all') {
        let mccQuery = supabase
          .from('mcc_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (priority) {
          mccQuery = mccQuery.eq('priority', priority);
        }
        if (status) {
          mccQuery = mccQuery.eq('status', status);
        }
        if (search) {
          const ss = sanitizeSearchTerm(search);
          if (ss) mccQuery = mccQuery.or(`email.ilike.%${ss}%,name.ilike.%${ss}%,phone.ilike.%${ss}%`);
        }

        const { data: mccLeads, error: mccError } = await mccQuery;
        if (mccError) {
          errorLog.silent(mccError, 'fetch_mcc_leads');
        } else if (mccLeads) {
          mccLeads.forEach((lead: MccLeadRow) => {
            unifiedLeads.push({
              id: lead.id,
              source_table: 'mcc_leads',
              name: lead.name || '',
              email: lead.email,
              phone: lead.phone,
              priority: (lead.priority as LeadPriority) || 'warm',
              status: lead.status || 'new',
              score: lead.score,
              ai_score: null,
              ai_priority: null,
              ai_reasoning: null,
              source_channel: lead.source,
              request_type: null,
              user_id: lead.converted_to,
              created_at: lead.created_at,
              updated_at: lead.updated_at,
            });
          });
        }
      }

      // Fetch from consultation_requests if needed
      if (source === 'consultations' || source === 'all') {
        let consultationsQuery = supabase
          .from('consultation_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (search) {
          const sc = sanitizeSearchTerm(search);
          if (sc) consultationsQuery = consultationsQuery.or(`email.ilike.%${sc}%,name.ilike.%${sc}%,phone.ilike.%${sc}%`);
        }

        const { data: consultations, error: consultationsError } = await consultationsQuery;
        if (consultationsError) {
          errorLog.silent(consultationsError, 'fetch_consultations');
        } else if (consultations) {
          consultations.forEach((consultation: ConsultationRow) => {
            const mappedPriority = mapAiPriorityToLeadPriority(consultation.ai_priority);
            const mappedStatus = mapConsultationStatus(consultation.status);

            // Apply filters
            if (priority && mappedPriority !== priority) return;
            if (status && mappedStatus !== status) return;

            unifiedLeads.push({
              id: consultation.id,
              source_table: 'consultation_requests',
              name: consultation.name || '',
              email: consultation.email,
              phone: consultation.phone,
              priority: mappedPriority,
              status: mappedStatus,
              score: null,
              ai_score: consultation.ai_score,
              ai_priority: consultation.ai_priority,
              ai_reasoning: consultation.ai_reasoning,
              source_channel: 'Consultation Form',
              request_type: consultation.request_type,
              user_id: consultation.user_id,
              created_at: consultation.created_at,
              updated_at: consultation.updated_at,
            });
          });
        }
      }

      // Fetch registered users from profiles (exclude test users)
      if (source === 'registered' || source === 'all') {
        let profilesQuery = supabase
          .from('profiles')
          .select('id, full_name, email, phone, user_type, created_at, updated_at, avatar_url')
          .not('email', 'like', '%@test.com')
          .not('email', 'like', 'test-%@myuno.app')
          .order('created_at', { ascending: false })
          .limit(200);

        if (search) {
          const sp = sanitizeSearchTerm(search);
          if (sp) profilesQuery = profilesQuery.or(`email.ilike.%${sp}%,full_name.ilike.%${sp}%,phone.ilike.%${sp}%`);
        }

        const { data: profiles, error: profilesError } = await profilesQuery;
        if (profilesError) {
          errorLog.silent(profilesError, 'fetch_profiles');
        } else if (profiles) {
          // Collect existing lead emails to avoid duplicates
          const existingEmails = new Set(unifiedLeads.map(l => l.email?.toLowerCase()).filter(Boolean));

          (profiles as ProfileRow[]).forEach((profile) => {
            // Skip if already exists as a lead
            if (profile.email && existingEmails.has(profile.email.toLowerCase())) return;
            // Skip priority/status filters for registered users (they're all "warm" / "new" by default)
            if (priority && priority !== 'warm') return;
            if (status && status !== 'new' && status !== 'qualified') return;

            unifiedLeads.push({
              id: profile.id,
              source_table: 'profiles',
              name: profile.full_name || profile.email?.split('@')[0] || '',
              email: profile.email,
              phone: profile.phone,
              priority: 'warm',
              status: 'qualified',
              score: null,
              ai_score: null,
              ai_priority: null,
              ai_reasoning: null,
              source_channel: 'Registration',
              request_type: profile.user_type || 'user',
              user_id: profile.id,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });
          });
        }
      }

      // Sort by created_at desc
      unifiedLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return unifiedLeads;
    }
  });

  // Calculate stats
  const { data: stats } = useQuery({
    queryKey: ['lead-hub-stats'],
    queryFn: async (): Promise<LeadStats> => {
      const [mccRes, consultRes, profilesRes] = await Promise.all([
        supabase.from('mcc_leads').select('priority, status'),
        supabase.from('consultation_requests').select('status, ai_score, ai_priority'),
        supabase.from('profiles').select('id')
          .not('email', 'like', '%@test.com')
          .not('email', 'like', 'test-%@myuno.app'),
      ]);

      const mccData = mccRes.data || [];
      const consultData = consultRes.data || [];
      const registeredCount = (profilesRes.data || []).length;

      const mccHot = mccData.filter(l => l.priority === 'hot').length;
      const mccWarm = mccData.filter(l => l.priority === 'warm').length;
      const mccCold = mccData.filter(l => l.priority === 'cold').length;
      const mccConverted = mccData.filter(l => l.status === 'converted').length;

      const consultHot = consultData.filter(c => mapAiPriorityToLeadPriority(c.ai_priority) === 'hot').length;
      const consultWarm = consultData.filter(c => mapAiPriorityToLeadPriority(c.ai_priority) === 'warm').length;
      const consultCold = consultData.filter(c => mapAiPriorityToLeadPriority(c.ai_priority) === 'cold').length;
      const consultConverted = consultData.filter(c => c.status === 'completed').length;
      const withAiScore = consultData.filter(c => c.ai_score !== null).length;

      return {
        total: mccData.length + consultData.length + registeredCount,
        hot: mccHot + consultHot,
        warm: mccWarm + consultWarm + registeredCount,
        cold: mccCold + consultCold,
        converted: mccConverted + consultConverted,
        withAiScore,
        fromConsultations: consultData.length,
        fromMCC: mccData.length,
        fromRegistered: registeredCount,
      };
    }
  });

  // Update lead status
  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, sourceTable, status }: { id: string; sourceTable: 'mcc_leads' | 'consultation_requests'; status: string }) => {
      if (sourceTable === 'mcc_leads') {
        const { error } = await supabase
          .from('mcc_leads')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Map back to consultation status
        const consultationStatusMap: Record<string, string> = {
          'new': 'pending',
          'contacted': 'contacted',
          'engaged': 'scheduled',
          'qualified': 'in_progress',
          'converted': 'completed',
          'lost': 'cancelled',
        };
        const { error } = await supabase
          .from('consultation_requests')
          .update({ status: consultationStatusMap[status] || status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-hub'] });
      queryClient.invalidateQueries({ queryKey: ['lead-hub-stats'] });
      toast.success('Lead status updated');
    },
    onError: (error) => {
      errorLog.silent(error, 'update_lead_status');
      toast.error('Failed to update lead status');
    }
  });

  // Update lead priority (only for mcc_leads)
  const updateLeadPriority = useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: LeadPriority }) => {
      const { error } = await supabase
        .from('mcc_leads')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-hub'] });
      queryClient.invalidateQueries({ queryKey: ['lead-hub-stats'] });
      toast.success('Lead priority updated');
    },
    onError: (error) => {
      errorLog.silent(error, 'update_lead_priority');
      toast.error('Failed to update lead priority');
    }
  });

  return {
    leads: leads || [],
    stats: stats || {
      total: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      converted: 0,
      withAiScore: 0,
      fromConsultations: 0,
      fromMCC: 0,
      fromRegistered: 0,
    },
    isLoading,
    error,
    updateLeadStatus,
    updateLeadPriority,
  };
}

// Hook to get recent leads for Overview
export function useRecentLeads(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-leads', limit],
    queryFn: async () => {
      // Combine from both tables
      const { data: mccLeads } = await supabase
        .from('mcc_leads')
        .select('id, name, email, priority, source, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: consultations } = await supabase
        .from('consultation_requests')
        .select('id, name, email, ai_priority, request_type, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      const combined = [
        ...(mccLeads ?? []).map((l) => ({
          id: l.id,
          name: l.name || l.email?.split('@')[0] || 'Unknown',
          priority: (l.priority as LeadPriority) || 'warm',
          source: l.source || 'MCC',
          created_at: l.created_at,
          source_table: 'mcc_leads' as const,
        })),
        ...(consultations ?? []).map((c) => ({
          id: c.id,
          name: c.name || c.email?.split('@')[0] || 'Unknown',
          priority: mapAiPriorityToLeadPriority(c.ai_priority),
          source: c.request_type || 'Consultation',
          created_at: c.created_at,
          source_table: 'consultation_requests' as const,
        })),
      ];

      // Sort by created_at and take top N
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return combined.slice(0, limit);
    }
  });
}
