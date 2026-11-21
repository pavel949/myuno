import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';

function exactUuid(value: unknown): string | null {
  return typeof value === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

export function BuyerRequestSummary({ metadata, detailOpen }: {
  metadata: Record<string, unknown> | null;
  detailOpen: boolean;
}) {
  if (metadata?.request_only !== true || typeof metadata.project_id !== 'string') return null;
  return <NewbuildRequestContext metadata={metadata} projectReference={metadata.project_id} detailOpen={detailOpen} />;
}

function NewbuildRequestContext({ metadata, projectReference, detailOpen }: {
  metadata: Record<string, unknown>;
  projectReference: string;
  detailOpen: boolean;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const projectId = exactUuid(projectReference);
  const unitId = exactUuid(metadata.unit_id);
  const propertyId = exactUuid(metadata.property_id);

  // This summary is rendered only in an admitted admin details view. Keep
  // catalogue reads minimum-field, actor-scoped, and subject to database RLS.
  const enabled = detailOpen && !!user?.id && !!projectId;
  const project = useQuery({
    queryKey: ['admin-newbuild-request-project', user?.id, projectId],
    enabled,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!projectId) return null;
      const { data, error } = await supabase.from('property_projects')
        .select('id,name_en,name_ru').eq('id', projectId).abortSignal(signal).maybeSingle();
      if (error) throw error;
      return data?.id === projectId ? data : null;
    },
  });
  const unitEnabled = enabled && !!project.data && !project.isError && !!unitId && !!propertyId;
  const apartment = useQuery({
    queryKey: ['admin-newbuild-request-apartment', user?.id, projectId, unitId, propertyId],
    enabled: unitEnabled,
    gcTime: 0,
    retry: false,
    queryFn: async ({ signal }) => {
      if (!projectId || !unitId || !propertyId) return null;
      const { data, error } = await supabase.from('project_units')
        .select('id,project_id,unit_code,property_id,properties!project_units_property_id_fkey(id,project_id,unit_number)')
        .eq('id', unitId).eq('project_id', projectId).eq('property_id', propertyId)
        .eq('properties.project_id', projectId).abortSignal(signal).maybeSingle();
      if (error) throw error;
      if (data?.id !== unitId || data.project_id !== projectId || data.property_id !== propertyId
        || data.properties?.id !== propertyId || data.properties.project_id !== projectId) return null;
      const physicalNumber = data.properties.unit_number?.trim();
      const catalogueCode = data.unit_code?.trim();
      // Never silently substitute a different identifier or remove leading zeros.
      return physicalNumber && catalogueCode && physicalNumber.toLowerCase() === catalogueCode.toLowerCase()
        ? physicalNumber
        : null;
    },
  });

  const intents = new Map([
    ['documents', t('Документы', 'Documents', 'เอกสาร')],
    ['viewing', t('Просмотр', 'Viewing', 'นัดชม')],
    ['reserve_request', t('Запрос резерва', 'Reservation request', 'คำขอจอง')],
    ['consultation', t('Консультация', 'Consultation', 'ปรึกษา')],
  ]);
  const projectName = enabled && !project.isError
    ? (language === 'ru' ? project.data?.name_ru?.trim() || project.data?.name_en?.trim() : project.data?.name_en?.trim() || project.data?.name_ru?.trim())
    : null;
  const exactNumber = unitEnabled && !apartment.isError ? apartment.data : null;

  return <section className="border p-3 space-y-2 break-words" aria-label={t('Заявка по новостройке', 'Newbuild enquiry', 'คำขอโครงการใหม่')}>
    <p>{t('Намерение', 'Intent', 'ความต้องการ')}: {intents.get(String(metadata.intent)) || t('Уточнить', 'Clarify', 'รอยืนยัน')}</p>
    <p>{t('Проект в заявке', 'Project in request', 'โครงการในคำขอ')}: {projectId
      ? <Link className="underline" to={APP_ROUTES.OFFPLAN_DETAIL(projectId)}>{projectName || projectReference}</Link>
      : projectReference}</p>
    {exactNumber && <p>{t('Номер объекта в заявке', 'Unit number in request', 'หมายเลขยูนิตในคำขอ')}: <strong>{exactNumber}</strong></p>}
    {enabled && (project.isLoading || (unitEnabled && apartment.isLoading)) && <p role="status" className="text-sm text-muted-foreground">
      {t('Сверяем данные с каталогом…', 'Checking against the catalogue…', 'กำลังตรวจสอบกับแค็ตตาล็อก…')}
    </p>}
    {enabled && !project.isLoading && !apartment.isLoading && (!projectName || (typeof metadata.unit_id === 'string' && !exactNumber)) &&
      <p className="text-sm text-muted-foreground">{t('Часть данных не удалось сверить. Ниже сохранены исходные идентификаторы.', 'Some details could not be verified. The original references are kept below.', 'ตรวจสอบรายละเอียดบางส่วนไม่ได้ รหัสเดิมยังแสดงด้านล่าง')}</p>}
    {projectName && <p className="text-sm text-muted-foreground">{t('UUID проекта', 'Project UUID', 'UUID โครงการ')}: {projectReference}</p>}
    {typeof metadata.unit_id === 'string' && <p className="text-sm text-muted-foreground">{t('Строка каталога', 'Catalogue unit', 'รายการยูนิต')}: {metadata.unit_id}</p>}
    {typeof metadata.property_id === 'string' && <p className="text-sm text-muted-foreground">{t('UUID недвижимости', 'Physical property UUID', 'UUID อสังหาริมทรัพย์')}: {metadata.property_id}</p>}
    <p className="text-sm text-muted-foreground">{t('Только запрос. Резерв и оплата не подтверждены.', 'Request only. Reservation and payment are not confirmed.', 'คำขอเท่านั้น ยังไม่ยืนยันการจองและการชำระเงิน')}</p>
  </section>;
}
