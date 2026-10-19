import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';
import { bindCompanyAccessOperation, StaleCompanyAccessOperation } from '@/lib/companyAccessOperation';
import { listManagedComplexSubmissions, readManagedComplexSubmission, reviewManagedComplexSubmission, type ManagedComplexDraft } from '@/lib/complexAuthoring';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ComplexFormDialog } from '@/components/owner/ComplexFormDialog';

export function ManagedComplexReviewQueue() {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdminCheck();
  const { language } = useLanguage();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  if (isLoading) return <p role="status">{text('Checking review access…', 'Проверяем доступ к модерации…', 'กำลังตรวจสอบสิทธิ์ตรวจสอบ…')}</p>;
  if (!user || !isAdmin) return <p role="alert">{text('Platform administrator access could not be verified.', 'Не удалось подтвердить доступ администратора платформы.', 'ยืนยันสิทธิ์ผู้ดูแลแพลตฟอร์มไม่ได้')}</p>;
  return <ComplexReviewWorkspace key={user.id} actorId={user.id} />;
}

function ComplexReviewWorkspace({ actorId }: { actorId: string }) {
  const { language } = useLanguage();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  // This is a platform-admin scope, not a selected company or a company grant.
  const lifetime = useCompanyAccessLifetime(actorId, 'platform-complex-review');
  const qc = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<ManagedComplexDraft | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const [outcome, setOutcome] = useState<'approved' | 'rejected' | null>(null);
  const inFlight = useRef(false);
  const queue = useQuery({
    queryKey: ['admin-complex-submissions', actorId, offset],
    queryFn: async ({ signal }) => {
      const lease = lifetime.begin();
      signal.addEventListener('abort', lease.finish, { once: true });
      try { return await listManagedComplexSubmissions(await bindCompanyAccessOperation(lease), offset); }
      finally { signal.removeEventListener('abort', lease.finish); lease.finish(); }
    },
  });
  const openReview = async (row: ManagedComplexDraft) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(false); setOutcome(null);
    const lease = lifetime.begin();
    try {
      const current = await readManagedComplexSubmission(await bindCompanyAccessOperation(lease), row);
      lease.assertCurrent();
      setSelected(current); setReason(''); setMustReload(false);
    } catch (failure) {
      if (!(failure instanceof StaleCompanyAccessOperation) && lifetime.isActive) setError(true);
    } finally {
      lease.finish(); inFlight.current = false;
      if (lifetime.isActive) setBusy(false);
    }
  };
  const review = async (decision: 'approve' | 'reject') => {
    if (!selected || inFlight.current || mustReload || (decision === 'reject' && !reason.trim())) return;
    inFlight.current = true; setBusy(true); setError(false);
    const lease = lifetime.begin();
    try {
      await reviewManagedComplexSubmission(await bindCompanyAccessOperation(lease), selected, decision, reason);
      lease.assertCurrent();
      setSelected(null); setOutcome(decision === 'approve' ? 'approved' : 'rejected');
      void qc.invalidateQueries({ queryKey: ['admin-complex-submissions', actorId] });
      void qc.invalidateQueries({ queryKey: ['managed-complex-drafts'] });
      void qc.invalidateQueries({ queryKey: ['property-complexes'] });
      void qc.invalidateQueries({ queryKey: ['complex-amenities'] });
      void qc.invalidateQueries({ queryKey: ['property-complexes-lookup'] });
    } catch (failure) {
      if (!(failure instanceof StaleCompanyAccessOperation) && lifetime.isActive) { setError(true); setMustReload(true); }
      void qc.invalidateQueries({ queryKey: ['admin-complex-submissions', actorId] });
    } finally {
      lease.finish(); inFlight.current = false;
      if (lifetime.isActive) setBusy(false);
    }
  };
  const failureText = text('Review was not confirmed. Close the form and refresh the queue before trying again.', 'Результат проверки не подтверждён. Закройте форму и обновите очередь перед повторной попыткой.', 'ยังยืนยันผลตรวจสอบไม่ได้ ปิดแบบฟอร์มและรีเฟรชคิวก่อนลองใหม่');
  return <section aria-label={text('Complex publication review', 'Проверка публикации комплексов', 'ตรวจสอบการเผยแพร่โครงการ')} className="space-y-4 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{text('Complex publication review', 'Проверка публикации комплексов', 'ตรวจสอบการเผยแพร่โครงการ')}</h3><p className="text-sm text-muted-foreground">{text('Review the submitted catalogue content before publishing. Up to 50 pending complexes are shown per page.', 'Проверьте данные каталога перед публикацией. На странице до 50 комплексов на проверке.', 'ตรวจสอบข้อมูลแค็ตตาล็อกที่ส่งมาก่อนเผยแพร่ แสดงโครงการที่รอตรวจสอบสูงสุด 50 รายการต่อหน้า')}</p></div><Button variant="outline" disabled={queue.isFetching || busy} onClick={() => void queue.refetch()}>{text('Refresh', 'Обновить', 'รีเฟรช')}</Button></div>
    {queue.isLoading && <p role="status">{text('Loading submissions…', 'Загружаем заявки…', 'กำลังโหลดรายการที่ส่งตรวจ…')}</p>}
    {queue.error && <p role="alert">{text('The complex review queue is unavailable. Check administrator access and workflow activation.', 'Очередь комплексов недоступна. Проверьте доступ администратора и активацию процесса.', 'คิวตรวจสอบโครงการไม่พร้อมใช้งาน โปรดตรวจสอบสิทธิ์ผู้ดูแลและการเปิดใช้งานขั้นตอน')}</p>}
    {error && !selected && <p role="alert">{failureText}</p>}
    {outcome && <p role="status">{outcome === 'approved' ? text('Complex published.', 'Комплекс опубликован.', 'เผยแพร่โครงการแล้ว') : text('Complex returned for changes.', 'Комплекс возвращён на доработку.', 'ส่งโครงการกลับเพื่อแก้ไขแล้ว')}</p>}
    {!queue.isLoading && !queue.error && !queue.data?.length && <p>{text('No pending complexes on this page.', 'На этой странице нет комплексов на проверке.', 'ไม่มีโครงการที่รอตรวจสอบในหน้านี้')}</p>}
    {!queue.error && queue.data?.map(row => <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 border p-3 min-w-0">
      <div className="min-w-0"><p className="font-medium break-words">{language === 'ru' ? row.name_ru || row.name : row.name}</p>{row.district && <p className="text-sm text-muted-foreground break-words">{row.district}</p>}</div>
      <Button variant="outline" disabled={busy || queue.isFetching} onClick={() => void openReview(row)}>{text('Review details', 'Проверить данные', 'ตรวจสอบรายละเอียด')}</Button>
    </article>)}
    {!queue.error && (offset > 0 || queue.data?.length === 50) && <div className="flex gap-2"><Button variant="outline" disabled={!offset || queue.isFetching || busy} onClick={() => setOffset(value => Math.max(0, value - 50))}>{text('Previous', 'Назад', 'ก่อนหน้า')}</Button><Button variant="outline" disabled={queue.data?.length !== 50 || queue.isFetching || busy} onClick={() => setOffset(value => value + 50)}>{text('Next', 'Далее', 'ถัดไป')}</Button></div>}
    {selected && <ComplexFormDialog open complex={selected} onOpenChange={value => { if (!value && !busy) setSelected(null); }} managed={{ spaces: [], spaceId: selected.authoring_space_id, onSpaceChange: () => {}, status: 'pending', isPending: busy, blocked: true, onSave: async () => { throw new Error('Review never edits submitted content'); } }} footerActions={<div className="w-full space-y-2">
      {error && <p role="alert" className="text-sm text-destructive">{failureText}</p>}
      <Input aria-label={text('Reason for changes', 'Причина доработки', 'เหตุผลที่ต้องแก้ไข')} maxLength={5000} disabled={busy || mustReload} placeholder={text('Required when returning for changes', 'Обязательно при возврате на доработку', 'ต้องระบุเมื่อส่งกลับเพื่อแก้ไข')} value={reason} onChange={event => setReason(event.target.value)} />
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy || mustReload || !reason.trim()} onClick={() => void review('reject')}>{text('Return for changes', 'Вернуть на доработку', 'ส่งกลับเพื่อแก้ไข')}</Button><Button disabled={busy || mustReload} onClick={() => void review('approve')}>{text('Approve and publish', 'Одобрить и опубликовать', 'อนุมัติและเผยแพร่')}</Button></div>
    </div>} />}
  </section>;
}
