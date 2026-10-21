import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import type { DashboardCountKey, DashboardStats } from '@/hooks/useAdminDashboardStats';

export function dashboardCountState(data: DashboardStats | undefined, key: DashboardCountKey, loading: boolean, now: number) {
  if (loading && !data) return 'loading';
  if (data?.[key] == null || data.sourceErrors?.[key]) return 'unavailable';
  const updated = data.sourceUpdatedAt?.[key];
  return !updated || now - updated > 60000 ? 'stale' : data[key] === 0 ? 'empty' : 'ready';
}

export function useDashboardClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 10000); return () => clearInterval(timer); }, []);
  return now;
}

export function DashboardCount({ data, countKey, loading = false }: { data?: DashboardStats; countKey: DashboardCountKey; loading?: boolean }) {
  const { language } = useLanguage();
  const now = useDashboardClock();
  const state = dashboardCountState(data, countKey, loading, now);
  return <span data-count-key={countKey} data-count-state={state} className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
    <span>{state === 'loading' ? '…' : state === 'unavailable' ? pickLang(language, { en: 'Unavailable', ru: 'Недоступно', th: 'ไม่พร้อมใช้งาน' }) : data?.[countKey]}</span>
    {state === 'stale' && <span className="text-xs font-normal text-muted-foreground">{pickLang(language, { en: 'Stale', ru: 'Устарело', th: 'ข้อมูลเก่า' })}</span>}
  </span>;
}
