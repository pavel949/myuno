import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useCompanyAccessLifetime } from '@/hooks/useCompanyAccessLifetime';
import { bindCompanyAccessOperation, StaleCompanyAccessOperation } from '@/lib/companyAccessOperation';
import { complexAuthoringDelta, listManagedComplexDrafts, readComplexCreationScope, readManagedComplexDraft, saveManagedComplexDraft, type ManagedComplexDraft } from '@/lib/complexAuthoring';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { ComplexFormDialog } from './ComplexFormDialog';
import type { ComplexFormData } from '@/hooks/usePropertyComplexes';

export function ManagedComplexDrafts() {
  const { user } = useAuth();
  const { activeCompany, isLoading, error } = useActiveCompany();
  const { language } = useLanguage();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  if (isLoading) return <p role="status">{text('Loading workspace…', 'Загружаем рабочую область…', 'กำลังโหลดพื้นที่ทำงาน…')}</p>;
  if (error || !user || !activeCompany) return <p role="alert">{text('An authorized company workspace is required to enter complex content.', 'Для заполнения комплекса нужен доступ к рабочей области компании.', 'ต้องมีสิทธิ์ในพื้นที่ทำงานของบริษัทเพื่อกรอกข้อมูลโครงการ')}</p>;
  // A different actor/company gets a different editor lifetime, never stale content.
  return <ComplexDraftWorkspace key={`${user.id}:${activeCompany.company_id}`} actorId={user.id} companyId={activeCompany.company_id} />;
}

