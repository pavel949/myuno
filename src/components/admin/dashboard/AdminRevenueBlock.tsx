import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardSnapshots } from '@/hooks/useAdminDashboardEvidence';
import { pickLang } from '@/lib/i18n/pickLang';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardClock } from './DashboardCount';

export function AdminRevenueBlock() {
  const { language } = useLanguage();
  const [days, setDays] = useState(7);
  const periodId = useId();
  const { data, period, isLoading, isError, isFetching, dataUpdatedAt, refetch } = useAdminDashboardSnapshots(days);
  const unavailable = pickLang(language, { en: 'Unavailable', ru: 'Недоступно', th: 'ไม่มีข้อมูล' });
  const value = (amount: number | null | undefined, money = false) => amount == null || isError ? '—' : new Intl.NumberFormat(language, money ? { maximumFractionDigits: 2 } : {}).format(amount);
  const entries = [
    { label: pickLang(language, { en: 'Completed bookings · snapshot', ru: 'Завершённые брони · снимок', th: 'การจองเสร็จสิ้น · ภาพรวม' }), value: value(data?.completedBookings) },
    { label: pickLang(language, { en: 'GMV · snapshot estimate', ru: 'Оборот · оценка снимка', th: 'GMV · ค่าประมาณภาพรวม' }), value: value(data?.gmv, true) },
    { label: pickLang(language, { en: 'Platform revenue · snapshot estimate', ru: 'Доход платформы · оценка снимка', th: 'รายได้แพลตฟอร์ม · ค่าประมาณภาพรวม' }), value: value(data?.platformRevenue, true) },
  ];
  const now = useDashboardClock();
  const stale = !!dataUpdatedAt && now - dataUpdatedAt > 60_000;
  return <Card data-testid="dashboard-period-analytics">
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
      <CardTitle className="text-lg">{pickLang(language, { en: 'Metrics for the period', ru: 'Показатели за период', th: 'ตัวชี้วัดตามช่วงเวลา' })}</CardTitle>
      <label htmlFor={periodId} className="flex flex-wrap items-center gap-2 text-sm">
        <span>{pickLang(language, { en: 'Period', ru: 'Период', th: 'ช่วงเวลา' })}</span>
        <select id={periodId} className="min-h-11 max-w-full border border-input bg-background px-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring" value={days} onChange={event => setDays(Number(event.target.value))}>
          {[7, 30, 90].map(day => <option key={day} value={day}>{pickLang(language, { en: `Last ${day} complete days`, ru: `Последние ${day} полных дней`, th: `${day} วันที่ครบแล้วล่าสุด` })}</option>)}
        </select>
      </label>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-xs text-muted-foreground">{period.from} — {period.through} · {pickLang(language, { en: 'Phuket calendar', ru: 'календарь Пхукета', th: 'ปฏิทินภูเก็ต' })}</p>
      <div className="grid gap-4 sm:grid-cols-3" aria-busy={isLoading}>
        {entries.map(entry => <div key={entry.label} className="min-w-0 border border-border p-4">
          <p className="text-sm text-muted-foreground">{entry.label}</p>
          <p className="mt-2 break-words text-2xl font-semibold">{isLoading ? '…' : entry.value}</p>
        </div>)}
      </div>
      <p role={isError ? 'alert' : 'status'} className="text-sm text-muted-foreground">
        {isLoading ? pickLang(language, { en: 'Loading snapshots…', ru: 'Загружаем снимки…', th: 'กำลังโหลดภาพรวม…' }) : isError ? pickLang(language, { en: 'Snapshots could not be refreshed. Period totals are unavailable.', ru: 'Не удалось обновить снимки. Итоги периода недоступны.', th: 'อัปเดตภาพรวมไม่สำเร็จ ไม่มีผลรวมช่วงเวลา' }) : !data?.complete ? `${unavailable} · ${pickLang(language, { en: 'snapshot days', ru: 'дней со снимками', th: 'วันที่มีภาพรวม' })}: ${data?.coverage ?? 0}/${days}` : pickLang(language, { en: 'All days have snapshots.', ru: 'Снимки есть за каждый день.', th: 'มีภาพรวมครบทุกวัน' })}
      </p>
      <p role="note" className="text-xs text-muted-foreground">{pickLang(language, {
        en: 'Amounts are estimates. Currency is unavailable; missing days are not zero.',
        ru: 'Суммы приблизительные. Валюта не указана; пропуски не считаются нулём.',
        th: 'จำนวนเงินเป็นค่าประมาณ ไม่มีข้อมูลสกุลเงิน และวันที่ขาดไม่ถือเป็นศูนย์',
      })}</p>
      <details className="text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer py-1 text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">{pickLang(language, {
          en: 'How metrics are calculated',
          ru: 'Как считаются показатели',
          th: 'วิธีคำนวณตัวชี้วัด',
        })}</summary>
        <p className="mt-2 leading-relaxed">{pickLang(language, {
          en: 'Source: platform_metrics daily snapshots for the selected completed Phuket calendar days. GMV sums gmv; platform revenue sums platform_revenue; completed bookings sums completed_bookings. These are not ledger-confirmed amounts. Subscription snapshots are excluded to avoid treating recurring balances as daily revenue.',
          ru: 'Источник: ежедневные снимки platform_metrics за выбранные полные дни по календарю Пхукета. Оборот — сумма gmv; доход платформы — сумма platform_revenue; завершённые брони — сумма completed_bookings. Суммы не подтверждены по ledger. Снимки подписок исключены, чтобы не считать повторяющиеся остатки ежедневным доходом.',
          th: 'แหล่งข้อมูล: ภาพรวมรายวัน platform_metrics ตามวันภูเก็ตที่ครบแล้วในช่วงที่เลือก GMV รวม gmv รายได้แพลตฟอร์มรวม platform_revenue และการจองเสร็จสิ้นรวม completed_bookings จำนวนเงินยังไม่ยืนยันจาก ledger ไม่รวมภาพรวมค่าสมาชิกเพื่อไม่ให้ยอดคงเหลือซ้ำถูกนับเป็นรายได้รายวัน',
        })}</p>
      </details>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/admin/finance" className="text-sm text-primary underline-offset-4 hover:underline">{pickLang(language, { en: 'Open reports', ru: 'Перейти к отчётам', th: 'เปิดรายงาน' })} →</Link>
        <Button variant="ghost" size="sm" disabled={isFetching} onClick={() => void refetch()}>{pickLang(language, { en: 'Refresh metrics', ru: 'Обновить показатели', th: 'อัปเดตตัวชี้วัด' })}</Button>
      </div>
      {!!dataUpdatedAt && <p className="text-xs text-muted-foreground">{pickLang(language, stale ? { en: 'Stale snapshot read', ru: 'Снимки могли устареть', th: 'ภาพรวมอาจล้าสมัย' } : { en: 'Snapshots read', ru: 'Снимки прочитаны', th: 'อ่านภาพรวมแล้ว' })}: {new Intl.DateTimeFormat(language, { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(dataUpdatedAt)}</p>}
    </CardContent>
  </Card>;
}
