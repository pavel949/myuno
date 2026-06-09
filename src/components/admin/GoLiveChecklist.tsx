import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Rocket, Loader2 } from 'lucide-react';

interface CheckItem {
  key: string;
  labelRu: string;
  labelEn: string;
  check: () => Promise<boolean>;
}

const checks: CheckItem[] = [
  {
    key: 'stripe_live',
    labelRu: 'Stripe в live-режиме',
    labelEn: 'Stripe in live mode',
    check: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'stripe_mode')
        .maybeSingle();
      return data?.value === 'live';
    },
  },
  {
    key: 'admin_emails',
    labelRu: 'Email администраторов настроены',
    labelEn: 'Admin emails configured',
    check: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_emails')
        .maybeSingle();
      if (!data?.value) return false;
      try {
        const emails = JSON.parse(data.value as string);
        return Array.isArray(emails) && emails.length > 0;
      } catch {
        return false;
      }
    },
  },
  {
    key: 'admin_whatsapp',
    labelRu: 'WhatsApp администратора настроен',
    labelEn: 'Admin WhatsApp configured',
    check: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'admin_whatsapp')
        .maybeSingle();
      return !!data?.value && (data.value as string).length > 5;
    },
  },
  {
    key: 'reconciliation_clean',
    labelRu: 'Сверка без ошибок (30 дней)',
    labelEn: 'Reconciliation clean (30 days)',
    check: async () => {
      const { count } = await (supabase as any)
        .from('reconciliation_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false);
      return (count ?? 0) === 0;
    },
  },
  {
    key: 'has_orders',
    labelRu: 'Есть подтверждённые заказы',
    labelEn: 'Has confirmed orders',
    check: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['confirmed', 'completed']);
      return (count ?? 0) > 0;
    },
  },
  {
    key: 'has_published_properties',
    labelRu: 'Опубликованы объекты (≥5)',
    labelEn: 'Published properties (≥5)',
    check: async () => {
      const { count } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('approval_status', 'approved')
        .eq('is_active', true);
      return (count ?? 0) >= 5;
    },
  },
  {
    key: 'feature_flags_active',
    labelRu: 'Вертикали включены',
    labelEn: 'Verticals enabled',
    check: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('key, value')
        .like('key', 'feature_flag:vertical_%');
      if (!data || data.length === 0) return true; // defaults are enabled
      return data.some((f) => {
        try {
          const val = JSON.parse(f.value as string);
          return val?.enabled === true;
        } catch {
          return f.value === 'true';
        }
      });
    },
  },
];

export function GoLiveChecklist() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: results, isLoading } = useQuery({
    queryKey: ['go-live-checklist'],
    queryFn: async () => {
      const results: Record<string, boolean> = {};
      for (const item of checks) {
        try {
          results[item.key] = await item.check();
        } catch {
          results[item.key] = false;
        }
      }
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-3 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {isRu ? 'Проверка готовности...' : 'Checking readiness...'}
        </CardContent>
      </Card>
    );
  }

  if (!results) return null;

  const passed = Object.values(results).filter(Boolean).length;
  const total = checks.length;
  const allGreen = passed === total;

  if (allGreen) return null; // Hide when everything is ready

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="py-4">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-5 w-5 text-warning" />
          <span className="font-semibold">
            {isRu ? 'Go-Live Чеклист' : 'Go-Live Checklist'}
          </span>
          <Badge variant="outline" className="ml-auto">
            {passed}/{total}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {checks.map((item) => {
            const ok = results[item.key];
            return (
              <div key={item.key} className="flex items-center gap-2 text-sm">
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className={ok ? 'text-muted-foreground' : ''}>
                  {isRu ? item.labelRu : item.labelEn}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
