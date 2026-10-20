import { pickLang } from '@/lib/i18n/pickLang';
import { ManagedComplexReviewQueue } from '@/components/admin/operations/ManagedComplexReviewQueue';
import React, { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, AlertTriangle, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fetchModerationQueue, updateModerationItem, type ModerationItem, type ModerationType, MODERATION_PAGE_SIZE } from '@/lib/adminModeration';
import { moderationReviewDestination } from '@/lib/moderationReviewRoutes';

const typeLabels: Record<ModerationType, [string, string, string]> = {
  listing: ["Listing", "Листинг", "รายการ"], property: ["Property", "Недвижимость", "ที่พัก"],
  service: ["Service", "Услуга", "บริการ"], product: ["Product", "Товар", "สินค้า"],
};
const categoryLabels: Record<string, [string, string, string]> = {
  yacht: ["Yachts", "Яхты", "เรือยอชต์"], restaurant: ["Restaurants", "Рестораны", "ร้านอาหาร"], clinic: ["Clinics", "Клиники", "คลินิก"],
  vehicle: ["Vehicles", "Транспорт", "ยานพาหนะ"], experience: ["Experiences", "Экскурсии", "กิจกรรม"], education: ["Education", "Образование", "การศึกษา"],
  pet_service: ["Pet services", "Уход за питомцами", "บริการสัตว์เลี้ยง"], cleaning: ["Cleaning", "Уборка", "ทำความสะอาด"], babysitter: ["Babysitters", "Няни", "พี่เลี้ยงเด็ก"],
  villa: ["Villas", "Виллы", "วิลล่า"], condo: ["Condominiums", "Кондоминиумы", "คอนโดมิเนียม"], apartment: ["Apartments", "Апартаменты", "อพาร์ตเมนต์"],
};
const categoryOf = (item: ModerationItem) => item.vertical || item.category || '';

