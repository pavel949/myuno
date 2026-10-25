import { useRef, useState } from 'react';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { AdminOperationalAlerts } from '@/components/admin/dashboard/AdminOperationalAlerts';
import { AdminRevenueBlock } from '@/components/admin/dashboard/AdminRevenueBlock';
import { AdminQuickActionsGrid } from '@/components/admin/dashboard/AdminQuickActionsGrid';
import { AdminWorkQueues } from '@/components/admin/dashboard/AdminWorkQueues';
import { useDashboardClock } from '@/components/admin/dashboard/DashboardCount';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { useUserRoles } from '@/hooks/useUserRoles';
import { AdminStaffOverview } from '@/components/admin/AdminStaffOverview';
import { GoLiveChecklist } from '@/components/admin/GoLiveChecklist';
import { PageShell } from '@/components/page';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search } from 'lucide-react';

function AdminToday() {
  const { language } = useLanguage();
  const l = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const stats = useAdminDashboardStats();
  const client = useQueryClient();
  const otherReads = useIsFetching({ queryKey: ['admin-dashboard'] });
  const [search, setSearch] = useState('');
  const [refreshError, setRefreshError] = useState(false);
  const refreshFlight = useRef<Promise<unknown> | null>(null);
  const now = useDashboardClock();
  const data = stats.isError ? undefined : stats.data;
  const updated = Object.values(data?.sourceUpdatedAt ?? {});
  const oldest = updated.length ? Math.min(...updated) : null;
  const hasUnavailable = !data || Object.keys(data.sourceErrors ?? {}).length > 0;
  const stale = oldest !== null && now - oldest > 60000;
  const refresh = () => {
    if (refreshFlight.current) return;
    setRefreshError(false);
    refreshFlight.current = Promise.all([
      client.invalidateQueries({ queryKey: ['admin-dashboard-stats'] }),
      client.invalidateQueries({ queryKey: ['admin-dashboard'] }),
    ]).catch(() => setRefreshError(true)).finally(() => { refreshFlight.current = null; });
  };
  return <PageShell width="full" className="space-y-6" >
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{l('Today', 'Сегодня', 'วันนี้')}</h1>
        <p className="mt-1 text-muted-foreground">{l('Platform overview · Phuket time', 'Вся платформа · Время Пхукета', 'ภาพรวมแพลตฟอร์ม · เวลาภูเก็ต')}</p>
      </div>
      <div className="min-w-0 text-sm sm:text-right">
        <Button variant="outline" onClick={refresh} disabled={stats.isFetching || otherReads > 0} className="min-h-11 gap-2"><RefreshCw className="size-4" />{l('Refresh', 'Обновить', 'รีเฟรช')}</Button>
        <p className="mt-2 text-xs text-muted-foreground" role="status" data-testid="dashboard-freshness">
          {stats.isLoading ? l('Loading sources…', 'Загрузка источников…', 'กำลังโหลดแหล่งข้อมูล…') : !oldest ? l('No successful source read yet', 'Пока нет успешного чтения источников', 'ยังอ่านข้อมูลจากแหล่งข้อมูลไม่สำเร็จ') : `${stale ? l('Stale · last successful reads', 'Устарело · последние успешные чтения', 'ข้อมูลเก่า · อ่านสำเร็จล่าสุด') : l('Sources read', 'Источники прочитаны', 'อ่านแหล่งข้อมูลแล้ว')}: ${new Intl.DateTimeFormat(language, { timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'short' }).format(oldest)}`}
        </p>
      </div>
    </header>
    <div className="relative max-w-2xl">
      <Search className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" />
      <Input aria-label={l('Find a work queue', 'Найти рабочую очередь', 'ค้นหาคิวงาน')} placeholder={l('Find a work queue…', 'Найти рабочую очередь…', 'ค้นหาคิวงาน…')} value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Escape') setSearch(''); }} className="min-h-11 pl-10" />
    </div>
    {(hasUnavailable || refreshError) && !stats.isLoading && <p role="alert" className="border-l-2 border-warning bg-warning/5 p-3 text-sm">{l('Some sources are unavailable. Their counts are not shown as zero. Open the queue or refresh to check again.', 'Часть источников недоступна. Их счётчики не показаны нулём. Откройте очередь или обновите данные.', 'บางแหล่งข้อมูลไม่พร้อมใช้งาน จำนวนจะไม่แสดงเป็นศูนย์ เปิดคิวหรือรีเฟรชเพื่อตรวจสอบอีกครั้ง')}</p>}
    <div className="grid min-w-0 gap-4 [grid-template-areas:'decisions'_'queues'_'status'] xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:[grid-template-areas:'decisions_status'_'queues_queues']">
      <div className="min-w-0 [grid-area:decisions]"><AdminOperationalAlerts search={search} /></div>
      <div className="min-w-0 [grid-area:queues]"><AdminWorkQueues data={data} loading={stats.isLoading} search={search} /></div>
      <aside className="min-w-0 space-y-4 [grid-area:status]" aria-label={l('Platform status and quick actions', 'Состояние платформы и быстрые действия', 'สถานะแพลตฟอร์มและการดำเนินการด่วน')}>
        <GoLiveChecklist />
        <AdminQuickActionsGrid />
      </aside>
    </div>
    <AdminRevenueBlock />
  </PageShell>;
}

export default function AdminDashboard() {
  const { language } = useLanguage();
  const { roles, isLoading, isFetching, error, refetch } = useUserRoles();
  const safeRoles = roles || [];
  if (isLoading) return <PageShell width="full"><p role="status">{pickLang(language, { en: 'Checking access…', ru: 'Проверка доступа…', th: 'กำลังตรวจสอบสิทธิ์…' })}</p></PageShell>;
  if (error) return <PageShell><div role="alert">
    <p>{pickLang(language, { en: 'Access could not be verified. Please retry the check.', ru: 'Не удалось проверить доступ. Повторите проверку.', th: 'ตรวจสอบสิทธิ์ไม่สำเร็จ โปรดลองอีกครั้ง' })}</p>
    <Button variant="outline" className="mt-3" disabled={isFetching} onClick={() => { void refetch(); }}>{pickLang(language, { en: 'Retry access check', ru: 'Повторить проверку доступа', th: 'ตรวจสอบสิทธิ์อีกครั้ง' })}</Button>
  </div></PageShell>;
  if (safeRoles.some(role => role.role === 'admin')) return <AdminToday />;
  if (safeRoles.some(role => role.role === 'staff' || role.role === 'uno_team')) return <AdminStaffOverview />;
  return <PageShell><p role="alert">{pickLang(language, { en: 'Platform administrator access is required.', ru: 'Требуется доступ администратора платформы.', th: 'ต้องมีสิทธิ์ผู้ดูแลแพลตฟอร์ม' })}</p></PageShell>;
}
