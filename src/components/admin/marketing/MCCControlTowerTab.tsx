import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePulseKPIs } from '@/hooks/useMCCControlTower';
import { useLandingRegistry } from '@/hooks/useLandingRegistry';
import { useMCCNavigation } from '@/pages/admin/marketing/MarketingDashboard';

type Period = 'today' | '7d' | 'mtd';

/** Recorded-event overview. Commercial and accounting evidence stays in Finance. */
export function MCCControlTowerTab() {
  const { language } = useLanguage();
  const l = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const { navigateTo } = useMCCNavigation();
  const [period, setPeriod] = useState<Period>('7d');
  const pulse = usePulseKPIs(period);
  const registry = useLandingRegistry();
  const landings = registry.isError ? undefined : registry.data;
  const metrics = [
    { key: 'traffic', label: l('View events', 'События просмотра', 'เหตุการณ์เข้าชม') },
    { key: 'ctaClicks', label: l('CTA click events', 'Клики по основному действию', 'เหตุการณ์คลิก CTA') },
    { key: 'intents', label: l('Intent events', 'События начала обращения', 'เหตุการณ์เริ่มคำขอ') },
    { key: 'completed', label: l('Completion events', 'События завершения', 'เหตุการณ์เสร็จสิ้น') },
    { key: 'secondAction', label: l('Repeat action events', 'Повторные действия', 'เหตุการณ์ทำรายการซ้ำ') },
  ] as const;
  const stamp = (value: string) => new Intl.DateTimeFormat(language, { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  return <section className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-h3">{l('Marketing events', 'Маркетинговые события', 'เหตุการณ์การตลาด')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{l('Exact counts of recorded events. Events do not establish unique users, payments or revenue.', 'Точные счётчики зарегистрированных событий. События не подтверждают уникальных пользователей, оплаты или выручку.', 'จำนวนเหตุการณ์ที่บันทึกไว้ ไม่ใช่หลักฐานของผู้ใช้ที่ไม่ซ้ำ การชำระเงิน หรือรายได้')}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={period} onValueChange={value => setPeriod(value as Period)}>
          <SelectTrigger className="min-h-11 w-40" aria-label={l('Event period', 'Период событий', 'ช่วงเวลาเหตุการณ์')}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{l('Today', 'Сегодня', 'วันนี้')}</SelectItem>
            <SelectItem value="7d">{l('Last 7 days', 'Последние 7 дней', '7 วันที่ผ่านมา')}</SelectItem>
            <SelectItem value="mtd">{l('This month', 'Текущий месяц', 'เดือนนี้')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="min-h-11" disabled={pulse.isFetching || registry.isFetching} onClick={() => { void pulse.refetch(); void registry.refetch(); }}>{l('Refresh', 'Обновить', 'รีเฟรช')}</Button>
      </div>
    </div>
    {pulse.isLoading && <p role="status">{l('Loading event counts…', 'Загрузка счётчиков событий…', 'กำลังโหลดจำนวนเหตุการณ์…')}</p>}
    {pulse.isError && <div role="alert" className="border border-warning p-3">{l('Event counts are unavailable. Retry the read.', 'Счётчики событий недоступны. Повторите загрузку.', 'จำนวนเหตุการณ์ไม่พร้อมใช้งาน โปรดลองอีกครั้ง')}</div>}
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(metric => <Card key={metric.key}><CardContent className="min-w-0 p-4">
        <p className="text-sm text-muted-foreground">{metric.label}</p>
        <p className="mt-2 break-words font-mono text-2xl">{typeof pulse.data?.[metric.key] === 'number' ? pulse.data[metric.key].toLocaleString(language) : '—'}</p>
      </CardContent></Card>)}
    </div>
    {pulse.data?.from && <p className="text-xs text-muted-foreground">{stamp(pulse.data.from)} – {stamp(pulse.data.through)} · {l('Phuket time', 'Время Пхукета', 'เวลาภูเก็ต')}</p>}
    <Card>
      <CardHeader><CardTitle className="text-lg">{l('Landing registry', 'Реестр лендингов', 'ทะเบียนหน้าแลนดิ้ง')}</CardTitle></CardHeader>
      <CardContent>
        {registry.isLoading && <p role="status">{l('Loading landings…', 'Загрузка лендингов…', 'กำลังโหลดหน้าแลนดิ้ง…')}</p>}
        {registry.isError && <p role="alert">{l('Landing registry could not be loaded.', 'Не удалось загрузить реестр лендингов.', 'โหลดทะเบียนหน้าแลนดิ้งไม่สำเร็จ')}</p>}
        {!registry.isLoading && !registry.isError && landings?.length === 0 && <p role="status">{l('No registered landings.', 'В реестре нет лендингов.', 'ยังไม่มีหน้าแลนดิ้งในทะเบียน')}</p>}
        <ul className="divide-y divide-border">{landings?.map(landing => <li key={landing.landing_id} className="flex min-w-0 flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1 basis-40"><p className="break-words font-medium">{language === 'ru' ? landing.name_ru || landing.name_en || landing.landing_id : landing.name_en || landing.landing_id}</p><p className="break-words font-mono text-xs text-muted-foreground">{landing.landing_id}</p></div>
          <Button variant="outline" className="min-h-11" onClick={() => navigateTo('funnel-diag', { landingId: landing.landing_id })}>{l('View events', 'Посмотреть события', 'ดูเหตุการณ์')}</Button>
        </li>)}</ul>
      </CardContent>
    </Card>
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="outline" className="min-h-11"><Link to="/admin/analytics?tab=acquisition">{l('Recorded channel metrics', 'Показатели каналов привлечения', 'ตัวชี้วัดช่องทางที่บันทึกไว้')}</Link></Button>
      <Button asChild variant="outline" className="min-h-11"><Link to="/admin/finance">{l('Payments and payouts', 'Платежи и выплаты', 'การชำระเงินและการจ่ายเงิน')}</Link></Button>
    </div>
  </section>;
}
