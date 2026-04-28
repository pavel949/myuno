/**
 * PendingPaymentsChip — компактный inline-alert.
 *
 * Заменяет полноразмерные «Pending payment» feed-карточки на одну строку:
 *  «🔔 2 платежа ожидают · ฿28 300   Оплатить →»
 *
 * Если pending=0 — компонент возвращает null (тихая главная).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface PendingRow {
  total_amount: number | null;
}

function pluralRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'платёж ожидает';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'платежа ожидают';
  return 'платежей ожидают';
}

export function PendingPaymentsChip() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data } = useQuery({
    queryKey: ['home-pending-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0, total: 0 };
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('customer_user_id', user.id)
        .in('status', ['pending', 'awaiting_client_payment', 'pending_deposit']);
      if (error) return { count: 0, total: 0 };
      const rows = (data ?? []) as PendingRow[];
      const total = rows.reduce((sum, r) => sum + Number(r.total_amount ?? 0), 0);
      return { count: rows.length, total };
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  if (!data || data.count === 0) return null;

  const formatted = new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(data.total);

  return (
    <div className="px-4 mt-4">
      <Link
        to="/me/payments"
        className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors active:scale-[0.99]"
        style={{
          backgroundColor: 'hsl(var(--warning-bg))',
          borderColor: 'hsl(var(--warning) / 0.25)',
        }}
      >
        <span
          className="grid w-9 h-9 place-items-center rounded-xl flex-shrink-0"
          style={{
            backgroundColor: 'hsl(var(--warning) / 0.12)',
            color: 'hsl(var(--warning))',
          }}
        >
          <CreditCard className="w-[18px] h-[18px]" strokeWidth={2} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold leading-tight" style={{ color: 'hsl(var(--warning))' }}>
            {isRu
              ? `${data.count} ${pluralRu(data.count)}`
              : `${data.count} payment${data.count === 1 ? '' : 's'} pending`}
          </span>
          <span className="block text-[12px] mt-0.5 text-foreground/70">
            ฿{formatted}
          </span>
        </span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--warning))' }} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
