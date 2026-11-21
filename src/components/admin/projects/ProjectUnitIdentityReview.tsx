import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { reviewProjectUnitIdentity } from '@/lib/real-estate/projectUnitIdentity';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 50;
const labels = {
  exact: { en: 'Linked · codes match', ru: 'Связан · коды совпадают', th: 'เชื่อมโยงแล้ว · รหัสตรงกัน' },
  unlinked: { en: 'No property link', ru: 'Нет связи с объектом', th: 'ยังไม่เชื่อมโยงกับทรัพย์สิน' },
  unverified: { en: 'Property could not be verified', ru: 'Не удалось проверить объект', th: 'ตรวจสอบทรัพย์สินไม่ได้' },
  'other-project': { en: 'Project does not match', ru: 'Проекты не совпадают', th: 'โครงการไม่ตรงกัน' },
  'check-code': { en: 'Check unit codes', ru: 'Проверьте коды объекта', th: 'ตรวจสอบรหัสยูนิต' },
} satisfies Record<string, LangValues>;

function ProjectUnitIdentityPage({ projectId, actorId }: { projectId: string; actorId: string }) {
  const { language } = useLanguage();
  const t = (values: LangValues) => pickLang(language, values);
  const [page, setPage] = useState(0);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['admin-project-unit-identity', actorId, projectId, page],
    gcTime: 0,
    queryFn: async ({ signal }) => {
      const start = page * PAGE_SIZE;
      const result = await supabase.from('project_units')
        .select('id, unit_code, property_id, properties!project_units_property_id_fkey(id, project_id, unit_number)', { count: 'exact' })
        .eq('project_id', projectId)
        .eq('properties.project_id', projectId) // Left embed: keep the sales row, never return another project's property.
        .order('unit_code').order('id').range(start, start + PAGE_SIZE - 1).abortSignal(signal);
      if (result.error) throw result.error;
      return { rows: result.data, count: result.count };
    },
  });

  if (isPending) return <p role="status">{t({ en: 'Checking catalogue links…', ru: 'Проверяем связи в каталоге…', th: 'กำลังตรวจสอบการเชื่อมโยงในแค็ตตาล็อก…' })}</p>;
  if (isError) return <div role="alert" className="space-y-2">
    <p>{t({ en: 'Could not check catalogue links.', ru: 'Не удалось проверить связи в каталоге.', th: 'ตรวจสอบการเชื่อมโยงในแค็ตตาล็อกไม่ได้' })}</p>
    <Button type="button" variant="outline" onClick={() => void refetch()}>{t({ en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}</Button>
  </div>;

  const rows = data.rows;
  const next = data.count === null ? rows.length === PAGE_SIZE : (page + 1) * PAGE_SIZE < data.count;
  return <div className="space-y-3">
    {rows.length === 0 ? <p>{t({ en: 'No sales catalogue rows visible on this page.', ru: 'На этой странице нет доступных записей каталога продаж.', th: 'ไม่พบรายการแค็ตตาล็อกการขายที่มองเห็นได้ในหน้านี้' })}</p> :
      <ul className="divide-y divide-border">
        {rows.map(row => {
          const review = reviewProjectUnitIdentity(row, projectId);
          return <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2" key={row.id}>
            <strong>{row.unit_code || '—'}</strong>
            <span>{t(labels[review.status])}</span>
            {review.propertyId && <Link className="underline" to={`${APP_ROUTES.ADMIN_PROPERTIES}?edit=${encodeURIComponent(review.propertyId)}`}>
              {t({ en: 'Open linked property', ru: 'Открыть связанный объект', th: 'เปิดทรัพย์สินที่เชื่อมโยง' })}
            </Link>}
          </li>;
        })}
      </ul>}
    {(page > 0 || next) && <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>{t({ en: 'Previous', ru: 'Назад', th: 'ก่อนหน้า' })}</Button>
      <span aria-live="polite">{page + 1}</span>
      <Button type="button" variant="outline" disabled={!next} onClick={() => setPage(page + 1)}>{t({ en: 'Next', ru: 'Далее', th: 'ถัดไป' })}</Button>
    </div>}
  </div>;
}

export function ProjectUnitIdentityReview({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (values: LangValues) => pickLang(language, values);
  const [open, setOpen] = useState(false);
  if (!user?.id) return null;

  return <details className="space-y-3 border border-border p-3 text-sm" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer content-center font-medium">{t({ en: 'Check sales catalogue links', ru: 'Проверить связи с каталогом продаж', th: 'ตรวจสอบการเชื่อมโยงกับแค็ตตาล็อกการขาย' })}</summary>
    {open && <>
      <p className="text-muted-foreground">{t({ en: 'Each sales row should point to the same physical property. This check does not change listings or verify prices or availability.', ru: 'Запись продажи должна ссылаться на тот же физический объект. Проверка не меняет объявления и не подтверждает цены или наличие.', th: 'แต่ละรายการขายควรอ้างอิงทรัพย์สินจริงรายการเดียวกัน การตรวจสอบนี้ไม่แก้ไขประกาศหรือยืนยันราคาหรือสถานะว่าง' })}</p>
      <ProjectUnitIdentityPage key={`${user.id}:${projectId}`} actorId={user.id} projectId={projectId} />
    </>}
  </details>;
}
