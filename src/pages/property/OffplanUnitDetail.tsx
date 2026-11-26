import { useState } from 'react';
import { ArrowLeft, ExternalLink, FileQuestion, MapPin, MessageCircle, TriangleAlert } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { OffplanBuyerEnquiry } from '@/components/newbuilds/OffplanBuyerEnquiry';
import { PageState } from '@/components/page/PageState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ContentSkeleton } from '@/components/ui/ContentSkeleton';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeveloper } from '@/hooks/useDevelopers';
import { useOffplanProject } from '@/hooks/useOffplanProjects';
import { usePublicProjectUnit } from '@/hooks/useProjectUnits';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { projectPublicDocumentUrl } from '@/lib/real-estate/projectPublicDocumentUrl';

export default function OffplanUnitDetail() {
  const { id, unitId } = useParams<{ id: string; unitId: string }>();
  const location = useLocation();
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [enquiryUnitId, setEnquiryUnitId] = useState<string | null>(null);
  const [failedPlan, setFailedPlan] = useState<string | null>(null);
  const projectQuery = useOffplanProject(id);
  const project = projectQuery.data;
  const unitQuery = usePublicProjectUnit(project?.id, unitId);
  const unit = unitQuery.data;
  const { data: developer } = useDeveloper(project?.developerId || '');

  const back = (
    <Button variant="outline" className="self-start" asChild>
      <Link
        to={project ? { pathname: APP_ROUTES.OFFPLAN_DETAIL(project.id), search: location.search, hash: '#project-units' } : APP_ROUTES.OFFPLAN}
        state={location.state}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {project
          ? t('К юнитам проекта', 'Back to project units', 'กลับไปยังยูนิตของโครงการ')
          : t('К новостройкам', 'Browse new developments', 'ดูโครงการใหม่')}
      </Link>
    </Button>
  );

  if (projectQuery.isLoading || (project && unitQuery.isLoading)) {
    return (
      <div className="ds-frame ds-frame-detail ds-page" role="status">
        <span className="sr-only">{t('Загружаем юнит', 'Loading unit', 'กำลังโหลดยูนิต')}</span>
        <div aria-hidden="true"><ContentSkeleton variant="card" count={2} /></div>
      </div>
    );
  }

  if (projectQuery.isError || unitQuery.isError) {
    const retry = projectQuery.isError ? projectQuery.refetch : unitQuery.refetch;
    return (
      <PageState
        heading="h1"
        icon={TriangleAlert}
        tone="warning"
        announcement="alert"
        title={t('Не удалось загрузить юнит', 'Unit could not be loaded', 'ไม่สามารถโหลดยูนิตได้')}
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void retry()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button>
          {back}
        </div>
      </PageState>
    );
  }

  if (!project || !unit) {
    return (
      <PageState
        heading="h1"
        icon={FileQuestion}
        title={t('Юнит не найден', 'Unit could not be found', 'ไม่พบยูนิต')}
      >
        {back}
      </PageState>
    );
  }

  const projectName = (language === 'ru' && project.nameRu) || project.nameEn;
  const title = (language === 'ru' && unit.name_ru) || unit.name;
  const askAboutUnit = t('Запросить информацию о юните', 'Ask about this unit', 'สอบถามยูนิตนี้');
  const floorLabel = unit.floor_from === unit.floor_to
    ? unit.floor_from
    : [unit.floor_from, unit.floor_to].filter((floor) => floor != null).join('–');
  const facts = [
    { label: t('Площадь', 'Area', 'พื้นที่'), value: Number.isFinite(unit.area_sqm) && unit.area_sqm > 0 ? `${unit.area_sqm} m²` : null },
    { label: t('Спальни', 'Bedrooms', 'ห้องนอน'), value: unit.bedrooms },
    { label: t('Ванные', 'Bathrooms', 'ห้องน้ำ'), value: unit.bathrooms },
    { label: t('Этаж', 'Floor', 'ชั้น'), value: floorLabel },
  ].filter(({ value }) => value != null && value !== '');
  const planUrl = projectPublicDocumentUrl(unit.floor_plan_url);
  const showPlanImage = planUrl && /\.(?:avif|gif|jpe?g|png|webp)(?:\?|$)/i.test(planUrl) && failedPlan !== planUrl;
  const developerName = developer && ((language === 'ru' && developer.nameRu) || developer.nameEn);

  return (
    <div className="ds-frame ds-frame-detail ds-page ds-page-with-navigation purchase-detail-grid">
      <header className="purchase-detail-intro min-w-0 space-y-3">
        {back}
        <p className="text-body-sm text-muted-foreground">{projectName}</p>
        <h1 className="text-h2 font-display">{title}</h1>
        {project.district && (
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            {project.district}
          </p>
        )}
        {facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map(({ label, value }) => (
              <div key={label} className="rounded-[var(--bible-radius-card)] border border-border bg-card p-3">
                <dt className="text-body-sm text-muted-foreground">{label}</dt>
                <dd className="font-display text-h4 tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <aside className="purchase-detail-actions" aria-labelledby="offplan-unit-price">
        <Card>
          <CardHeader>
            <h2 id="offplan-unit-price" className="text-body-sm text-muted-foreground">{t('Цена юнита', 'Unit price', 'ราคายูนิต')}</h2>
            <p className="text-h4 font-display">{t('Цена уточняется', 'Price to be confirmed', 'อยู่ระหว่างยืนยันราคา')}</p>
          </CardHeader>
          <CardContent>
            <Button type="button" className="w-full" onClick={() => setEnquiryUnitId(unit.id)}>
              <MessageCircle className="size-4" aria-hidden="true" />
              {askAboutUnit}
            </Button>
          </CardContent>
        </Card>
      </aside>

      <div className="purchase-detail-facts min-w-0 space-y-5">
        <Card>
          <CardHeader><h2 className="text-h4 font-display">{t('Планировка', 'Floor plan', 'แปลนห้อง')}</h2></CardHeader>
          <CardContent className="space-y-3">
            {showPlanImage && (
              <img
                src={planUrl}
                alt={t('Планировка юнита', 'Unit floor plan', 'แปลนยูนิต')}
                className="max-h-96 w-full rounded-[var(--bible-radius-media)] object-contain"
                loading="lazy"
                onError={() => setFailedPlan(planUrl)}
              />
            )}
            {planUrl ? (
              <Button variant="outline" asChild>
                <a href={planUrl} target="_blank" rel="noopener noreferrer">
                  {t('Открыть план в новой вкладке', 'Open plan in a new tab', 'เปิดแปลนในแท็บใหม่')}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <p className="text-body-sm text-muted-foreground">
                {t('Планировка этого юнита пока не опубликована.', 'This unit’s floor plan has yet to be published.', 'ยังไม่มีการเผยแพร่แปลนของยูนิตนี้')}
              </p>
            )}
          </CardContent>
        </Card>
        {developer && developerName && (
          <Card>
            <CardHeader><h2 className="text-h4 font-display">{t('Застройщик', 'Developer', 'ผู้พัฒนาโครงการ')}</h2></CardHeader>
            <CardContent>
              <Button variant="link" className="px-0" asChild>
                <Link to={APP_ROUTES.DEVELOPER_DETAIL(developer.id)} state={location.state}>{developerName}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ResponsiveModal
        open={enquiryUnitId === unit.id}
        onOpenChange={(open) => setEnquiryUnitId(open ? unit.id : null)}
        title={askAboutUnit}
        description={title}
        size="md"
      >
        <OffplanBuyerEnquiry projectId={project.id} unit={unit} />
      </ResponsiveModal>
    </div>
  );
}
