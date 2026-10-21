/** A compact account reminder. Pending orders do not prove a payment is due. */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

export function PendingPaymentsChip() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { data: count, isLoading, isError, refetch } = useQuery({
    queryKey: ['home-pending-orders', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase.from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('customer_user_id', user!.id)
        .is('deleted_at', null)
        .in('status', ['pending', 'awaiting_client_payment', 'pending_deposit']);
      if (error) throw error;
      if (count === null) throw new Error('Order count unavailable');
      return count;
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
  if (!user) return null;
  if (isLoading) return <p role="status" className="px-4 pb-3 text-sm text-muted-foreground">{pickLang(language, { ru: 'Проверяем ожидающие заказы…', en: 'Checking pending orders…', th: 'กำลังตรวจสอบรายการที่รอดำเนินการ…' })}</p>;
  if (isError) return (
    <div role="status" className="mx-4 mb-3 border-l-2 border-border pl-3 text-sm">
      <p>{pickLang(language, { ru: 'Не удалось проверить ожидающие заказы.', en: 'Pending orders could not be checked.', th: 'ไม่สามารถตรวจสอบรายการที่รอดำเนินการได้' })}</p>
      <button type="button" onClick={() => { void refetch(); }} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{pickLang(language, { ru: 'Повторить проверку', en: 'Retry order check', th: 'ตรวจสอบอีกครั้ง' })}</button>
    </div>
  );
  if (!count) return null;
  return (
    <Link to={APP_ROUTES.ME} className="mx-4 mb-4 flex min-h-11 items-center justify-between gap-3 border-l-2 border-primary bg-muted/40 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span>{pickLang(language, { ru: `Проверить ожидающие заказы: ${count}`, en: `Review pending orders: ${count}`, th: `ตรวจสอบรายการที่รอดำเนินการ: ${count}` })}</span>
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </Link>
  );
}
