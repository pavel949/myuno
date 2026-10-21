import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { listManagedPropertyDrafts } from '@/lib/propertyAuthoring';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';

/** Safe catalogue-only drafts. This does not join the operational property list. */
export function ManagedPropertyDrafts() {
  const { user } = useAuth();
  const { activeCompany } = useActiveCompany();
  const { language } = useLanguage();
  const companyId = activeCompany?.company_id;
  const [offset, setOffset] = useState(0);
  useEffect(() => setOffset(0), [user?.id, companyId]);
  const drafts = useQuery({
    queryKey: ['managed-property-drafts', user?.id, companyId, offset],
    enabled: !!user && !!companyId,
    queryFn: () => listManagedPropertyDrafts(companyId!, offset),
  });
  const text = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  if (!user || !companyId) return null;
  return <section aria-label={text('Property data entry', 'Заполнение объектов', 'กรอกข้อมูลอสังหาริมทรัพย์')} className="mb-6 space-y-3 border p-4">
    <h2 className="font-semibold">{text('Property data entry', 'Заполнение объектов', 'กรอกข้อมูลอสังหาริมทรัพย์')}</h2>
    <p className="text-sm text-muted-foreground">{text('Drafts and review status for your authorized workspace. This section does not grant access to keys, payouts, or financial records.', 'Черновики и статус проверки в доступной вам области. Этот раздел не предоставляет доступ к ключам, выплатам или финансовым записям.', 'ฉบับร่างและสถานะตรวจสอบในพื้นที่ที่คุณได้รับสิทธิ์ ส่วนนี้ไม่ให้สิทธิ์เข้าถึงกุญแจ การจ่ายเงิน หรือบันทึกการเงิน')}</p>
    {drafts.isLoading && <p role="status">{text('Loading drafts…', 'Загружаем черновики…', 'กำลังโหลดฉบับร่าง…')}</p>}
    {drafts.error && <div role="alert" className="space-y-2">
      <p>{text('Data entry is unavailable. Your administrator may need to enable the checked workflow or verify your assignment.', 'Заполнение недоступно. Администратору нужно проверить назначение и доступность защищённого процесса.', 'ยังกรอกข้อมูลไม่ได้ ผู้ดูแลอาจต้องเปิดใช้ขั้นตอนที่ตรวจสอบสิทธิ์หรือตรวจสอบการมอบหมายของคุณ')}</p>
      <Button variant="outline" onClick={() => void drafts.refetch()}>{text('Retry', 'Повторить', 'ลองอีกครั้ง')}</Button>
    </div>}
    {!drafts.isLoading && !drafts.error && !drafts.data?.length && <p>{text('No drafts available in this scope.', 'В этой области нет доступных черновиков.', 'ไม่มีฉบับร่างที่เข้าถึงได้ในพื้นที่นี้')}</p>}
    {!drafts.error && drafts.data?.map(property => {
      const status = property.approval_status;
      const statusText = status === 'draft' ? text('Draft', 'Черновик', 'ฉบับร่าง') : status === 'pending' ? text('Awaiting review', 'На проверке', 'รอตรวจสอบ') : status === 'rejected' ? text('Returned for changes', 'Возвращён на доработку', 'ส่งกลับเพื่อแก้ไข') : status === 'approved' ? text('Approved', 'Одобрен', 'อนุมัติแล้ว') : text('Status unavailable', 'Статус неизвестен', 'ไม่ทราบสถานะ');
      return <div key={property.id} className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
        <div className="min-w-0"><p className="break-words font-medium">{language === 'ru' ? (property.title_ru || property.title_en) : (property.title_en || property.title_ru)}</p><p className="text-sm text-muted-foreground">{statusText}</p></div>
        <Button asChild variant="outline"><Link to={`/mc/properties/${property.id}/editor`}>{text('Open', 'Открыть', 'เปิด')}</Link></Button>
      </div>;
    })}
    {!drafts.error && (offset > 0 || drafts.data?.length === 50) && <div className="flex gap-2">
      <Button variant="outline" disabled={offset === 0 || drafts.isFetching} onClick={() => setOffset(value => Math.max(0, value - 50))}>{text('Previous', 'Назад', 'ก่อนหน้า')}</Button>
      <Button variant="outline" disabled={drafts.data?.length !== 50 || drafts.isFetching} onClick={() => setOffset(value => value + 50)}>{text('Next', 'Далее', 'ถัดไป')}</Button>
    </div>}
  </section>;
}
