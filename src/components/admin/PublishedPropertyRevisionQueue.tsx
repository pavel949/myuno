import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { listPendingPropertyRevisions, readPropertyRevision, reviewPropertyRevision, type PropertyRevisionState } from '@/lib/propertyRevisions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

function displayedValue(value: unknown) {
  if (value == null || value === '') return '—';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

/** Frozen persisted proposal: a refreshed queue never substitutes reviewed data. */
export function PublishedPropertyRevisionReview({ initial, onClose, onReviewed }: {
  initial: PropertyRevisionState; onClose: () => void; onReviewed: () => void;
}) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [reviewed, setReviewed] = useState(initial);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(false);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const actorRef = useRef(user?.id);
  actorRef.current = user?.id;
  const revision = reviewed.revision;
  const pending = revision?.status === 'pending';
  const decide = async (decision: 'approve' | 'reject') => {
    if (requestRef.current || blocked || !pending || !user || (decision === 'reject' && !reason.trim())) return;
    requestRef.current = true;
    const actor = user.id;
    setBusy(true);
    setError(null);
    try {
      const saved = await reviewPropertyRevision(reviewed, decision, reason);
      if (!mountedRef.current || actorRef.current !== actor) return;
      setReviewed(saved);
      toast.success(pickLang(language, decision === 'approve'
        ? { en: 'Reviewed changes are now published', ru: 'Проверенные изменения опубликованы', th: 'เผยแพร่การแก้ไขที่ตรวจสอบแล้ว' }
        : { en: 'Changes returned; published content is unchanged', ru: 'Изменения возвращены; опубликованные данные не изменены', th: 'ส่งการแก้ไขกลับแล้ว ข้อมูลที่เผยแพร่ยังเหมือนเดิม' }));
      onReviewed();
    } catch (cause) {
      if (!mountedRef.current || actorRef.current !== actor) return;
      setBlocked(true);
      setError(cause instanceof Error ? cause.message : pickLang(language, { en: 'Review was not confirmed', ru: 'Проверка не подтверждена', th: 'ยังยืนยันการตรวจสอบไม่ได้' }));
    } finally {
      requestRef.current = false;
      if (mountedRef.current && actorRef.current === actor) setBusy(false);
    }
  };
  const reload = async () => {
    if (requestRef.current || !user) return;
    requestRef.current = true;
    const actor = user.id;
    setBusy(true);
    try {
      const latest = await readPropertyRevision(reviewed.property.id, reviewed.property.management_company_id!);
      if (!mountedRef.current || actorRef.current !== actor) return;
      setReviewed(latest); setReason(''); setError(null); setBlocked(false);
    } catch (cause) {
      if (mountedRef.current && actorRef.current === actor) setError(cause instanceof Error ? cause.message : 'Reload failed');
    } finally { requestRef.current = false; if (mountedRef.current && actorRef.current === actor) setBusy(false); }
  };
  return <section aria-label={pickLang(language, { en: 'Review proposed property changes', ru: 'Проверка предлагаемых изменений объекта', th: 'ตรวจสอบข้อเสนอแก้ไขที่พัก' })} className="mt-4 min-w-0 space-y-4 border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="break-words font-semibold">{reviewed.property.title_en}</h3>
        <p className="text-sm text-muted-foreground">{pickLang(language, { en: 'The approved listing remains published during review.', ru: 'Одобренное объявление остаётся опубликованным во время проверки.', th: 'ประกาศที่อนุมัติแล้วยังคงเผยแพร่ระหว่างการตรวจสอบ' })}</p>
      </div>
      <Button variant="outline" disabled={busy} onClick={onClose}>{pickLang(language, { en: 'Close review', ru: 'Закрыть проверку', th: 'ปิดการตรวจสอบ' })}</Button>
    </div>
    {revision && <p className="break-all text-xs text-muted-foreground">{pickLang(language, { en: 'Proposal version', ru: 'Версия предложения', th: 'เวอร์ชันข้อเสนอ' })}: {revision.version}</p>}
    {reviewed.conflict && <p role="alert" className="text-sm text-destructive">{pickLang(language, { en: 'Published content changed since this proposal began. Approval is blocked. Return it for correction.', ru: 'Опубликованные данные изменились после создания предложения. Одобрение заблокировано. Верните изменения на доработку.', th: 'ข้อมูลที่เผยแพร่เปลี่ยนไปหลังสร้างข้อเสนอ จึงยังอนุมัติไม่ได้ โปรดส่งกลับเพื่อแก้ไข' })}</p>}
    {error && <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><p>{pickLang(language, { en: 'Reload and review the current proposal before trying again.', ru: 'Загрузите и проверьте текущее предложение перед повторной попыткой.', th: 'โหลดและตรวจสอบข้อเสนอปัจจุบันก่อนลองอีกครั้ง' })}</p></div>}
    <div className="max-h-[55vh] min-w-0 space-y-3 overflow-y-auto">
      {Object.entries(revision?.patch || {}).map(([field, value]) => <div key={field} className="min-w-0 border p-3">
        <p className="mb-2 break-words font-medium">{field.split('_').join(' ')}</p>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0"><p className="text-xs text-muted-foreground">{pickLang(language, { en: 'Published when proposed', ru: 'Опубликовано на момент предложения', th: 'ข้อมูลเผยแพร่เมื่อสร้างข้อเสนอ' })}</p><pre className="whitespace-pre-wrap break-words font-sans text-sm [overflow-wrap:anywhere]">{displayedValue(revision?.base[field])}</pre></div>
          <div className="min-w-0"><p className="text-xs text-muted-foreground">{pickLang(language, { en: 'Proposed', ru: 'Предложено', th: 'ข้อเสนอ' })}</p><pre className="whitespace-pre-wrap break-words font-sans text-sm [overflow-wrap:anywhere]">{displayedValue(value)}</pre></div>
        </div>
      </div>)}
    </div>
    {!pending && <p role="status">{pickLang(language, { en: 'This proposal is no longer pending review.', ru: 'Это предложение больше не ожидает проверки.', th: 'ข้อเสนอนี้ไม่ได้อยู่ระหว่างรอตรวจสอบแล้ว' })}</p>}
    {pending && <div className="space-y-1 text-sm">
      <Label htmlFor={`revision-return-${reviewed.property.id}`}>{pickLang(language, { en: 'Reason for returning changes', ru: 'Причина возврата изменений', th: 'เหตุผลที่ส่งการแก้ไขกลับ' })}</Label>
      <Textarea id={`revision-return-${reviewed.property.id}`} value={reason} disabled={busy || blocked} onChange={event => setReason(event.target.value)} />
    </div>}
    <div className="flex flex-wrap gap-2">
      {pending && <>
        <Button className="h-auto min-h-11 whitespace-normal" disabled={busy || blocked || reviewed.conflict} onClick={() => void decide('approve')}>{pickLang(language, { en: 'Approve this revision', ru: 'Одобрить эту версию', th: 'อนุมัติฉบับแก้ไขนี้' })}</Button>
        <Button variant="outline" className="h-auto min-h-11 whitespace-normal" disabled={busy || blocked || !reason.trim()} onClick={() => void decide('reject')}>{pickLang(language, { en: 'Return for correction', ru: 'Вернуть на доработку', th: 'ส่งกลับเพื่อแก้ไข' })}</Button>
      </>}
      <Button variant="outline" disabled={busy} onClick={() => void reload()}>{pickLang(language, { en: 'Reload proposal', ru: 'Обновить предложение', th: 'โหลดข้อเสนอใหม่' })}</Button>
    </div>
  </section>;
}

