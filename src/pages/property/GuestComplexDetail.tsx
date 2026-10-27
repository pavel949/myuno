import { pickLang } from '@/lib/i18n/pickLang';
import '@/styles/public-commerce.css';
import { useState } from 'react';
import { Link, useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowLeft, Building2, MapPin, Play, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProject } from '@/hooks/usePropertyProjects';
import { usePropertiesByProject } from '@/hooks/useProperties';
import { useManagementCompanies } from '@/hooks/useManagementCompanies';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyDetailGallery } from '@/components/property/detail/PropertyDetailGallery';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import { PropertyAttributeChip } from '@/components/property/PropertyAttributeChip';
import { getProjectFacilityLabel, normalizeProjectFacilityIds, PROJECT_FACILITY_LABELS } from '@/lib/propertyAttributeRegistry';
import { getPropertyTypeLabel } from '@/lib/taxonomies';
import { complexMediaUrl, complexVideoSource } from '@/lib/real-estate/complexMedia';
import { publicJourneyReturn, readPublicJourneyOrigin } from '@/lib/real-estate/publicJourney';
import { propertyCatalogHref } from '@/lib/real-estate/propertyDetailIntent';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';

export default function GuestComplexDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const journeyOrigin = readPublicJourneyOrigin(location.state);
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const mode = params.get('mode') === 'buy' ? 'buy' : 'rent';
  const managementCompanyId = params.get('managementCompanyId') || undefined;
  const propertyType = params.get('propertyType') || undefined;
  const [limit, setLimit] = useState(24);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [playVideo, setPlayVideo] = useState(false);
  const projectQuery = usePropertyProject(id, true);
  const rentQuery = usePropertiesByProject(projectQuery.data?.id, mode === 'rent' ? limit : 1, { mode: 'rent', managementCompanyId, propertyType });
  const saleQuery = usePropertiesByProject(projectQuery.data?.id, mode === 'buy' ? limit : 1, { mode: 'buy', managementCompanyId, propertyType });
  const unitsQuery = mode === 'rent' ? rentQuery : saleQuery;
  const companiesQuery = useManagementCompanies();
  const project = projectQuery.data;
  const companies = companiesQuery.data || [];
  const operator = managementCompanyId ? companies.find(c => c.id === managementCompanyId) : undefined;
  const companyName = (c: typeof companies[number]) => isRu ? c.name_ru || c.name_en : c.name_en || c.name_ru;
  const catalogHref = propertyCatalogHref(mode, params.toString());
  const returnToOrigin = () => { const plan = publicJourneyReturn(location, catalogHref); if ('delta' in plan) navigate(plan.delta); else navigate(plan.href, { replace: plan.replace, state: plan.state }); };
  const back = journeyOrigin ? <button type="button" onClick={returnToOrigin} className="inline-flex min-h-11 items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" />{pickLang(language, {"ru": "Вернуться к объекту", "en": "Back to property", "th": "กลับไปยังที่พัก"})}</button> : <Link to={catalogHref} className="inline-flex min-h-11 items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" />{pickLang(language, {"ru": "Каталог недвижимости", "en": "Property catalog", "th": "รายการที่พัก"})}</Link>;

  if (projectQuery.isLoading) return <div className="public-complex-state py-12" role="status"><div className="h-[55vh] bg-muted animate-pulse" /><p className="mt-4">{pickLang(language, {"ru": "Загружаем комплекс…", "en": "Loading complex…", "th": "กำลังโหลดโครงการ…"})}</p></div>;
  if (projectQuery.isError) return <div className="public-complex-state py-12 space-y-5" role="alert">{back}<p>{pickLang(language, {"ru": "Не удалось загрузить комплекс.", "en": "Could not load this complex.", "th": "ไม่สามารถโหลดโครงการนี้ได้"})}</p><Button onClick={() => projectQuery.refetch()}>{pickLang(language, {"ru": "Повторить", "en": "Retry", "th": "ลองอีกครั้ง"})}</Button></div>;
  if (!project) return <div className="public-complex-state py-12 space-y-5">{back}<h1 className="text-2xl">{pickLang(language, {"ru": "Комплекс не найден", "en": "Complex not found", "th": "ไม่พบโครงการ"})}</h1></div>;

  const name = (isRu ? project.name_ru || project.name_en : project.name_en || project.name_ru) || (pickLang(language, {"ru": "Жилой комплекс", "en": "Residential complex", "th": "โครงการที่พักอาศัย"}));
  const description = isRu ? project.description_ru || project.description_en : project.description_en || project.description_ru;
  const photos = [...new Set([project.cover_image, ...(project.images || [])].map(complexMediaUrl).filter((url): url is string => Boolean(url)))];
  const video = complexVideoSource(project.video_url);
  const units = unitsQuery.data?.properties || [];
  // This mixed legacy array also carries project metadata. Only registered
  // facilities are public amenity claims; unknown values need editorial evidence.
  const facilities = normalizeProjectFacilityIds(project.amenities || [])
    .filter(id => Object.prototype.hasOwnProperty.call(PROJECT_FACILITY_LABELS, id));

  return <div className="public-complex">
    <SEOHead title={name} description={description || name} />
    <section data-testid="complex-hero" className={`relative isolate overflow-hidden bg-foreground text-background ${photos[0] ? 'min-h-[320px]' : 'min-h-[280px]'}`}>
      {photos[0] ? <img src={photos[0]} alt={name} loading="eager" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-foreground via-foreground/90 to-primary/50"><Building2 className="h-32 w-32 opacity-10" /></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40" />
      <div className={`relative flex public-complex-hero-content public-complex-shell mx-auto flex-col justify-between gap-12 py-7 sm:py-10 text-primary-foreground ${photos[0] ? 'min-h-[320px]' : 'min-h-[280px]'}`}>
        <div>{back}</div>
        <div className="max-w-4xl pb-6 sm:pb-10">
          <p className="mb-5 text-xs uppercase tracking-[0.24em] text-white/80">{pickLang(language, {"ru": "Место для жизни", "en": "A place to call home", "th": "พื้นที่ที่เรียกว่าบ้าน"})}</p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl tracking-tight font-medium leading-[1.05] break-words">{name}</h1>
          {(project.district || project.address) && <p className="mt-5 flex items-start gap-2 text-sm sm:text-base text-white/85"><MapPin className="h-4 w-4 mt-1 shrink-0" />{project.address || project.district}</p>}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90" aria-label={pickLang(language, {"ru": "Предложения в комплексе", "en": "Complex offers", "th": "ข้อเสนอในโครงการ"})}>
            {(['rent', 'buy'] as const).map(value => { const query = value === 'rent' ? rentQuery : saleQuery; return <a key={value} href="#complex-units" className="underline underline-offset-4 min-h-11 inline-flex items-center" onClick={() => { setLimit(24); setParams(previous => { const next = new URLSearchParams(previous); next.set('mode', value); return next; }, { replace: true, state: location.state }); }}>{value === 'rent' ? (pickLang(language, {"ru": "Аренда", "en": "Rent", "th": "เช่า"})) : (pickLang(language, {"ru": "Покупка", "en": "Buy", "th": "ซื้อ"}))}: {query.isSuccess ? query.data?.total : '…'}</a>; })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button asChild className="bg-white text-black hover:bg-white/90"><a href="#complex-units">{pickLang(language, {"ru": "Выбрать квартиру", "en": "Explore homes", "th": "ดูที่พัก"})}<ArrowDown className="h-4 w-4 ml-2" /></a></Button>
            {video && <Button asChild variant="outline" className="bg-black/20 border-white/50 text-white hover:bg-white/15 hover:text-white"><a href="#complex-video"><Play className="h-4 w-4 mr-2" />{pickLang(language, {"ru": "Посмотреть видео", "en": "Watch the film", "th": "ชมวิดีโอ"})}</a></Button>}
          </div>
        </div>
      </div>
    </section>

    <div className="public-complex-shell public-complex-content mx-auto pb-28">
      <section className="grid lg:grid-cols-[1fr_2fr] gap-7 lg:gap-16">
        <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{pickLang(language, {"ru": "Знакомство", "en": "Discover", "th": "ทำความรู้จัก"})}</p><h2 className="text-3xl sm:text-4xl tracking-tight">{pickLang(language, {"ru": "О комплексе", "en": "Life at the complex", "th": "ชีวิตในโครงการ"})}</h2></div>
        <div className="space-y-8">
          <p className="text-base sm:text-lg leading-relaxed whitespace-pre-line text-muted-foreground">{description || (pickLang(language, {"ru": "Описание комплекса пока не добавлено.", "en": "A description of this complex has not been added yet.", "th": "ยังไม่มีคำอธิบายโครงการนี้"}))}</p>
          {facilities.length > 0 && <div><h3 className="text-lg font-medium mb-4">{pickLang(language, {"ru": "Удобства на территории", "en": "Around the grounds", "th": "สิ่งอำนวยความสะดวกในโครงการ"})}</h3><div className="flex flex-wrap gap-2">{facilities.map(amenity => <PropertyAttributeChip key={amenity} icon={amenity === 'pool' ? <Waves className="h-4 w-4" /> : <Building2 className="h-4 w-4" />} className="px-4 py-3"><span>{getProjectFacilityLabel(amenity, isRu ? 'ru' : 'en')}</span></PropertyAttributeChip>)}</div></div>}
        </div>
      </section>

      <section id="complex-units" className="scroll-mt-24" aria-labelledby="complex-units-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8"><div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{pickLang(language, {"ru": "Найдите своё пространство", "en": "Find your space", "th": "ค้นหาพื้นที่ของคุณ"})}</p><h2 id="complex-units-title" className="text-3xl sm:text-4xl tracking-tight">{mode === 'rent' ? (pickLang(language, {"ru": "Жильё в аренду", "en": "Homes to rent", "th": "ที่พักให้เช่า"})) : (pickLang(language, {"ru": "Жильё на продажу", "en": "Homes for sale", "th": "ที่พักสำหรับขาย"}))}</h2>{operator && <p className="mt-3 text-muted-foreground">{pickLang(language, {"ru": "Компания: ", "en": "Company: ", "th": "บริษัท: "})}{companyName(operator)}</p>}</div>
          {propertyType && <p className="mt-3 text-sm text-muted-foreground">{pickLang(language, {"ru": "Тип жилья: ", "en": "Home type: ", "th": "ประเภทที่พัก: "})}{getPropertyTypeLabel(propertyType, isRu ? 'ru' : 'en')} · <button type="button" className="underline underline-offset-4" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete('propertyType'); return next; }, { replace: true, state: location.state })}>{pickLang(language, {"ru": "Показать все типы", "en": "Show all home types", "th": "ดูที่พักทุกประเภท"})}</button></p>}
          <div className="flex gap-2" aria-label={pickLang(language, {"ru": "Тип предложения", "en": "Listing type", "th": "ประเภทข้อเสนอ"})}>{(['rent', 'buy'] as const).map(value => <Button key={value} variant={mode === value ? 'default' : 'outline'} aria-pressed={mode === value} onClick={() => { setLimit(24); setParams(previous => { const next = new URLSearchParams(previous); next.set('mode', value); return next; }, { replace: true, state: location.state }); }}>{value === 'rent' ? (pickLang(language, {"ru": "Аренда", "en": "Rent", "th": "เช่า"})) : (pickLang(language, {"ru": "Покупка", "en": "Buy", "th": "ซื้อ"}))} <span className="ml-2 tabular-nums">{(value === 'rent' ? rentQuery : saleQuery).isSuccess ? (value === 'rent' ? rentQuery : saleQuery).data?.total : '…'}</span></Button>)}</div>
        </div>
        {unitsQuery.isLoading ? <div role="status" className="py-12 text-muted-foreground">{pickLang(language, {"ru": "Загружаем предложения…", "en": "Loading homes…", "th": "กำลังโหลดที่พัก…"})}</div> : unitsQuery.isError ? <div role="alert" className="border p-8 space-y-4"><p>{pickLang(language, {"ru": "Не удалось загрузить предложения.", "en": "Could not load homes.", "th": "ไม่สามารถโหลดที่พักได้"})}</p><Button variant="outline" onClick={() => unitsQuery.refetch()}>{pickLang(language, {"ru": "Повторить", "en": "Retry", "th": "ลองอีกครั้ง"})}</Button></div> : units.length === 0 ? <div className="border border-dashed p-8 sm:p-12 text-center space-y-4"><Building2 className="h-8 w-8 mx-auto text-muted-foreground" /><p>{pickLang(language, {"ru": "По выбранным условиям пока нет опубликованных предложений.", "en": "No published homes match these choices yet.", "th": "ยังไม่มีที่พักที่เผยแพร่ตรงกับเงื่อนไขนี้"})}</p><Button asChild variant="outline"><Link to={catalogHref}>{pickLang(language, {"ru": "Посмотреть другие варианты", "en": "Explore other homes", "th": "ดูที่พักอื่น"})}</Link></Button></div> : <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">{units.map(property => { const company = companies.find(c => c.id === property.management_company_id); return <div key={property.id}><PropertyListingCard property={property} mode={mode} companyName={company ? companyName(company) : undefined} companySlug={company?.slug} />{company && !company.slug && <p className="mt-2 text-sm text-muted-foreground">{pickLang(language, {"ru": "Компания: ", "en": "Company: ", "th": "บริษัท: "})}{companyName(company)}</p>}</div>; })}</div>{units.length < (unitsQuery.data?.total ?? 0) && <Button variant="outline" className="mt-8" onClick={() => setLimit(limit + 24)}>{pickLang(language, {"ru": "Показать ещё", "en": "Show more", "th": "ดูเพิ่มเติม"})}</Button>}</>}
      </section>

      {photos.length > 0 && <section aria-labelledby="complex-gallery"><div className="flex items-end justify-between mb-6"><h2 id="complex-gallery" className="text-3xl sm:text-4xl tracking-tight">{pickLang(language, {"ru": "Взгляд изнутри", "en": "A closer look", "th": "ชมรายละเอียด"})}</h2><span className="text-sm text-muted-foreground">{photos.length} {pickLang(language, {"ru": "фото", "en": "photos", "th": "ภาพ"})}</span></div><PropertyDetailGallery images={photos} alt={name} onOpenLightbox={setLightbox} /></section>}
      {photos.length === 0 && <p className="text-muted-foreground">{pickLang(language, {"ru": "Фотографии комплекса пока не добавлены.", "en": "Photos of this complex have not been added yet.", "th": "ยังไม่มีภาพโครงการนี้"})}</p>}

      {video && <section id="complex-video" className="scroll-mt-24" aria-labelledby="complex-video-title"><h2 id="complex-video-title" className="text-3xl sm:text-4xl tracking-tight mb-6">{pickLang(language, {"ru": "Почувствуйте атмосферу", "en": "Get a feel for the place", "th": "สัมผัสบรรยากาศ"})}</h2>
        {video.kind === 'link' ? <Button asChild variant="outline"><a href={video.url} target="_blank" rel="noopener noreferrer"><Play className="h-4 w-4 mr-2" />{pickLang(language, {"ru": "Открыть видео комплекса", "en": "Open complex video", "th": "เปิดวิดีโอโครงการ"})}</a></Button> :
          <div className="relative aspect-video bg-foreground overflow-hidden">
            {!playVideo ? <button onClick={() => setPlayVideo(true)} className="absolute inset-0 flex items-center justify-center group" aria-label={pickLang(language, {"ru": "Воспроизвести видео", "en": "Play video", "th": "เล่นวิดีโอ"})}>{photos[0] && <img src={photos[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}<span className="relative rounded-full bg-white text-black p-6 group-hover:scale-105 transition-transform"><Play className="h-8 w-8" /></span></button> : video.kind === 'file' ? <video aria-label={`${name} — ${pickLang(language, {"ru": "Видео", "en": "Video", "th": "วิดีโอ"})}`} src={video.url} controls playsInline preload="metadata" poster={photos[0]} className="w-full h-full" /> : <iframe src={video.url} title={`${name} — ${pickLang(language, {"ru": "Видео", "en": "Video", "th": "วิดีโอ"})}`} className="w-full h-full" allow="fullscreen; picture-in-picture" allowFullScreen />}
          </div>}
      </section>}


    </div>
    <PhotoLightbox images={photos} initialIndex={lightbox ?? 0} open={lightbox !== null} onClose={() => setLightbox(null)} alts={photos.map(() => name)} />
  </div>;
}
