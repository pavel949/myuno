/**
 * CRM reminders for contacts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { typedFrom } from '@/lib/untypedTables';
import type { CrmReminder } from '@/types/contact';

/** Fetch reminders for a contact */
export function useContactReminders(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-reminders', contactId],
    queryFn: async (): Promise<CrmReminder[]> => {
      if (!contactId) return [];
      const { data, error } = await typedFrom('crm_reminders')
        .select('*')
        .eq('contact_id', contactId)
        .eq('is_dismissed', false)
        .order('reminder_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrmReminder[];
    },
    enabled: !!contactId,
  });
}

/** Create reminder */
export function useCreateContactReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      companyId,
      reminderAt,
      note,
      isRepeating,
      repeatRule,
      createdBy,
    }: {
      contactId: string;
      companyId: string;
      reminderAt: string;
      note?: string;
      isRepeating?: boolean;
      repeatRule?: string;
      createdBy?: string;
    }) => {
      const { data, error } = await typedFrom('crm_reminders')
        .insert({
          contact_id: contactId,
          company_id: companyId,
          reminder_at: reminderAt,
          note: note || null,
          is_repeating: isRepeating ?? false,
          repeat_rule: repeatRule || null,
          created_by: createdBy || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-reminders', vars.contactId] });
    },
  });
}

/** Dismiss reminder */
export function useDismissContactReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      const { error } = await typedFrom('crm_reminders')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { id, contactId };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-reminders', vars.contactId] });
    },
  });
}

/** Delete reminder */
export function useDeleteContactReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contactId }: { id: string; contactId: string }) => {
      const { error } = await typedFrom('crm_reminders').delete().eq('id', id);
      if (error) throw error;
      return { id, contactId };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contact-reminders', vars.contactId] });
    },
  });
}