export function PublishedPropertyRevisionQueue() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<{ actor: string; state: PropertyRevisionState } | null>(null);
  const query = useQuery({ queryKey: ['pending-property-revisions', user?.id, offset], enabled: !!user,
    queryFn: () => listPendingPropertyRevisions(offset), retry: false });
  return <section className="mb-4 min-w-0 border p-4">
    <h2 className="font-semibold">{pickLang(language, { en: 'Changes to published properties', ru: 'Изменения опубликованных объектов', th: 'การแก้ไขที่พักที่เผยแพร่แล้ว' })}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{pickLang(language, { en: 'Review proposed edits without taking existing listings offline.', ru: 'Проверяйте предлагаемые изменения без снятия объявлений с публикации.', th: 'ตรวจสอบข้อเสนอแก้ไขโดยไม่ต้องปิดประกาศเดิม' })}</p>
    {query.isLoading ? <p role="status">{pickLang(language, { en: 'Loading proposals…', ru: 'Загрузка предложений…', th: 'กำลังโหลดข้อเสนอ…' })}</p>
      : query.error ? <p role="alert" className="mt-2 text-sm">{pickLang(language, { en: 'The checked revision queue is unavailable. Existing publication review is still separate.', ru: 'Защищённая очередь изменений недоступна. Проверка новых публикаций доступна отдельно.', th: 'คิวตรวจสอบฉบับแก้ไขยังไม่พร้อม การตรวจสอบประกาศใหม่เป็นขั้นตอนแยกต่างหาก' })}</p>
      : !query.data?.length ? <p role="status" className="mt-2 text-sm">{pickLang(language, { en: 'No pending proposals on this page.', ru: 'На этой странице нет предложений на проверке.', th: 'ไม่มีข้อเสนอที่รอตรวจสอบในหน้านี้' })}</p>
        : <ul className="mt-3 space-y-2">{query.data.map(state => <li key={state.property.id} className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t pt-2">
          <span className="min-w-0 break-words">{state.property.title_en}</span>
          <Button variant="outline" onClick={() => user && setSelected({ actor: user.id, state })}>{pickLang(language, { en: 'Review changes', ru: 'Проверить изменения', th: 'ตรวจสอบการแก้ไข' })}</Button>
        </li>)}</ul>}
    <div className="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>{pickLang(language, { en: 'Refresh proposals', ru: 'Обновить предложения', th: 'รีเฟรชข้อเสนอ' })}</Button>
      {offset > 0 && <Button variant="outline" disabled={query.isFetching} onClick={() => setOffset(Math.max(0, offset - 50))}>{pickLang(language, { en: 'Previous page', ru: 'Предыдущая страница', th: 'หน้าก่อนหน้า' })}</Button>}
      {query.data?.length === 50 && <Button variant="outline" disabled={query.isFetching} onClick={() => setOffset(offset + 50)}>{pickLang(language, { en: 'Next page', ru: 'Следующая страница', th: 'หน้าถัดไป' })}</Button>}
    </div>
    {user && selected?.actor === user.id && selected && <PublishedPropertyRevisionReview key={`${user.id}:${selected.state.property.id}`} initial={selected.state} onClose={() => setSelected(null)} onReviewed={() => {
      void queryClient.invalidateQueries({ queryKey: ['pending-property-revisions'] });
      void queryClient.invalidateQueries({ queryKey: ['owner-property'] });
      void queryClient.invalidateQueries({ queryKey: ['managed-property-revision'] });
    }} />}
  </section>;
}
