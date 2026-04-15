/**
 * Hook for company-specific CRM option customization.
 * Categories: contact_type, lead_source, deal_type, task_type, lost_reason, win_reason
 * Deal stages are handled separately by useDealPipelineStages.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CrmOptionCategory =
  | 'contact_type'
  | 'lead_source'
  | 'deal_type'
  | 'task_type'
  | 'lost_reason'
  | 'win_reason';

export interface CrmCustomOption {
  id: string;
  company_id: string;
  category: CrmOptionCategory;
  value: string;
  label_en: string;
  label_ru: string;
  short_en: string | null;
  short_ru: string | null;
  color: string | null;
  icon: string | null;
  probability: number | null;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

const QUERY_KEY = 'crm-custom-options';

// ─── Default options (used when company has no custom ones) ───

export const DEFAULT_CONTACT_TYPES: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'contact_type', value: 'buyer', label_en: 'Buyer', label_ru: 'Покупатель', color: '#3b82f6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'contact_type', value: 'seller', label_en: 'Seller', label_ru: 'Продавец', color: '#22c55e', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'contact_type', value: 'investor', label_en: 'Investor', label_ru: 'Инвестор', color: '#f59e0b', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'contact_type', value: 'tenant', label_en: 'Tenant', label_ru: 'Арендатор', color: '#06b6d4', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
  { category: 'contact_type', value: 'landlord', label_en: 'Landlord', label_ru: 'Арендодатель', color: '#8b5cf6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 5 },
  { category: 'contact_type', value: 'agent', label_en: 'Agent', label_ru: 'Агент', color: '#78716c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 6 },
  { category: 'contact_type', value: 'developer', label_en: 'Developer', label_ru: 'Застройщик', color: '#0d9488', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 7 },
  { category: 'contact_type', value: 'broker', label_en: 'Broker', label_ru: 'Брокер', color: '#6366f1', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 8 },
  { category: 'contact_type', value: 'tourist', label_en: 'Tourist / short stay', label_ru: 'Турист / краткий визит', color: '#14b8a6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 9 },
  { category: 'contact_type', value: 'resident', label_en: 'Resident', label_ru: 'Резидент', color: '#0891b2', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 10 },
  { category: 'contact_type', value: 'corporate', label_en: 'Corporate / B2B', label_ru: 'Компания / B2B', color: '#4f46e5', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 11 },
  { category: 'contact_type', value: 'services', label_en: 'Services (visa, legal, lifestyle)', label_ru: 'Услуги (виза, юр., lifestyle)', color: '#db2777', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 12 },
];

export const DEFAULT_LEAD_SOURCES: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'lead_source', value: 'website', label_en: 'Website', label_ru: 'Сайт', color: '#3b82f6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'lead_source', value: 'referral', label_en: 'Referral', label_ru: 'Рекомендация', color: '#22c55e', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'lead_source', value: 'walk-in', label_en: 'Walk-in', label_ru: 'Визит', color: '#f59e0b', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'lead_source', value: 'social', label_en: 'Social Media', label_ru: 'Соцсети', color: '#ec4899', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
  { category: 'lead_source', value: 'agent_network', label_en: 'Agent Network', label_ru: 'Сеть агентов', color: '#8b5cf6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 5 },
  { category: 'lead_source', value: 'other', label_en: 'Other', label_ru: 'Другое', color: '#78716c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 6 },
  { category: 'lead_source', value: 'instagram', label_en: 'Instagram', label_ru: 'Instagram', color: '#e11d48', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 7 },
  { category: 'lead_source', value: 'facebook', label_en: 'Facebook', label_ru: 'Facebook', color: '#2563eb', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 8 },
  { category: 'lead_source', value: 'telegram', label_en: 'Telegram', label_ru: 'Telegram', color: '#0284c7', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 9 },
  { category: 'lead_source', value: 'youtube', label_en: 'YouTube', label_ru: 'YouTube', color: '#dc2626', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 10 },
  { category: 'lead_source', value: 'google_ads', label_en: 'Google Ads', label_ru: 'Google Ads', color: '#ea4335', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 11 },
  { category: 'lead_source', value: 'meta_ads', label_en: 'Meta Ads', label_ru: 'Meta Ads', color: '#0668E1', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 12 },
  { category: 'lead_source', value: 'email_campaign', label_en: 'Email campaign', label_ru: 'Email-рассылка', color: '#7c3aed', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 13 },
  { category: 'lead_source', value: 'event_expo', label_en: 'Event / exhibition', label_ru: 'Мероприятие / выставка', color: '#c026d3', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 14 },
  { category: 'lead_source', value: 'cold_outreach', label_en: 'Cold outreach', label_ru: 'Холодные контакты', color: '#64748b', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 15 },
  { category: 'lead_source', value: 'chat_widget', label_en: 'Chat widget', label_ru: 'Чат на сайте', color: '#0d9488', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 16 },
  { category: 'lead_source', value: 'partner', label_en: 'Partner', label_ru: 'Партнёр', color: '#059669', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 17 },
  { category: 'lead_source', value: 'repeat_client', label_en: 'Repeat client', label_ru: 'Повторное обращение', color: '#ca8a04', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 18 },
];

export const DEFAULT_DEAL_TYPES: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'deal_type', value: 'sale', label_en: 'Sale', label_ru: 'Продажа', color: '#3b82f6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'deal_type', value: 'rent', label_en: 'Rent', label_ru: 'Аренда', color: '#22c55e', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'deal_type', value: 'investment', label_en: 'Investment', label_ru: 'Инвестиция', color: '#f59e0b', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'deal_type', value: 'management', label_en: 'Management', label_ru: 'Управление', color: '#8b5cf6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
];

export const DEFAULT_TASK_TYPES: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'task_type', value: 'call', label_en: 'Call', label_ru: 'Звонок', color: '#22c55e', icon: 'Phone', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'task_type', value: 'email', label_en: 'Email', label_ru: 'Письмо', color: '#06b6d4', icon: 'Mail', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'task_type', value: 'message', label_en: 'Message', label_ru: 'Сообщение', color: '#3b82f6', icon: 'MessageSquare', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'task_type', value: 'meeting', label_en: 'Meeting', label_ru: 'Встреча', color: '#f59e0b', icon: 'Users', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
  { category: 'task_type', value: 'viewing', label_en: 'Viewing', label_ru: 'Показ', color: '#78716c', icon: 'Eye', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 5 },
  { category: 'task_type', value: 'follow_up', label_en: 'Follow-up', label_ru: 'Напоминание', color: '#f97316', icon: 'Bell', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 6 },
  { category: 'task_type', value: 'document', label_en: 'Document', label_ru: 'Документ', color: '#78716c', icon: 'FileText', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 7 },
  { category: 'task_type', value: 'contract', label_en: 'Contract', label_ru: 'Договор', color: '#ef4444', icon: 'PenTool', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 8 },
  { category: 'task_type', value: 'payment', label_en: 'Payment', label_ru: 'Оплата', color: '#22c55e', icon: 'CreditCard', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 9 },
  { category: 'task_type', value: 'send', label_en: 'Send Materials', label_ru: 'Отправить', color: '#06b6d4', icon: 'Send', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 10 },
  { category: 'task_type', value: 'negotiation', label_en: 'Negotiation', label_ru: 'Переговоры', color: '#3b82f6', icon: 'Handshake', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 11 },
  { category: 'task_type', value: 'other', label_en: 'Other', label_ru: 'Прочее', color: '#78716c', icon: 'ClipboardList', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 12 },
  { category: 'task_type', value: 'check_in', label_en: 'Check-in / arrival', label_ru: 'Заезд / прибытие', color: '#0d9488', icon: 'CalendarCheck', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 13 },
  { category: 'task_type', value: 'key_handover', label_en: 'Key handover', label_ru: 'Передача ключей', color: '#a16207', icon: 'Key', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 14 },
  { category: 'task_type', value: 'installment_reminder', label_en: 'Installment / payment schedule', label_ru: 'Взнос / график платежей', color: '#c026d3', icon: 'CalendarClock', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 15 },
  { category: 'task_type', value: 'reservation', label_en: 'Reservation / booking fee', label_ru: 'Бронь / booking fee', color: '#ea580c', icon: 'Bookmark', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 16 },
  { category: 'task_type', value: 'kyc_docs', label_en: 'KYC / documents', label_ru: 'KYC / документы', color: '#0369a1', icon: 'ShieldCheck', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 17 },
  { category: 'task_type', value: 'onboarding_visit', label_en: 'Onboarding / property visit', label_ru: 'Онбординг / осмотр объекта', color: '#4f46e5', icon: 'Home', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 18 },
  { category: 'task_type', value: 'renewal_call', label_en: 'Renewal / upsell call', label_ru: 'Продление / upsell', color: '#65a30d', icon: 'PhoneForwarded', short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 19 },
];

export const DEFAULT_LOST_REASONS: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'lost_reason', value: 'price', label_en: 'Price too high', label_ru: 'Слишком дорого', color: '#ef4444', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'lost_reason', value: 'competitor', label_en: 'Chose competitor', label_ru: 'Выбрал конкурента', color: '#f59e0b', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'lost_reason', value: 'no_budget', label_en: 'No budget', label_ru: 'Нет бюджета', color: '#78716c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'lost_reason', value: 'timing', label_en: 'Bad timing', label_ru: 'Неподходящее время', color: '#06b6d4', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
  { category: 'lost_reason', value: 'no_response', label_en: 'No response', label_ru: 'Нет ответа', color: '#8b5cf6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 5 },
  { category: 'lost_reason', value: 'location', label_en: 'Wrong location', label_ru: 'Не подошла локация', color: '#3b82f6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 6 },
  { category: 'lost_reason', value: 'changed_mind', label_en: 'Changed mind', label_ru: 'Передумал', color: '#ec4899', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 7 },
  { category: 'lost_reason', value: 'financing_failed', label_en: 'Financing failed', label_ru: 'Не прошло финансирование', color: '#b91c1c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 8 },
  { category: 'lost_reason', value: 'developer_delay', label_en: 'Developer / project delay', label_ru: 'Задержка застройщика / проекта', color: '#c2410c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 9 },
  { category: 'lost_reason', value: 'visa_issue', label_en: 'Visa / stay issue', label_ru: 'Виза / легальный статус', color: '#0369a1', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 10 },
  { category: 'lost_reason', value: 'unit_sold_to_other', label_en: 'Unit sold to someone else', label_ru: 'Лот продан другому', color: '#7c2d12', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 11 },
  { category: 'lost_reason', value: 'decided_to_rent_not_buy', label_en: 'Decided to rent instead of buy', label_ru: 'Решил арендовать вместо покупки', color: '#57534e', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 12 },
  { category: 'lost_reason', value: 'other', label_en: 'Other', label_ru: 'Другое', color: '#78716c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 13 },
];

export const DEFAULT_WIN_REASONS: Omit<CrmCustomOption, 'id' | 'company_id'>[] = [
  { category: 'win_reason', value: 'cash_or_transfer', label_en: 'Cash / transfer closed', label_ru: 'Оплата наличными / перевод', color: '#15803d', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 1 },
  { category: 'win_reason', value: 'mortgage_financed', label_en: 'Mortgage or financing approved', label_ru: 'Ипотека / финансирование одобрено', color: '#0d9488', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 2 },
  { category: 'win_reason', value: 'spa_or_reservation', label_en: 'SPA or reservation completed', label_ru: 'SPA / бронь завершены', color: '#7c3aed', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 3 },
  { category: 'win_reason', value: 'referral_or_partner', label_en: 'Referral or partner intro', label_ru: 'Реферал / партнёр', color: '#2563eb', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 4 },
  { category: 'win_reason', value: 'repeat_client', label_en: 'Repeat client', label_ru: 'Повторный клиент', color: '#ca8a04', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 5 },
  { category: 'win_reason', value: 'competitive_terms', label_en: 'Strong price or terms', label_ru: 'Сильная цена / условия', color: '#059669', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 6 },
  { category: 'win_reason', value: 'management_signed', label_en: 'PMC / subscription signed', label_ru: 'Договор УК / подписка', color: '#8b5cf6', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 7 },
  { category: 'win_reason', value: 'other', label_en: 'Other', label_ru: 'Другое', color: '#78716c', icon: null, short_en: null, short_ru: null, probability: null, is_system: true, is_active: true, sort_order: 8 },
];

const DEFAULTS_MAP: Record<CrmOptionCategory, Omit<CrmCustomOption, 'id' | 'company_id'>[]> = {
  contact_type: DEFAULT_CONTACT_TYPES,
  lead_source: DEFAULT_LEAD_SOURCES,
  deal_type: DEFAULT_DEAL_TYPES,
  task_type: DEFAULT_TASK_TYPES,
  lost_reason: DEFAULT_LOST_REASONS,
  win_reason: DEFAULT_WIN_REASONS,
};

/** Fetch options for a category, auto-seed defaults if empty */
export function useCrmOptions(companyId: string | undefined, category: CrmOptionCategory) {
  return useQuery({
    queryKey: [QUERY_KEY, companyId, category],
    queryFn: async (): Promise<CrmCustomOption[]> => {
      const { data, error } = await supabase
        .from('crm_custom_options')
        .select('*')
        .eq('company_id', companyId!)
        .eq('category', category)
        .order('sort_order', { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        // Auto-seed defaults
        const defaults = DEFAULTS_MAP[category];
        const inserts = defaults.map(d => ({ ...d, company_id: companyId! }));
        const { data: seeded, error: seedErr } = await supabase
          .from('crm_custom_options')
          .insert(inserts as any)
          .select();
        if (seedErr) throw seedErr;
        return (seeded || []) as unknown as CrmCustomOption[];
      }

      return data as unknown as CrmCustomOption[];
    },
    enabled: !!companyId,
  });
}

/** Get all options for a company (all categories) */
export function useAllCrmOptions(companyId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, companyId, 'all'],
    queryFn: async (): Promise<CrmCustomOption[]> => {
      const { data, error } = await supabase
        .from('crm_custom_options')
        .select('*')
        .eq('company_id', companyId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as CrmCustomOption[];
    },
    enabled: !!companyId,
  });
}

export function useCreateCrmOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (option: Omit<CrmCustomOption, 'id'>) => {
      const { data, error } = await supabase
        .from('crm_custom_options')
        .insert(option as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateCrmOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrmCustomOption> & { id: string }) => {
      const { error } = await supabase
        .from('crm_custom_options')
        .update(updates as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteCrmOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_custom_options')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

/** Helper: get label by value from options array */
export function getOptionLabel(
  options: CrmCustomOption[],
  value: string,
  language: 'en' | 'ru' = 'en'
): string {
  const opt = options.find(o => o.value === value);
  if (!opt) return value;
  return language === 'ru' ? opt.label_ru : opt.label_en;
}
