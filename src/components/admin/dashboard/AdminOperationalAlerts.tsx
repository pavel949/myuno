import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useAdminDashboardStats, type DashboardCountKey } from '@/hooks/useAdminDashboardStats';
import { Surface } from '@/components/ui/surface';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, Clock, MessageSquare, CreditCard, ArrowRight } from 'lucide-react';
import { DashboardCount } from './DashboardCount';

/** Ordered by work type and age, never by arbitrary count-to-red thresholds. */
export function AdminOperationalAlerts({ search = '' }: { search?: string }) {
  const { language } = useLanguage();
  const { data: cachedData, isLoading, isError } = useAdminDashboardStats();
  const data = isError ? undefined : cachedData;
  const label = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const cutoff = data?.ordersCreatedBefore;
  const pendingHref = '/admin/operations?tab=bookings&status=pending';
  const decisions = [
    { key: 'openDisputes', icon: Scale, label: label('Open disputes', 'Открытые споры', 'ข้อพิพาทที่เปิดอยู่'), hint: label('Review the dispute and its evidence', 'Проверьте спор и его материалы', 'ตรวจสอบข้อพิพาทและหลักฐาน'), href: '/admin/disputes' },
    { key: 'pendingOrders24h', icon: Clock, label: label('Pending orders older than 24 hours', 'Заказы в ожидании больше 24 часов', 'คำสั่งซื้อรอดำเนินการเกิน 24 ชั่วโมง'), hint: label('Pending status; payment state is not inferred', 'Статус «ожидает»; состояние оплаты проверяется отдельно', 'สถานะรอดำเนินการ ไม่ได้ยืนยันสถานะการชำระเงิน'), href: cutoff ? `${pendingHref}&created_before=${encodeURIComponent(cutoff)}` : pendingHref },
    { key: 'pendingManualPayments', icon: CreditCard, label: label('Manual payment review', 'Проверка ручной оплаты', 'ตรวจสอบการชำระเงินด้วยตนเอง'), hint: label('Awaiting administrator or contacted', 'Ожидают администратора или уже связались', 'รอผู้ดูแลหรือติดต่อแล้ว'), href: '/admin/operations?tab=manual-payments&manual_status=review' },
    { key: 'pendingOrders', icon: Clock, label: label('Pending orders', 'Ожидающие заказы', 'คำสั่งซื้อที่รอดำเนินการ'), hint: label('Commercial orders awaiting action', 'Коммерческие заказы в ожидании', 'คำสั่งซื้อที่รอดำเนินการ'), href: pendingHref },
    { key: 'openTickets', icon: MessageSquare, label: label('Support requests', 'Обращения в поддержку', 'คำขอความช่วยเหลือ'), hint: label('Open and in progress', 'Открыты и в работе', 'เปิดอยู่และกำลังดำเนินการ'), href: '/admin/tickets?status=active' },
  ] as const;
  const matching = decisions.filter(item => `${item.label} ${item.hint}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const active = matching.filter(item => data?.[item.key] == null || data[item.key] !== 0);
  const shown = active.slice(0, 3);
  return <Surface variant="card" padding="md" className="h-full min-w-0">
    <h2 className="text-xl font-semibold">{label('Needs a decision', 'Требует решения', 'รายการที่ต้องตัดสินใจ')}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{label('Review exceptions, then continue with the work queues.', 'Сначала исключения, затем текущая работа.', 'ตรวจสอบข้อยกเว้น แล้วดำเนินงานในคิวต่อ')}</p>
    <div className="mt-4 divide-y border-y" aria-busy={isLoading}>
      {shown.map(item => <div key={item.key} className="flex min-w-0 flex-wrap items-center gap-3 py-4" data-decision={item.key}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted"><item.icon className="size-5" /></span>
        <div className="min-w-0 flex-1 basis-44">
          <h3 className="font-medium [overflow-wrap:anywhere]">{item.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-3">
          <Badge variant="secondary" className="max-w-full whitespace-normal py-2 text-sm"><span className="mr-2 font-normal">{label('In queue', 'В очереди', 'ในคิว')}:</span><DashboardCount data={data} countKey={item.key as DashboardCountKey} loading={isLoading} /></Badge>
          <Button variant="outline" asChild className="min-h-11 max-w-full whitespace-normal"><Link to={item.href}>{label('Review', 'Проверить', 'ตรวจสอบ')}</Link></Button>
        </div>
      </div>)}
      {shown.length === 0 && <p className="py-8 text-sm text-muted-foreground" role="status">{search ? label('No matching decision queues', 'Подходящих очередей решений нет', 'ไม่พบคิวที่ต้องตัดสินใจที่ตรงกัน') : label('No items in these decision queues.', 'В этих очередях нет задач для решения.', 'ไม่มีรายการในคิวที่ต้องตัดสินใจเหล่านี้')}</p>}
    </div>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      <Link className="inline-flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline" to="/admin/operations">{label('Open operations', 'Открыть операции', 'เปิดงานดำเนินการ')}<ArrowRight className="size-4" /></Link>
      {active.length > 3 && <span className="self-center text-muted-foreground">{label('More queues below', 'Остальные очереди ниже', 'คิวเพิ่มเติมด้านล่าง')}</span>}
    </div>
  </Surface>;
}
