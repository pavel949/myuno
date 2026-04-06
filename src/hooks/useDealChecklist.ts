/**
 * Deal closing checklist — uses crm_tasks with task_type='checklist'
 * Auto-generates default checklist based on deal type (sale/rent/investment/management)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChecklistItem {
  id: string;
  deal_id: string;
  title: string;
  description: string | null;
  status: string; // 'pending' | 'done' | 'skipped'
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

const CHECKLIST_TEMPLATES: Record<string, { title_en: string; title_ru: string; priority: string }[]> = {
  sale: [
    { title_en: 'Title search (Chanote verification)', title_ru: 'Проверка титула (Chanote)', priority: 'high' },
    { title_en: 'Due diligence report', title_ru: 'Отчёт due diligence', priority: 'high' },
    { title_en: 'Lawyer review & contract draft', title_ru: 'Юрист: проверка и договор', priority: 'high' },
    { title_en: 'Deposit / down payment received', title_ru: 'Депозит получен', priority: 'high' },
    { title_en: 'Purchase agreement signed', title_ru: 'Договор купли-продажи подписан', priority: 'high' },
    { title_en: 'Full payment received', title_ru: 'Полная оплата получена', priority: 'medium' },
    { title_en: 'Land Office registration', title_ru: 'Регистрация в Land Office', priority: 'high' },
    { title_en: 'Chanote issued to buyer', title_ru: 'Chanote выдан покупателю', priority: 'high' },
    { title_en: 'Commission invoice sent', title_ru: 'Счёт на комиссию отправлен', priority: 'medium' },
    { title_en: 'Commission received', title_ru: 'Комиссия получена', priority: 'medium' },
  ],
  rent: [
    { title_en: 'Tenant identity verification', title_ru: 'Проверка личности арендатора', priority: 'high' },
    { title_en: 'Income / employment verification', title_ru: 'Проверка дохода', priority: 'medium' },
    { title_en: 'Lease agreement drafted', title_ru: 'Договор аренды подготовлен', priority: 'high' },
    { title_en: 'Security deposit received', title_ru: 'Залог получен', priority: 'high' },
    { title_en: 'Lease signed by both parties', title_ru: 'Договор подписан обеими сторонами', priority: 'high' },
    { title_en: 'Key handover & move-in inspection', title_ru: 'Передача ключей и осмотр', priority: 'high' },
    { title_en: 'TM.30 registration filed', title_ru: 'Регистрация TM.30', priority: 'medium' },
  ],
  investment: [
    { title_en: 'ROI analysis prepared', title_ru: 'Анализ ROI подготовлен', priority: 'high' },
    { title_en: 'Legal structure consultation', title_ru: 'Консультация по юр. структуре', priority: 'high' },
    { title_en: 'Title search & due diligence', title_ru: 'Проверка титула и due diligence', priority: 'high' },
    { title_en: 'Payment structure agreed', title_ru: 'Структура оплаты согласована', priority: 'medium' },
    { title_en: 'Purchase contract signed', title_ru: 'Договор покупки подписан', priority: 'high' },
    { title_en: 'Payment processed', title_ru: 'Оплата проведена', priority: 'high' },
    { title_en: 'Land Office registration', title_ru: 'Регистрация в Land Office', priority: 'high' },
    { title_en: 'PM setup (if rental)', title_ru: 'Настройка управления (если аренда)', priority: 'low' },
  ],
  management: [
    { title_en: 'Property inspection', title_ru: 'Осмотр объекта', priority: 'high' },
    { title_en: 'Management agreement signed', title_ru: 'Договор управления подписан', priority: 'high' },
    { title_en: 'OTA accounts setup', title_ru: 'Настройка аккаунтов OTA', priority: 'medium' },
    { title_en: 'Professional photos taken', title_ru: 'Проф. фотосессия', priority: 'medium' },
    { title_en: 'Listing published', title_ru: 'Листинг опубликован', priority: 'high' },
    { title_en: 'Pricing strategy set', title_ru: 'Ценовая стратегия установлена', priority: 'medium' },
  ],
};

export function useDealChecklist(dealId: string | undefined) {
  return useQuery({
    queryKey: ['deal-checklist', dealId],
    queryFn: async (): Promise<ChecklistItem[]> => {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('deal_id', dealId!)
        .eq('task_type', 'checklist')
        .order('created_at');
      if (error) throw error;
      return (data || []) as unknown as ChecklistItem[];
    },
    enabled: !!dealId,
  });
}

export function useCreateDealChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, dealType, companyId, createdBy, isRu }: {
      dealId: string;
      dealType: string;
      companyId: string;
      createdBy: string;
      isRu?: boolean;
    }) => {
      const template = CHECKLIST_TEMPLATES[dealType] || CHECKLIST_TEMPLATES.sale;
      const items = template.map((item, idx) => ({
        deal_id: dealId,
        company_id: companyId,
        title: isRu ? item.title_ru : item.title_en,
        task_type: 'checklist',
        priority: item.priority,
        status: 'pending',
        created_by: createdBy,
      }));

      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(items as any[])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['deal-checklist', vars.dealId] });
      toast.success('Checklist created');
    },
    onError: (err: Error) => { toast.error(err.message || 'Failed to create checklist'); },
  });
}

export function useToggleChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase
        .from('crm_tasks')
        .update({
          status: done ? 'done' : 'pending',
          completed_at: done ? new Date().toISOString() : null,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-checklist'] });
    },
    onError: (err: Error) => { toast.error(err.message || 'Failed to update checklist'); },
  });
}

export { CHECKLIST_TEMPLATES };
