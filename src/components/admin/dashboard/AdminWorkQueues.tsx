import { Link } from 'react-router-dom';
import { Package, Users, Calendar, MessageSquare, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import type { DashboardStats } from '@/hooks/useAdminDashboardStats';
import { Surface } from '@/components/ui/surface';
import { DashboardCount } from './DashboardCount';

export function AdminWorkQueues({ data, loading, search = '' }: { data?: DashboardStats; loading: boolean; search?: string }) {
  const { language } = useLanguage();
  const l = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const moderationHref = '/admin/operations?tab=moderation';
  const cards = [
    { key: 'pendingContent', title: l('Listings & properties', 'Объявления и объекты', 'ประกาศและที่พัก'), hint: l('Pending approval', 'Ожидают одобрения', 'รออนุมัติ'), icon: Package, href: moderationHref },
    { key: 'pendingProviders', title: l('Providers', 'Провайдеры', 'ผู้ให้บริการ'), hint: l('Not verified', 'Не проверены', 'ยังไม่ผ่านการตรวจสอบ'), icon: Users, href: '/admin/providers?filter=unverified' },
    { key: 'pendingOrders', title: l('Orders', 'Заказы', 'คำสั่งซื้อ'), hint: l('Pending commercial orders', 'Коммерческие заказы в ожидании', 'คำสั่งซื้อที่รอดำเนินการ'), icon: Calendar, href: '/admin/operations?tab=bookings&status=pending' },
    { key: 'openTickets', title: l('Support', 'Поддержка', 'ความช่วยเหลือ'), hint: l('Open and in progress', 'Открыты и в работе', 'เปิดอยู่และกำลังดำเนินการ'), icon: MessageSquare, href: '/admin/tickets?status=active' },
  ] as const;
  const matching = cards.filter(card => `${card.title} ${card.hint}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const extra = [
    { key: 'pendingPartnerApplications', title: l('Partner applications', 'Заявки партнёров', 'ใบสมัครพันธมิตร'), href: '/admin/partner-applications?status=pending' },
    { key: 'pendingManualPayments', title: l('Manual payment review', 'Проверка ручных оплат', 'ตรวจสอบการชำระเงินด้วยตนเอง'), href: '/admin/operations?tab=manual-payments&manual_status=review' },
    { key: 'openDisputes', title: l('Open disputes', 'Открытые споры', 'ข้อพิพาทที่เปิดอยู่'), href: '/admin/disputes' },
  ] as const;
  const extraMatching = extra.filter(item => item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <section aria-labelledby="admin-work-queues" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <h2 id="admin-work-queues" className="text-xl font-semibold">{l('Work queues', 'Рабочие очереди', 'คิวงาน')}</h2>
      <p className="text-sm text-muted-foreground">{l('Queues overlap and are not summed as unique tasks.', 'Очереди пересекаются и не суммируются как уникальные задачи.', 'คิวอาจมีรายการซ้ำกัน จึงไม่นำมารวมเป็นงานที่ไม่ซ้ำ')}</p>
    </div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {matching.map(card => <Surface key={card.key} variant="card" padding="md" className="flex min-w-0 flex-col" data-queue={card.key}>
        <div className="flex min-w-0 items-start gap-3"><card.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" /><h3 className="min-w-0 font-medium">{card.title}</h3></div>
        <div className="mt-4 text-2xl font-semibold [overflow-wrap:anywhere]"><DashboardCount data={data} countKey={card.key} loading={loading} /></div>
        <p className="mt-1 text-sm text-muted-foreground">{card.hint}</p>
        {card.key === 'pendingContent' && <div className="mt-3 space-y-1 text-sm" aria-label={l('Review sources', 'Источники проверки', 'แหล่งรายการตรวจสอบ')}>
          <Link className="block min-h-8 text-primary underline-offset-4 hover:underline" to={`${moderationHref}&type=listing`}>{l('Listings', 'Объявления', 'ประกาศ')}: <DashboardCount data={data} countKey="pendingListings" loading={loading} /></Link>
          <Link className="block min-h-8 text-primary underline-offset-4 hover:underline" to={`${moderationHref}&type=property`}>{l('Properties', 'Объекты', 'ที่พัก')}: <DashboardCount data={data} countKey="pendingProperties" loading={loading} /></Link>
        </div>}
        <Link to={card.href} className="mt-auto inline-flex min-h-11 items-center gap-2 pt-3 text-sm text-primary underline-offset-4 hover:underline">{l('Open queue', 'Открыть очередь', 'เปิดคิว')}<ArrowRight className="size-4" /></Link>
      </Surface>)}
    </div>
    {matching.length === 0 && extraMatching.length === 0 && <p role="status" className="text-sm text-muted-foreground">{l('No matching work queues', 'Подходящих рабочих очередей нет', 'ไม่พบคิวงานที่ตรงกัน')}</p>}
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {extraMatching.map(item => <Link key={item.key} className="inline-flex min-h-11 items-center text-primary hover:underline" to={item.href}>{item.title}: <span className="ml-2"><DashboardCount data={data} countKey={item.key} loading={loading} /></span></Link>)}
    </div>
  </section>;
}
