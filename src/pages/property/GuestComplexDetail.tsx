import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, Building2, MapPin, Play, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProject } from '@/hooks/usePropertyProjects';
import { usePropertiesByProject } from '@/hooks/useProperties';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyDetailGallery } from '@/components/property/detail/PropertyDetailGallery';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import { PropertyAttributeChip } from '@/components/property/PropertyAttributeChip';
import { getProjectFacilityLabel } from '@/lib/propertyAttributeRegistry';
import { complexMediaUrl, complexVideoSource } from '@/lib/real-estate/complexMedia';
import { APP_ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';

export default function GuestComplexDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const mode = params.get('mode') === 'buy' ? 'buy' : 'rent';
  const managementCompanyId = params.get('managementCompanyId') || undefined;
  const [limit, setLimit] = useState(24);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playVideo, setPlayVideo] = useState(false);
  const projectQuery = usePropertyProject(id, true);
  const rentQuery = usePropertiesByProject(projectQuery.data?.id, mode === 'rent' ? limit : 1, { mode: 'rent', managementCompanyId });
  const saleQuery = usePropertiesByProject(projectQuery.data?.id, mode === 'buy' ? limit : 1, { mode: 'buy', managementCompanyId });
  const unitsQuery = mode === 'rent' ? rentQuery : saleQuery;
  const companiesQuery = useManagementCompanies();
  const project = projectQuery.data;
  const companies = companiesQuery.data || [];
  const operator = managementCompanyId ? companies.find(c => c.id === managementCompanyId) : undefined;
  const companyName = (c: typeof companies[number]) => isRu ? c.name_ru || c.name_en : c.name_en || c.name_ru;
  const catalogHref = `${APP_ROUTES.PROPERTY_BROWSE}?mode=${mode}`;
  const back = <Link to={catalogHref} className="inline-flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" />{isRu ? 'Каталог недвижимости' : 'Property catalog'}</Link>;

  if (projectQuery.isLoading) return <div className="max-w-7xl mx-auto px-5 py-12" role="status"><div className="h-[55vh] bg-muted animate-pulse" /><p className="mt-4">{isRu ? 'Загружаем комплекс…' : 'Loading complex…'}</p></div>;
  if (projectQuery.isError) return <div className="max-w-7xl mx-auto px-5 py-12 space-y-5" role="alert">{back}<p>{isRu ? 'Не удалось загрузить комплекс.' : 'Could not load this complex.'}</p><Button onClick={() => projectQuery.refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div>;
  if (!project) return <div className="max-w-7xl mx-auto px-5 py-12 space-y-5">{back}<h1 className="text-2xl">{isRu ? 'Комплекс не найден' : 'Complex not found'}</h1></div>;

  const name = (isRu ? project.name_ru || project.name_en : project.name_en || project.name_ru) || (isRu ? 'Жилой комплекс' : 'Residential complex');
  const description = isRu ? project.description_ru || project.description_en : project.description_en || project.description_ru;
  const photos = [...new Set([project.cover_image, ...(project.images || [])].map(complexMediaUrl).filter((url): url is string => Boolean(url)))];
  const video = complexVideoSource(project.video_url);
  const units = unitsQuery.data?.properties || [];

  return <>
    <SEOHead title={`${name} — myUNO`} description={description || name} />
    <section className="relative isolate min-h-[520px] h-[72svh] max-h-[820px] overflow-hidden bg-foreground text-background">
      {photos[0] ? <img src={photos[0]} alt={name} loading="eager" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-foreground via-foreground/90 to-primary/50"><Building2 className="h-32 w-32 opacity-10" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
      <div className="relative flex h-full min-h-[520px] max-w-7xl mx-auto flex-col justify-between px-5 sm:px-8 py-7 sm:py-10 text-white">
        <div>{back}</div>
        <div className="max-w-4xl pb-6 sm:pb-10">
          <p className="mb-5 text-xs uppercase tracking-[0.24em] text-white/80">{isRu ? 'Место для жизни' : 'A place to call home'}</p>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl tracking-tight font-medium leading-[1.05] break-words">{name}</h1>
          {(project.district || project.address) && <p className="mt-5 flex items-start gap-2 text-sm sm:text-base text-white/85"><MapPin className="h-4 w-4 mt-1 shrink-0" />{project.address || project.district}</p>}
          <div className="flex flex-wrap gap-3 mt-8">
            <Button asChild className="bg-white text-black hover:bg-white/90"><a href="#complex-units">{isRu ? 'Выбрать квартиру' : 'Explore homes'}<ArrowDown className="h-4 w-4 ml-2" /></a></Button>
            {video && <Button asChild variant="outline" className="bg-black/20 border-white/50 text-white hover:bg-white/15 hover:text-white"><a href="#complex-video"><Play className="h-4 w-4 mr-2" />{isRu ? 'Посмотреть видео' : 'Watch the film'}</a></Button>}
          </div>
        </div>
      </div>
    </section>

    <main className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-20 space-y-16 sm:space-y-24 pb-28">
      <section className="grid lg:grid-cols-[1fr_2fr] gap-7 lg:gap-16">
        <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{isRu ? 'Знакомство' : 'Discover'}</p><h2 className="text-3xl sm:text-4xl tracking-tight">{isRu ? 'О комплексе' : 'Life at the complex'}</h2></div>
        <div className="space-y-8">
          <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-muted-foreground">{description || (isRu ? 'Описание комплекса пока не добавлено.' : 'A description of this complex has not been added yet.')}</p>
          {!!project.amenities?.length && <div><h3 className="text-lg font-medium mb-4">{isRu ? 'Удобства на территории' : 'Around the grounds'}</h3><div className="flex flex-wrap gap-2">{project.amenities.map(amenity => <PropertyAttributeChip key={amenity} icon={amenity === 'pool' ? <Waves className="h-4 w-4" /> : <Building2 className="h-4 w-4" />} className="px-4 py-3"><span>{getProjectFacilityLabel(amenity, isRu ? 'ru' : 'en')}</span></PropertyAttributeChip>)}</div></div>}
        </div>
      </section>

      {photos.length > 0 && <section aria-labelledby="complex-gallery"><div className="flex items-end justify-between mb-6"><h2 id="complex-gallery" className="text-3xl sm:text-4xl tracking-tight">{isRu ? 'Взгляд изнутри' : 'A closer look'}</h2><span className="text-sm text-muted-foreground">{photos.length} {isRu ? 'фото' : 'photos'}</span></div><PropertyDetailGallery images={photos} alt={name} onOpenLightbox={setLightbox} /></section>}
      {photos.length === 0 && <p className="text-muted-foreground">{isRu ? 'Фотографии комплекса пока не добавлены.' : 'Photos of this complex have not been added yet.'}</p>}

      {video && <section id="complex-video" className="scroll-mt-24" aria-labelledby="complex-video-title"><h2 id="complex-video-title" className="text-3xl sm:text-4xl tracking-tight mb-6">{isRu ? 'Почувствуйте атмосферу' : 'Get a feel for the place'}</h2>
        {video.kind === 'link' ? <Button asChild variant="outline"><a href={video.url} target="_blank" rel="noopener noreferrer"><Play className="h-4 w-4 mr-2" />{isRu ? 'Открыть видео комплекса' : 'Open complex video'}</a></Button> :
          <div className="relative aspect-video bg-foreground overflow-hidden">
            {!playVideo ? <button onClick={() => setPlayVideo(true)} className="absolute inset-0 flex items-center justify-center group" aria-label={isRu ? 'Воспроизвести видео' : 'Play video'}>{photos[0] && <img src={photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}<span className="relative rounded-full bg-white text-black p-6 group-hover:scale-105 transition-transform"><Play className="h-8 w-8" /></span></button> : video.kind === 'file' ? <video aria-label={`${name} — ${isRu ? 'Видео' : 'Video'}`} src={video.url} controls playsInline preload="metadata" poster={photos[0]} className="w-full h-full" /> : <iframe src={video.url} title={`${name} — ${isRu ? 'Видео' : 'Video'}`} className="w-full h-full" allow="fullscreen; picture-in-picture" allowFullScreen />}
          </div>}
      </section>}

      <section id="complex-units" className="scroll-mt-24" aria-labelledby="complex-units-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8"><div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{isRu ? 'Найдите своё пространство' : 'Find your space'}</p><h2 id="complex-units-title" className="text-3xl sm:text-4xl tracking-tight">{mode === 'rent' ? (isRu ? 'Жильё в аренду' : 'Homes to rent') : (isRu ? 'Жильё на продажу' : 'Homes for sale')}</h2>{operator && <p className="mt-3 text-muted-foreground">{isRu ? 'Управляющая компания: ' : 'Managed by: '}{companyName(operator)}</p>}</div>
          <div className="flex gap-2" aria-label={isRu ? 'Тип предложения' : 'Listing type'}>{(['rent', 'buy'] as const).map(value => <Button key={value} variant={mode === value ? 'default' : 'outline'} aria-pressed={mode === value} onClick={() => { setLimit(24); setParams(previous => { const next = new URLSearchParams(previous); next.set('mode', value); return next; }, { replace: true }); }}>{value === 'rent' ? (isRu ? 'Аренда' : 'Rent') : (isRu ? 'Покупка' : 'Buy')} <span className="ml-2 tabular-nums">{(value === 'rent' ? rentQuery : saleQuery).isSuccess ? (value === 'rent' ? rentQuery : saleQuery).data?.total : '…'}</span></Button>)}</div>
        </div>
        {unitsQuery.isLoading ? <div role="status" className="py-12 text-muted-foreground">{isRu ? 'Загружаем предложения…' : 'Loading homes…'}</div> : unitsQuery.isError ? <div role="alert" className="border p-8 space-y-4"><p>{isRu ? 'Не удалось загрузить предложения.' : 'Could not load homes.'}</p><Button variant="outline" onClick={() => unitsQuery.refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button></div> : units.length === 0 ? <div className="border border-dashed p-8 sm:p-12 text-center space-y-4"><Building2 className="h-8 w-8 mx-auto text-muted-foreground" /><p>{isRu ? 'По выбранным условиям пока нет опубликованных предложений.' : 'No published homes match these choices yet.'}</p><Button asChild variant="outline"><Link to={catalogHref}>{isRu ? 'Посмотреть другие варианты' : 'Explore other homes'}</Link></Button></div> : <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">{units.map(property => { const company = companies.find(c => c.id === property.management_company_id); return <div key={property.id}><PropertyListingCard property={property} mode={mode} companyName={company ? companyName(company) : undefined} companySlug={company?.slug} />{company && !company.slug && <p className="mt-2 text-sm text-muted-foreground">{isRu ? 'Управляет: ' : 'Managed by: '}{companyName(company)}</p>}</div>; })}</div>{units.length < (unitsQuery.data?.total ?? 0) && <Button variant="outline" className="mt-8" onClick={() => setLimit(limit + 24)}>{isRu ? 'Показать ещё' : 'Show more'}</Button>}</>}
      </section>
    </main>
    <PhotoLightbox images={photos} initialIndex={lightbox ?? 0} open={lightbox !== null} onClose={() => setLightbox(null)} alts={photos.map(() => name)} />
  </>;
}
