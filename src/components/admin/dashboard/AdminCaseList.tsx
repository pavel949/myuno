import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useAdminDashboardCases, type AdminCaseSource, type AdminCaseView } from '@/hooks/useAdminDashboardCases';
import { Button } from '@/components/ui/button';
import { useDashboardClock } from './DashboardCount';

const SOURCES: Record<AdminCaseSource, LangValues> = {
  support: { en: 'Support', ru: 'Поддержка', th: 'ความช่วยเหลือ' },
  payments: { en: 'Payment review', ru: 'Проверка оплаты', th: 'ตรวจสอบการชำระเงิน' },
  disputes: { en: 'Dispute', ru: 'Спор', th: 'ข้อพิพาท' },
};
const VIEWS: { value: AdminCaseView; label: LangValues }[] = [
  { value: 'all', label: { en: 'All queues', ru: 'Все очереди', th: 'ทุกคิว' } },
  { value: 'mine', label: { en: 'My support cases', ru: 'Мои обращения поддержки', th: 'เคสช่วยเหลือของฉัน' } },
  { value: 'unassigned', label: { en: 'Unassigned support', ru: 'Поддержка без ответственного', th: 'เคสช่วยเหลือที่ยังไม่มอบหมาย' } },
];

export function AdminCaseList() {
  const { language } = useLanguage();
  const [view, setView] = useState<AdminCaseView>('all');
  const [expanded, setExpanded] = useState(false);
  const query = useAdminDashboardCases(view);
  const now = useDashboardClock();
  const l = (values: LangValues) => pickLang(language, values);
  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : new Intl.DateTimeFormat(language, {
      timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    }).format(parsed);
  };
  return <section aria-labelledby="admin-case-list" className="min-w-0 space-y-3 border border-border bg-card p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id="admin-case-list" className="text-xl font-semibold">{l({ en: 'Needs attention', ru: 'Требуют внимания', th: 'รายการที่ต้องตรวจสอบ' })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{l({ en: 'Up to five cases per queue. Deadlines first, then oldest cases. Times are in Phuket.', ru: 'До пяти записей из каждой очереди: сначала сроки, затем самые старые. Время Пхукета.', th: 'แสดงสูงสุดห้ารายการต่อคิว เรียงตามกำหนดเวลาแล้วตามอายุรายการ เวลาในภูเก็ต' })}</p>
      </div>
      <Button variant="outline" className="min-h-11" disabled={!query.admitted || query.isFetching} onClick={() => void query.refetch()}>{l({ en: 'Refresh cases', ru: 'Обновить список', th: 'รีเฟรชรายการ' })}</Button>
    </div>
    <div role="group" aria-label={l({ en: 'Case views', ru: 'Выбор очереди', th: 'เลือกมุมมองรายการ' })} className="flex flex-wrap gap-2">
      {VIEWS.map(item => <Button key={item.value} variant={view === item.value ? 'default' : 'outline'} aria-pressed={view === item.value} className="min-h-11 max-w-full whitespace-normal text-left" onClick={() => { setView(item.value); setExpanded(false); }}>{l(item.label)}</Button>)}
    </div>
    {query.isLoading && <p role="status">{l({ en: 'Loading cases…', ru: 'Загрузка записей…', th: 'กำลังโหลดรายการ…' })}</p>}
    {query.isError && <p role="alert">{l({ en: 'Cases could not be loaded. Retry or open the work queues below.', ru: 'Не удалось загрузить записи. Повторите запрос или откройте рабочие очереди ниже.', th: 'โหลดรายการไม่สำเร็จ ลองอีกครั้งหรือเปิดคิวงานด้านล่าง' })}</p>}
    {!!query.data?.unavailable.length && <p role="alert" className="border-l-2 border-warning p-3 text-sm">{l({ en: 'Unavailable queues', ru: 'Недоступные очереди', th: 'คิวที่ไม่พร้อมใช้งาน' })}: {query.data.unavailable.map(source => l(SOURCES[source])).join(', ')}. {l({ en: 'Other results may be incomplete.', ru: 'Список может быть неполным.', th: 'รายการอาจไม่ครบถ้วน' })}</p>}
    {query.data?.items.length === 0 && query.data.unavailable.length === 0 && <p role="status" className="py-4 text-muted-foreground">{l({ en: 'No cases match this view.', ru: 'В этом представлении записей нет.', th: 'ไม่พบรายการในมุมมองนี้' })}</p>}
    <ul className="divide-y divide-border">
      {query.data?.items.slice(0, expanded ? undefined : 5).map(item => {
        const overdue = !!item.deadline && Date.parse(item.deadline) < now;
        return <li key={`${item.source}:${item.id}`} className="flex min-w-0 flex-wrap items-center gap-3 py-3">
          <div className="min-w-0 flex-1 basis-56">
            <p className="text-xs text-muted-foreground">{l(SOURCES[item.source])} · <span className="font-mono">#{item.reference}</span></p>
            <p className="break-words font-medium">{item.subject || l(SOURCES[item.source])}</p>
            <p className="text-sm text-muted-foreground">{l({ en: 'Created', ru: 'Создано', th: 'สร้างเมื่อ' })}: {date(item.createdAt)}</p>
          </div>
          <div className="min-w-0 basis-56 text-sm">
            {item.source === 'support' && <p>{!item.assignedTo ? l({ en: 'Unassigned', ru: 'Без ответственного', th: 'ยังไม่มอบหมาย' }) : item.assignedTo === query.actorId ? l({ en: 'Assigned to me', ru: 'Назначено мне', th: 'มอบหมายให้ฉัน' }) : item.assignedName || l({ en: 'Assigned · name unavailable', ru: 'Назначено · имя недоступно', th: 'มอบหมายแล้ว · ไม่มีข้อมูลชื่อ' })}</p>}
            {item.deadline && <p className={overdue ? 'text-destructive' : 'text-muted-foreground'}>{item.source === 'payments' ? l({ en: 'Payment request deadline', ru: 'Срок платёжной заявки', th: 'กำหนดเวลาคำขอชำระเงิน' }) : l({ en: 'SLA deadline', ru: 'Срок ответа по SLA', th: 'กำหนดเวลา SLA' })}: {date(item.deadline)}</p>}
          </div>
          <Button asChild variant="outline" className="min-h-11"><Link to={item.href}>{l({ en: 'Open case', ru: 'Открыть', th: 'เปิดรายการ' })}</Link></Button>
        </li>;
      })}
    </ul>
    {(query.data?.items.length ?? 0) > 5 && <Button variant="outline" className="min-h-11" onClick={() => setExpanded(value => !value)}>{expanded ? l({ en: 'Show fewer', ru: 'Свернуть', th: 'แสดงน้อยลง' }) : l({ en: 'Show more', ru: 'Показать ещё', th: 'แสดงเพิ่มเติม' })}</Button>}
    {!!query.dataUpdatedAt && <p className="text-xs text-muted-foreground" role="status">{now - query.dataUpdatedAt > 60_000 ? l({ en: 'Stale results', ru: 'Данные устарели', th: 'ข้อมูลล้าสมัย' }) : l({ en: 'Last read', ru: 'Последняя загрузка', th: 'อ่านล่าสุด' })}: {date(new Date(query.dataUpdatedAt).toISOString())}</p>}
  </section>;
}