export function OperationsModerationTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const navigationType = useNavigationType();
  const pendingFilters = useRef(new URLSearchParams(params));
  const pendingFilterTargets = useRef<string[]>([]);
  useLayoutEffect(() => {
    const target = `${location.pathname}?${params.toString()}`;
    const ownCommit = navigationType === 'REPLACE' ? pendingFilterTargets.current.lastIndexOf(target) : -1;
    if (ownCommit >= 0) {
      // An intermediate transition must not replace a newer synchronous filter edit.
      pendingFilterTargets.current = pendingFilterTargets.current.slice(ownCommit + 1);
      if (pendingFilterTargets.current.length) return;
    } else {
      // Back/forward and navigation from elsewhere become the new editing baseline.
      pendingFilterTargets.current = [];
    }
    pendingFilters.current = new URLSearchParams(params);
  }, [location.key, location.pathname, navigationType, params]);
  const activeTab = params.get('queue') === 'complexes' ? 'complexes' : params.get('queue') === 'inactive' ? 'inactive' : params.get('queue') === 'draft' ? 'draft' : 'pending';
  const search = params.get('q') || '';
  const activeTypes: ModerationType[] = activeTab === 'inactive' ? ['service', 'product'] : ['listing', 'property'];
  const type = activeTypes.includes(params.get('type') as ModerationType) ? params.get('type') as ModerationType : activeTypes[0];
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const category = params.get('category') || 'all';
  const setFilters = (updates: Record<string, string>) => {
    // Router search-param callbacks are not queued like React state updates.
    const next = new URLSearchParams(pendingFilters.current);
    if (!('page' in updates)) next.delete('page');
    next.set('tab', 'moderation');
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key !== 'q' && value === 'all') || (key === 'queue' && value === 'pending')) next.delete(key);
      else next.set(key, value);
    });
    pendingFilters.current = next;
    pendingFilterTargets.current.push(`${location.pathname}?${next.toString()}`);
    setParams(next, { replace: true });
  };
  const actionInFlight = useRef(false);
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['moderation-queue', user?.id, activeTab, type, page, search, category], queryFn: () => fetchModerationQueue({ source: type, page, queue: activeTab === 'inactive' ? 'inactive' : activeTab === 'draft' ? 'draft' : 'pending', search, category }), enabled: !!user && activeTab !== 'complexes',
  });
  const label = (values: [string, string, string]) => pickLang(language, { en: values[0], ru: values[1], th: values[2] });
  const categoryLabel = (value: string) => categoryLabels[value] ? label(categoryLabels[value]) : value;
  const resetFilters = () => setFilters({ q: '', category: 'all' });
  const mutation = useMutation({
    mutationFn: updateModerationItem,
    onSuccess: (_result, { type, approve }) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      toast.success(type === 'service' || type === 'product'
        ? (approve ? label(["Activated", "Активировано", "เปิดใช้งานแล้ว"]) : label(["Kept inactive", "Оставлено неактивным", "คงสถานะไม่ใช้งาน"]))
        : (approve ? label(["Approved and activated", "Одобрено и активировано", "อนุมัติและเปิดใช้งานแล้ว"]) : label(["Rejected", "Отклонено", "ไม่อนุมัติ"])));
    },
    onError: () => {
      toast.error(label(["Change not confirmed. Refresh the queue and try again.", "Изменение не подтверждено. Обновите очередь и повторите.", "ยังยืนยันการเปลี่ยนแปลงไม่ได้ โปรดรีเฟรชคิวแล้วลองอีกครั้ง"]));
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
    },
    onSettled: () => { actionInFlight.current = false; },
  });
  const reviewAction = (item: ModerationItem, approve: boolean) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    mutation.mutate({ id: item.id, type: item.type, approve, expectedUpdatedAt: item.updated_at });
  };

  const loaded = (data?.items ?? []).filter(item => item.type === type);
  const failedTypes = data?.errors.filter(source => source === type) ?? [];
  const unavailable = isError || failedTypes.length > 0;
  const total = !isLoading && !unavailable ? data?.totals[type] ?? null : null;
  const categories = [...new Set([...loaded.map(categoryOf).filter(Boolean), ...(category !== 'all' ? [category] : [])])].sort();
  const filtered = loaded;
  const hasFilters = !!search || category !== 'all';
  const collectionLabel = (item: ModerationItem) => item.type === 'service'
    ? (item.provider_id ? label(["Open provider's services", "Услуги провайдера", "เปิดบริการของผู้ให้บริการ"]) : label(["Open services", "Открыть услуги", "เปิดบริการ"]))
    : item.type === 'listing' ? label(["Open category catalog", "Открыть каталог категории", "เปิดแคตตาล็อกหมวดหมู่"]) : label(["Open catalog", "Открыть каталог", "เปิดแคตตาล็อก"]);

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 shrink-0" />{label(["Moderation queue", "Очередь модерации", "คิวตรวจสอบ"])}</CardTitle>
        <p className="text-sm text-muted-foreground">{label([
          'Pending approval: listings and properties. Inactive services and products are shown separately.',
          'Ожидают одобрения: листинги и недвижимость. Неактивные услуги и товары показаны отдельно.',
          'รออนุมัติ: รายการและที่พัก บริการและสินค้าที่ไม่ใช้งานแสดงแยกต่างหาก',
        ])}</p>
      </CardHeader>
      <CardContent className="space-y-4 min-w-0">
        <Tabs value={activeTab} onValueChange={value => setFilters({ queue: value, q: '', type: 'all', category: 'all' })}>
          <TabsList className="grid h-auto w-full grid-cols-4">
            <TabsTrigger value="pending" className="min-h-11 whitespace-normal">{label(["Pending review", "На проверке", "รอตรวจสอบ"])}</TabsTrigger>
            <TabsTrigger value="draft" className="min-h-11 whitespace-normal">{label(["Drafts — not submitted", "Черновики — не поданы", "ฉบับร่าง — ยังไม่ส่ง"])}</TabsTrigger>
            <TabsTrigger value="inactive" className="min-h-11 whitespace-normal">{label(["Inactive catalog", "Неактивный каталог", "รายการที่ไม่ใช้งาน"])}</TabsTrigger>
            <TabsTrigger value="complexes" className="min-h-11 whitespace-normal">{label(["Complexes", "Комплексы", "โครงการที่พัก"])}</TabsTrigger>
          </TabsList>
          <TabsContent value="complexes"><ManagedComplexReviewQueue /></TabsContent>
          {['pending', 'inactive', 'draft'].map(tab => (
            <TabsContent value={tab} key={tab} className="space-y-4 min-w-0">
              <div data-testid="moderation-summary" className="rounded-none border bg-muted/30 p-3 space-y-1">
                <p className="font-medium"><span data-testid="moderation-count">{isLoading ? '…' : total ?? label(["Unknown", "Неизвестно", "ไม่ทราบ"])}</span> {tab === 'draft' ? label(['drafts', 'черновики', 'ฉบับร่าง']) : tab === 'pending' ? label(["pending approval", "ожидают одобрения", "รายการรออนุมัติ"]) : label(["inactive catalog items", "неактивных записей каталога", "รายการแคตตาล็อกที่ไม่ใช้งาน"])}</p>
                <p className="text-sm text-muted-foreground">{isLoading ? label(["Loading.", "Загрузка.", "กำลังโหลด."]) : label([
                  `Page ${page + 1}. Loaded ${loaded.length} of ${total ?? 'unknown'} for this source. Search and filters apply on the server.`,
                  `Страница ${page + 1}. Загружено ${loaded.length} из ${total ?? 'неизвестного количества'} этого источника. Поиск и фильтры применяются на сервере.`,
                  `หน้า ${page + 1} โหลด ${loaded.length} จาก ${total ?? 'ไม่ทราบจำนวน'} รายการของแหล่งข้อมูลนี้ ค้นหาและกรองที่เซิร์ฟเวอร์`,
                ])}</p>
                {tab === 'draft' && <p>{label(["Drafts have not been submitted for approval.", "Черновики не поданы на проверку.", "ฉบับร่างยังไม่ได้ส่งให้ตรวจสอบ"])}</p>}
                {tab === 'inactive' && <p className="text-sm text-muted-foreground">{label(["Inactive does not mean awaiting approval. Approval status is shown separately.", "Неактивность не означает ожидание одобрения. Статус проверки указан отдельно.", "สถานะไม่ใช้งานไม่ได้หมายถึงรออนุมัติ สถานะการตรวจสอบแสดงแยกต่างหาก"])}</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Input aria-label={label(["Search queue", "Поиск в очереди", "ค้นหาในคิว"])} placeholder={label(["Name or exact ID", "Название или точный ID", "ชื่อหรือรหัสที่ตรงกัน"])} value={search} onChange={event => setFilters({ q: event.target.value })} className="min-h-11 min-w-0" />
                <select aria-label={label(["Content type", "Тип контента", "ประเภทเนื้อหา"])} value={type} onChange={event => setFilters({ type: event.target.value, category: 'all' })} className="min-h-11 min-w-0 rounded-none border bg-background px-3 text-sm">
                  {activeTypes.map(value => <option key={value} value={value}>{label(typeLabels[value])}</option>)}
                </select>
                <select aria-label={label(["Category", "Категория", "หมวดหมู่"])} value={category} disabled={type === 'service'} onChange={event => setFilters({ category: event.target.value })} className="min-h-11 min-w-0 rounded-none border bg-background px-3 text-sm">
                  <option value="all">{label(["All categories", "Все категории", "ทุกหมวดหมู่"])}</option>
                  {categories.map(value => <option key={value} value={value}>{categoryLabel(value)}</option>)}
                </select>
                <Button variant="outline" className="min-h-11" onClick={resetFilters} disabled={!hasFilters}>{label(["Clear filters", "Сбросить фильтры", "ล้างตัวกรอง"])}</Button>
              </div>
              {unavailable && <div role="alert" className="rounded-none border border-warning p-3 space-y-2">
                <p className="flex items-start gap-2 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />{label(["Some queue data is unavailable. Counts are unknown; available records are shown below.", "Часть данных очереди недоступна. Количество неизвестно; ниже показаны доступные записи.", "ข้อมูลคิวบางส่วนไม่พร้อมใช้งาน จึงไม่ทราบจำนวน รายการที่โหลดได้แสดงอยู่ด้านล่าง"])}</p>
                {failedTypes.length > 0 && <p className="text-sm">{failedTypes.map(source => label(typeLabels[source])).join(', ')}</p>}
                <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>{label(["Retry", "Повторить", "ลองอีกครั้ง"])}</Button>
              </div>}
              <nav className="flex items-center gap-3" aria-label={label(['Queue pages', 'Страницы очереди', 'หน้าคิว'])}>
                <Button variant="outline" disabled={page === 0 || isFetching} onClick={() => setFilters({ page: String(page - 1) })}>{label(['Previous', 'Назад', 'ก่อนหน้า'])}</Button>
                <span>{page + 1}</span>
                <Button variant="outline" disabled={isFetching || total === null || (page + 1) * MODERATION_PAGE_SIZE >= total} onClick={() => setFilters({ page: String(page + 1) })}>{label(['Next', 'Далее', 'ถัดไป'])}</Button>
              </nav>
              {isLoading ? <p role="status" className="py-6 text-center text-muted-foreground">{label(["Loading…", "Загрузка…", "กำลังโหลด…"])}</p> : <div className="space-y-3">
                {filtered.map(item => {
                  const name = (isRussian ? item.name_ru || item.name_en : item.name_en || item.name_ru) || label(["Untitled", "Без названия", "ไม่มีชื่อ"]);
                  const destination = moderationReviewDestination(item, location.pathname + location.search);
                  const date = item.created_at ? new Date(item.created_at) : null;
                  const approval = item.approval_status === 'pending' ? label(["Pending", "Ожидает", "รออนุมัติ"]) : item.approval_status === 'approved' ? label(["Approved", "Одобрено", "อนุมัติแล้ว"]) : item.approval_status === 'rejected' ? label(["Rejected", "Отклонено", "ไม่อนุมัติ"]) : item.approval_status === 'draft' ? label(['Draft', 'Черновик', 'ฉบับร่าง']) : item.approval_status || label(["Unknown", "Неизвестно", "ไม่ทราบ"]);
                  return <article key={`${item.type}-${item.id}`} data-testid="moderation-row" className="min-w-0 rounded-none border p-3 sm:p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{label(typeLabels[item.type])}</Badge>{categoryOf(item) && <span className="text-xs text-muted-foreground break-words">{categoryLabel(categoryOf(item))}</span>}</div>
                    <h3 className="font-medium break-words [overflow-wrap:anywhere]">{name}</h3>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label(["Provider", "Провайдер", "ผู้ให้บริการ"])}</dt><dd className="break-words">{item.provider_name || label(["Not available", "Нет данных", "ไม่มีข้อมูล"])}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">{label(["Created, not submitted", "Создано, не дата подачи", "วันที่สร้าง ไม่ใช่วันที่ส่งตรวจ"])}</dt><dd>{date && !Number.isNaN(date.getTime()) ? format(date, 'dd.MM.yyyy') : label(["Unknown", "Неизвестно", "ไม่ทราบ"])}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">{label(["Approval status", "Статус проверки", "สถานะการอนุมัติ"])}</dt><dd>{approval}{tab === 'inactive' && ` · ${label(["Inactive", "Неактивно", "ไม่ใช้งาน"])}`}</dd></div>
                    </dl>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="min-h-11" disabled={!destination.review} onClick={() => destination.review && navigate(destination.review)}><Eye className="h-4 w-4 mr-2" />{label(["Review", "Проверить", "ตรวจสอบ"])}</Button>
                      {destination.collection && <Button variant="outline" className="min-h-11 whitespace-normal h-auto py-2" onClick={() => navigate(destination.collection!)}>{collectionLabel(item)}</Button>}
                      <Button variant="ghost" className="min-h-11 text-success" aria-label={`${(tab === 'inactive' ? label(["Activate", "Активировать", "เปิดใช้งาน"]) : label(["Approve & activate", "Одобрить и активировать", "อนุมัติและเปิดใช้งาน"]))}: ${name}`} onClick={() => reviewAction(item, true)} disabled={mutation.isPending || isFetching || tab === 'draft'}><ThumbsUp className="h-4 w-4 mr-2" />{(tab === 'inactive' ? label(["Activate", "Активировать", "เปิดใช้งาน"]) : label(["Approve & activate", "Одобрить и активировать", "อนุมัติและเปิดใช้งาน"]))}</Button>
                      <Button variant="ghost" className="min-h-11 text-destructive" aria-label={`${(tab === 'inactive' ? label(["Keep inactive", "Оставить неактивным", "คงสถานะไม่ใช้งาน"]) : label(["Reject", "Отклонить", "ไม่อนุมัติ"]))}: ${name}`} onClick={() => reviewAction(item, false)} disabled={mutation.isPending || isFetching || tab === 'draft'}><ThumbsDown className="h-4 w-4 mr-2" />{(tab === 'inactive' ? label(["Keep inactive", "Оставить неактивным", "คงสถานะไม่ใช้งาน"]) : label(["Reject", "Отклонить", "ไม่อนุมัติ"]))}</Button>
                    </div>
                    {!destination.review && <p className="text-xs text-muted-foreground">{label(["Direct item review is not available for this type. Use the catalog if available; opening it does not approve or publish the item.", "Прямой просмотр записи для этого типа недоступен. Используйте каталог, если ссылка доступна; переход не одобряет и не публикует запись.", "รายการประเภทนี้ยังไม่มีหน้าตรวจสอบโดยตรง โปรดใช้แคตตาล็อกหากมี การเปิดแคตตาล็อกไม่ใช่การอนุมัติหรือเผยแพร่รายการ"])}</p>}
                  </article>;
                })}
                {filtered.length === 0 && !unavailable && <p className="py-6 text-center text-muted-foreground">{hasFilters ? label(["No matching items", "Ничего не найдено", "ไม่พบรายการที่ตรงกัน"]) : tab === 'pending' ? label(["No pending items", "Нет записей на проверке", "ไม่มีรายการรอตรวจสอบ"]) : label(["No inactive items", "Нет неактивных записей", "ไม่มีรายการที่ไม่ใช้งาน"])}</p>}
              </div>}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
