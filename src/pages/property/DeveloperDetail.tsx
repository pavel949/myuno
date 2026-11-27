import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Building2, Calendar, CheckCircle2, Globe, Mail, Phone, Star } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeveloper } from '@/hooks/useDevelopers';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import { publicJourneyReturn } from '@/lib/real-estate/publicJourney';
import { MyunoScoreWidget } from '@/components/invest/MyunoScoreWidget';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';
import { SEOHead, createBreadcrumbSchema } from '@/components/seo';

function catalogueDeliverySource(date: string | null, source: string | null) {
  if (!date || !source || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  try {
    const calendarDate = new Date(date + 'T00:00:00Z');
    if (calendarDate.toISOString().slice(0, 10) !== date) return null;
    const url = new URL(source);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return { calendarDate, source: url.href };
  } catch {
    return null;
  }
}

export default function DeveloperDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const returnToCatalogue = () => {
    const plan = publicJourneyReturn(location, APP_ROUTES.DEVELOPERS);
    if ('delta' in plan) navigate(plan.delta);
    else navigate(plan.href, { replace: plan.replace, state: plan.state });
  };
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const label = (en: string, ru: string, th: string) => isRu ? ru : language === 'th' ? th : en;

  const { data: developer, isLoading, isError, refetch } = useDeveloper(id || '');
  const projects = useOffplanProjects({ developerId: id });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl space-y-4 px-[var(--page-padding-x)] py-6" aria-busy="true">
        <BackButton fallbackPath={APP_ROUTES.DEVELOPERS} onClick={returnToCatalogue} />
        <span role="status" className="sr-only">{label('Loading developer profile', 'Загрузка профиля застройщика', 'กำลังโหลดโปรไฟล์ผู้พัฒนา')}</span>
        <Skeleton className="h-24 rounded-none" />
        <Skeleton className="h-40 rounded-none" />
        <Skeleton className="h-60 rounded-none" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Building2 className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
        <p>{label('Developer profile could not be loaded', 'Не удалось загрузить профиль застройщика', 'โหลดโปรไฟล์ผู้พัฒนาไม่สำเร็จ')}</p>
        <Button variant="outline" onClick={() => refetch()}>{label('Try again', 'Повторить', 'ลองอีกครั้ง')}</Button>
        <Button variant="link" onClick={returnToCatalogue}>{label('Back to list', 'Вернуться к списку', 'กลับไปที่รายการ')}</Button>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" aria-hidden="true" />
        <p className="text-muted-foreground">
          {label('Developer not found', 'Застройщик не найден', 'ไม่พบผู้พัฒนา')}
        </p>
        <Button variant="link" onClick={returnToCatalogue}>
          {label('Back to list', 'Вернуться к списку', 'กลับไปที่รายการ')}
        </Button>
      </div>
    );
  }

  const name = isRu ? developer.nameRu || developer.nameEn : developer.nameEn || developer.nameRu;
  const description = isRu ? developer.descriptionRu || developer.descriptionEn : developer.descriptionEn || developer.descriptionRu;
  const seoTitle = `${name} · ${label('Developer', 'Застройщик', 'ผู้พัฒนา')} · Phuket`;
  const seoDescription = description
    || (isRu
      ? `${name} — застройщик Пхукета. ${developer.projectsCompleted} проектов, ${developer.totalUnitsSold} объектов продано.${developer.foundedYear ? ` Основано в ${developer.foundedYear}.` : ''}`
      : `${name} — Phuket developer. ${developer.projectsCompleted} projects, ${developer.totalUnitsSold} units sold.${developer.foundedYear ? ` Founded ${developer.foundedYear}.` : ''}`);
  const canonicalUrl = `https://www.myuno.app${APP_ROUTES.DEVELOPER_DETAIL(developer.id)}`;
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    description: seoDescription,
    url: canonicalUrl,
    ...(developer.logoUrl && { logo: developer.logoUrl }),
    ...(developer.foundedYear && { foundingDate: String(developer.foundedYear) }),
    ...(developer.website && { sameAs: [developer.website] }),
  };
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://www.myuno.app/property' },
    { name: isRu ? 'Застройщики' : 'Developers', url: 'https://www.myuno.app/property/developers' },
    { name, url: canonicalUrl },
  ]);
  const projectList = projects.data ?? [];
  const hasContact = Boolean(developer.website || developer.phone || developer.email);
  const deliveryDates = projectList.flatMap(project => {
    const evidence = catalogueDeliverySource(project.completionDate, project.sourceUrl);
    return evidence ? [{ project, ...evidence }] : [];
  }).sort((a, b) => b.calendarDate.getTime() - a.calendarDate.getTime());
  const readableDate = new Intl.DateTimeFormat(isRu ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'long', timeZone: 'UTC',
  });

  return (
    <div className="mx-auto max-w-screen-xl space-y-6 px-[var(--page-padding-x)] pb-24 pt-6">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={developer.logoUrl || 'https://www.myuno.app/og-image.png'}
        url={canonicalUrl}
        jsonLd={{ '@context': 'https://schema.org', '@graph': [orgSchema, breadcrumbSchema] }}
      />
      <BackButton onClick={returnToCatalogue} fallbackPath={APP_ROUTES.DEVELOPERS} />
      <header className="space-y-6 border border-border border-t-4 border-t-primary bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-4">
            {developer.logoUrl ? (
              <img
                src={developer.logoUrl}
                alt=""
                width={80}
                height={80}
                decoding="async"
                className="h-20 w-20 shrink-0 border border-border bg-muted object-contain"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-border bg-muted">
                <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
              </div>
            )}

            <div className="min-w-0 flex-1 basis-40 space-y-2">
              <h1 className="break-words font-semibold">{name}</h1>
              {developer.isVerified && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {label('Verified developer', 'Проверенный застройщик', 'ผู้พัฒนาได้รับการตรวจสอบแล้ว')}
                </Badge>
              )}
              {developer.foundedYear && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {label('Founded', 'Год основания', 'ก่อตั้งเมื่อปี')} {developer.foundedYear}
                </p>
              )}
            </div>

            {developer.muunoScore && (
              <MyunoScoreWidget score={developer.muunoScore} size="md" />
            )}
          </div>
        <dl className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="flex flex-col-reverse gap-1 border border-border p-2 sm:p-3">
            <dt className="break-words text-sm text-muted-foreground">{label('Completed projects reported in profile', 'Завершено по данным профиля', 'โครงการที่ระบุว่าเสร็จแล้วในโปรไฟล์')}</dt>
            <dd className="font-semibold tabular-nums">{developer.projectsCompleted}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1 border border-border p-2 sm:p-3">
            <dt className="text-sm text-muted-foreground">{label('Units sold', 'Продано объектов', 'ยูนิตที่ขายแล้ว')}</dt>
            <dd className="font-semibold tabular-nums">{developer.totalUnitsSold}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1 border border-border p-2 sm:p-3">
            <dt className="text-sm text-muted-foreground">{label('Rating', 'Рейтинг', 'คะแนน')}</dt>
            <dd className="inline-flex items-center gap-1 font-semibold tabular-nums">
              {developer.averageRating > 0 ? (
                <>
                  <Star className="w-5 h-5 fill-primary text-primary" aria-hidden />
                  {developer.averageRating.toFixed(1)}
                </>
              ) : '—'}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {description && (
          <section className="space-y-2 lg:col-span-2" aria-labelledby="developer-about">
            <h2 id="developer-about" className="font-semibold">{label('About', 'О компании', 'เกี่ยวกับบริษัท')}</h2>
            <p className="whitespace-pre-line text-muted-foreground">{description}</p>
          </section>
        )}

        {hasContact && <section className="space-y-2" aria-labelledby="developer-contact">
          <h2 id="developer-contact" className="font-semibold">{label('Contact', 'Контакты', 'ติดต่อ')}</h2>
          {developer.website && (
            <a
              href={developer.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={isRu ? `Сайт ${name}` : `${name} website`}
              className="flex min-h-11 items-center gap-2 break-all text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
              {developer.website}
            </a>
          )}
          {developer.phone && (
            <a
              href={`tel:${developer.phone}`}
              aria-label={isRu ? `Позвонить ${name}` : `Call ${name}`}
              className="flex min-h-11 items-center gap-2 break-all text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              {developer.phone}
            </a>
          )}
          {developer.email && (
            <a
              href={`mailto:${developer.email}`}
              aria-label={isRu ? `Написать ${name}` : `Email ${name}`}
              className="flex min-h-11 items-center gap-2 break-all text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              {developer.email}
            </a>
          )}
        </section>}
      </div>
      {!projects.isLoading && !projects.isError && deliveryDates.length > 0 && (
        <section className="space-y-3 border border-border bg-card p-4 sm:p-6" aria-labelledby="developer-delivery">
          <h2 id="developer-delivery" className="font-semibold">{label('Project delivery dates', 'Сроки сдачи проектов', 'กำหนดส่งมอบโครงการ')}</h2>
          <p className="text-sm text-muted-foreground">{label('Dates as listed in the catalogue, with links to the source.', 'Даты из каталога. Источник указан рядом с каждой датой.', 'วันที่ตามแค็ตตาล็อกพร้อมลิงก์ไปยังแหล่งข้อมูล')}</p>
          <ul className="divide-y divide-border">
            {deliveryDates.map(({ project, calendarDate, source }) => (
              <li key={project.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0">
                  <p className="break-words font-medium">{isRu ? project.nameRu || project.nameEn : project.nameEn || project.nameRu}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.projectStatus === 'completed'
                      ? label('Listed as completed', 'В каталоге отмечен как завершённый', 'ระบุว่าเสร็จแล้วในแค็ตตาล็อก')
                      : label('Catalogue date', 'Дата по каталогу', 'วันที่ตามแค็ตตาล็อก')}
                    {' · '}<time dateTime={project.completionDate ?? undefined}>{readableDate.format(calendarDate)}</time>
                  </p>
                </div>
                <a href={source} target="_blank" rel="noopener noreferrer" className="ds-focus inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4">
                  {label('Open source', 'Открыть источник', 'เปิดแหล่งข้อมูล')}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="space-y-3" aria-labelledby="developer-projects" aria-busy={projects.isLoading}>
        <h2 id="developer-projects" className="font-semibold">
          {label('Published projects', 'Опубликованные проекты', 'โครงการที่เผยแพร่')}
        </h2>
        {projects.isLoading && (
          <div role="status">
            <span className="sr-only">{label('Loading projects', 'Загрузка проектов', 'กำลังโหลดโครงการ')}</span>
            <Skeleton className="h-40" />
          </div>
        )}
        {projects.isError && (
          <div role="alert" className="space-y-2 border border-border bg-card p-4">
            <p>{label('Projects could not be loaded', 'Не удалось загрузить проекты', 'โหลดโครงการไม่สำเร็จ')}</p>
            <Button variant="outline" onClick={() => projects.refetch()}>
              {label('Try again', 'Повторить', 'ลองอีกครั้ง')}
            </Button>
          </div>
        )}
        {!projects.isLoading && !projects.isError && projectList.length === 0 && (
          <p className="border border-border bg-card p-4 text-muted-foreground">
            {label('No published projects are listed for this developer.', 'У этого застройщика пока нет опубликованных проектов.', 'ยังไม่มีโครงการที่เผยแพร่สำหรับผู้พัฒนารายนี้')}
          </p>
        )}
        {projectList.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectList.map(project => (
              <OffplanProjectCard key={project.id} project={project} variant="grid" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