function ComplexDraftWorkspace({ actorId, companyId }: { actorId: string; companyId: string }) {
  const { language } = useLanguage();
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const lifetime = useCompanyAccessLifetime(actorId, companyId);
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedComplexDraft | null>(null);
  const [spaceId, setSpaceId] = useState('');
  const [opening, setOpening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mustReload, setMustReload] = useState(false);
  const [openError, setOpenError] = useState(false);
  const requestInFlight = useRef(false);
  const drafts = useQuery({
    queryKey: ['managed-complex-drafts', actorId, companyId, offset],
    queryFn: async ({ signal }) => {
      const lease = lifetime.begin();
      signal.addEventListener('abort', lease.finish, { once: true });
      try { return await listManagedComplexDrafts(await bindCompanyAccessOperation(lease), offset); }
      finally { signal.removeEventListener('abort', lease.finish); lease.finish(); }
    },
  });
  const spaces = useQuery({
    queryKey: ['managed-complex-spaces', actorId, companyId],
    enabled: open && !editing,
    queryFn: async ({ signal }) => {
      const lease = lifetime.begin();
      signal.addEventListener('abort', lease.finish, { once: true });
      try { return await readComplexCreationScope(await bindCompanyAccessOperation(lease)); }
      finally { signal.removeEventListener('abort', lease.finish); lease.finish(); }
    },
  });
  useEffect(() => {
    if (spaces.data?.spaces.length === 1) setSpaceId(spaces.data.spaces[0].id);
  }, [spaces.data]);

  const openDraft = async (draft: ManagedComplexDraft) => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setOpening(true); setOpenError(false);
    const lease = lifetime.begin();
    try {
      // Never edit a cached list row as though its authority/version were current.
      const row = await readManagedComplexDraft(await bindCompanyAccessOperation(lease), draft.id);
      lease.assertCurrent();
      setEditing(row); setMustReload(false); setOpen(true);
    } catch (error) {
      if (!(error instanceof StaleCompanyAccessOperation) && lifetime.isActive) setOpenError(true);
    } finally {
      lease.finish(); requestInFlight.current = false;
      if (lifetime.isActive) setOpening(false);
    }
  };
  const onSave = async (data: ComplexFormData, baseline: ComplexFormData, submit: boolean) => {
    if (requestInFlight.current || mustReload) throw new Error('Reload before saving');
    requestInFlight.current = true; setSaving(true);
    const lease = lifetime.begin();
    try {
      const operation = await bindCompanyAccessOperation(lease);
      await saveManagedComplexDraft(operation, {
        complexId: editing?.id, expectedUpdatedAt: editing?.updated_at,
        operatingSpaceId: editing?.authoring_space_id || spaceId,
        patch: editing ? complexAuthoringDelta(data, baseline) : data, submit,
      });
      operation.assertCurrent();
      // Persisted success is independent of a later list-refresh error.
      void queryClient.invalidateQueries({ queryKey: ['managed-complex-drafts', actorId, companyId] });
      void queryClient.invalidateQueries({ queryKey: ['property-complexes', actorId] });
    } catch (error) {
      if (lifetime.isActive) {
        // A transport error may follow a committed create. Do not duplicate it.
        setMustReload(true);
        void queryClient.invalidateQueries({ queryKey: ['managed-complex-drafts', actorId, companyId] });
      }
      throw error;
    } finally {
      lease.finish(); requestInFlight.current = false;
      if (lifetime.isActive) setSaving(false);
    }
  };

  return <section aria-label={text('Complex data entry', 'Заполнение комплексов', 'กรอกข้อมูลโครงการ')} className="space-y-4 border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">{text('Complex data entry', 'Заполнение комплексов', 'กรอกข้อมูลโครงการ')}</h2>
        <p className="text-sm text-muted-foreground">{text('Save catalogue content, then send it for publication review.', 'Сохраните данные каталога и отправьте их на проверку перед публикацией.', 'บันทึกข้อมูลแค็ตตาล็อก แล้วส่งให้ตรวจสอบก่อนเผยแพร่')}</p></div>
      <Button className="gap-2" disabled={drafts.isLoading || !!drafts.error || opening} onClick={() => { setEditing(null); setSpaceId(''); setMustReload(false); setOpenError(false); setOpen(true); }}><Plus className="h-4 w-4" />{text('New complex', 'Новый комплекс', 'โครงการใหม่')}</Button>
    </div>
    {drafts.isLoading && <p role="status">{text('Loading drafts…', 'Загружаем черновики…', 'กำลังโหลดฉบับร่าง…')}</p>}
    {drafts.error && <div role="alert" className="space-y-2"><p>{text('Complex data entry is unavailable. Your administrator needs to verify the checked workflow and your assignment.', 'Заполнение комплексов недоступно. Администратору нужно проверить защищённый процесс и ваше назначение.', 'ยังกรอกข้อมูลโครงการไม่ได้ ผู้ดูแลต้องตรวจสอบขั้นตอนที่ตรวจสอบสิทธิ์และการมอบหมายของคุณ')}</p><Button variant="outline" onClick={() => void drafts.refetch()}>{text('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button></div>}
    {openError && <p role="alert">{text('This complex could not be opened. Refresh the list and check your access.', 'Не удалось открыть комплекс. Обновите список и проверьте доступ.', 'เปิดโครงการนี้ไม่ได้ โปรดรีเฟรชรายการและตรวจสอบสิทธิ์')}</p>}
    {!drafts.isLoading && !drafts.error && !drafts.data?.length && <p>{text('No drafts in this workspace.', 'В этой рабочей области нет черновиков.', 'ไม่มีฉบับร่างในพื้นที่ทำงานนี้')}</p>}
    {!drafts.error && drafts.data?.map(draft => <div key={draft.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <div className="min-w-0"><p className="break-words font-medium">{language === 'ru' ? draft.name_ru || draft.name : draft.name}</p><p className="text-sm text-muted-foreground">{
        draft.approval_status === 'draft' ? text('Draft', 'Черновик', 'ฉบับร่าง') : draft.approval_status === 'pending' ? text('Awaiting review', 'На проверке', 'รอตรวจสอบ') : draft.approval_status === 'rejected' ? text('Returned for changes', 'Возвращён на доработку', 'ส่งกลับเพื่อแก้ไข') : text('Published', 'Опубликован', 'เผยแพร่แล้ว')
      }</p></div>
      <Button variant="outline" disabled={opening || saving} onClick={() => void openDraft(draft)}>{text('Open', 'Открыть', 'เปิด')}</Button>
    </div>)}
    {!drafts.error && (offset > 0 || drafts.data?.length === 50) && <div className="flex gap-2">
      <Button variant="outline" disabled={offset === 0 || drafts.isFetching} onClick={() => setOffset(value => Math.max(0, value - 50))}>{text('Previous', 'Назад', 'ก่อนหน้า')}</Button>
      <Button variant="outline" disabled={drafts.data?.length !== 50 || drafts.isFetching} onClick={() => setOffset(value => value + 50)}>{text('Next', 'Далее', 'ถัดไป')}</Button>
    </div>}
    {open && <>
      <ComplexFormDialog open={open} onOpenChange={setOpen} complex={editing} managed={{
        spaces: spaces.data?.spaces || [], spaceId, onSpaceChange: setSpaceId,
        status: editing?.approval_status, isPending: saving,
        blocked: mustReload || (!editing && (spaces.isLoading || !!spaces.error || !spaces.data?.spaces.length)), onSave,
        scopeMessage: editing ? undefined : spaces.isLoading ? text('Loading assigned Spaces…', 'Загружаем назначенные области…', 'กำลังโหลดพื้นที่ที่ได้รับมอบหมาย…') : spaces.error ? text('Assigned Spaces could not be verified. Close the form and retry.', 'Не удалось проверить назначенные области. Закройте форму и повторите попытку.', 'ตรวจสอบพื้นที่ที่ได้รับมอบหมายไม่ได้ ปิดแบบฟอร์มแล้วลองใหม่') : spaces.data?.spaces.length === 0 ? text('No active Space is assigned. Contact your administrator.', 'Нет назначенной активной области. Обратитесь к администратору.', 'ยังไม่ได้รับมอบหมายพื้นที่ที่เปิดใช้งาน โปรดติดต่อผู้ดูแล') : undefined,
      }} />
    </>}
  </section>;
}
