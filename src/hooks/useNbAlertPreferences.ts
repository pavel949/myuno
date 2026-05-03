/**
 * Per-user notification channel/preferences for newbuild alerts.
 * Backed by public.nb_alert_preferences (PK = user_id).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NbAlertPreferences {
  user_id: string;
  email: string | null;
  whatsapp_phone: string | null;
  notify_new_units: boolean;
  notify_progress_updates: boolean;
  notify_price_changes: boolean;
  channel_email: boolean;
  channel_whatsapp: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  locale: 'ru' | 'en';
}

const DEFAULTS = (userId: string, email: string | null): NbAlertPreferences => ({
  user_id: userId,
  email,
  whatsapp_phone: null,
  notify_new_units: true,
  notify_progress_updates: true,
  notify_price_changes: false,
  channel_email: true,
  channel_whatsapp: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
  locale: 'ru',
});

export function useNbAlertPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['nb-alert-prefs', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NbAlertPreferences> => {
      if (!user) throw new Error('not authenticated');
      const { data, error } = await supabase
        .from('nb_alert_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as NbAlertPreferences) ?? DEFAULTS(user.id, user.email ?? null);
    },
  });

  const save = useMutation({
    mutationFn: async (patch: Partial<NbAlertPreferences>) => {
      if (!user) throw new Error('not authenticated');
      const row = { ...DEFAULTS(user.id, user.email ?? null), ...query.data, ...patch, user_id: user.id };
      const { error } = await supabase
        .from('nb_alert_preferences')
        .upsert([row as never], { onConflict: 'user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nb-alert-prefs', user?.id] }),
  });

  return { ...query, save };
}
