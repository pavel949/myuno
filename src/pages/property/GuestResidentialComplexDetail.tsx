import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicComplexDetail } from '@/hooks/usePropertyComplexes';
import { usePropertiesByComplex } from '@/hooks/useProperties';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PropertyDetailGallery } from '@/components/property/detail/PropertyDetailGallery';
import { PhotoLightbox } from '@/components/property/PhotoLightbox';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo';
import { complexMediaUrl, complexVideoSource } from '@/lib/real-estate/complexMedia';
import { COMPLEX_AMENITIES, COMPLEX_SERVICES, COMPLEX_SECURITY, COMPLEX_INFRASTRUCTURE } from '@/lib/complexConstants';
import { propertyCatalogHref } from '@/lib/real-estate/propertyDetailIntent';

/** property_complexes publication, separate from the property_projects portal. */
export default function GuestResidentialComplexDetail() {
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const { language } = useLanguage();
  const t = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
  const mode = params.get('mode') === 'buy' ? 'buy' : 'rent';
  const managementCompanyId = params.get('managementCompanyId') || params.get('company') || undefined;
  const [limit, setLimit] = useState(24);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const complexQuery = usePublicComplexDetail(id);
  const complex = complexQuery.data;
  // Do not query units until the independently published complex is readable.
  const unitsQuery = usePropertiesByComplex(complex?.id, limit, { mode, managementCompanyId });
  const back = <Link to={propertyCatalogHref(mode, params.toString())} className="underline underline-offset-4">{t('Property catalog', 'Каталог недвижимости', 'รายการอสังหาริมทรัพย์')}</Link>;
  const retry = t('Retry', 'Повторить', 'ลองอีกครั้ง');
  if (complexQuery.isLoading) return <div role="status" className="p-6">{t('Loading complex…', 'Загружаем комплекс…', 'กำลังโหลดโครงการ…')}</div>;
  if (complexQuery.isError) return <div role="alert" className="p-6 space-y-4">{back}<p>{t('Could not load this complex.', 'Не удалось загрузить комплекс.', 'ไม่สามารถโหลดโครงการนี้ได้')}</p><Button onClick={() => complexQuery.refetch()}>{retry}</Button></div>;
  if (!complex) return <div className="p-6 space-y-4">{back}<h1>{t('Complex not found', 'Комплекс не найден', 'ไม่พบโครงการ')}</h1></div>;
  const name = (language === 'ru' ? complex.name_ru || complex.name : complex.name || complex.name_ru) || t('Residential complex', 'Жилой комплекс', 'โครงการที่พักอาศัย');
  const description = language === 'ru' ? complex.description_ru || complex.description_en : complex.description_en || complex.description_ru;
  const photos = [...new Set([complex.cover_image, ...(complex.images || [])].map(complexMediaUrl).filter((url): url is string => Boolean(url)))];
  const video = complexVideoSource(complex.video_url);
  const units = unitsQuery.data?.properties || [];
  // These are the same string-array taxonomies used by the canonical authoring form.
  // No facility schedules exist in this projection; never infer hours from presence.
  const facilityGroups = [
    { key: 'amenities', values: complex.amenities, labels: COMPLEX_AMENITIES, title: t('Amenities', 'Удобства', 'สิ่งอำนวยความสะดวก') },
    { key: 'services', values: complex.services, labels: COMPLEX_SERVICES, title: t('Services', 'Услуги', 'บริการ') },
    { key: 'security', values: complex.security_features, labels: COMPLEX_SECURITY, title: t('Security', 'Безопасность', 'ความปลอดภัย') },
    { key: 'infrastructure', values: complex.infrastructure, labels: COMPLEX_INFRASTRUCTURE, title: t('Infrastructure', 'Инфраструктура', 'สิ่งอำนวยความสะดวกส่วนกลาง') },
  ].filter(group => group.values?.length);

  return <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 pb-28 space-y-10">
    <SEOHead title={`${name} — myUNO`} description={description || name} />
    {back}
    <header className="space-y-4">
      <h1 className="text-3xl sm:text-5xl break-words">{name}</h1>
      {(complex.address || complex.district) && <p className="text-muted-foreground break-words">{complex.address || complex.district}</p>}
      {photos[0] && <img src={photos[0]} alt={name} className="w-full max-h-[55svh] object-cover" />}
      <p className="whitespace-pre-line break-words">{description || t('A description of this complex has not been added yet.', 'Описание комплекса пока не добавлено.', 'ยังไม่มีรายละเอียดของโครงการนี้')}</p>
    </header>
    {facilityGroups.length > 0 && <section aria-label={t('Complex facilities', 'Удобства комплекса', 'สิ่งอำนวยความสะดวกในโครงการ')} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">{facilityGroups.map(group => <div key={group.key} className="space-y-3">
        <h2 className="text-xl">{group.title}</h2>
        <ul className="flex flex-wrap gap-2">{[...new Set(group.values)].map(value => {
          const known = group.labels.find(item => item.value === value);
          return <li key={value} className="border px-3 py-2 text-sm break-words max-w-full">{known ? t(known.labelEn, known.labelRu, known.labelTh) : value}</li>;
        })}</ul>
      </div>)}</div>
      <p className="text-sm text-muted-foreground">{t('Facility opening hours have not been provided.', 'Часы работы удобств пока не указаны.', 'ยังไม่ได้ระบุเวลาเปิดให้บริการของสิ่งอำนวยความสะดวก')}</p>
    </section>}
    <section aria-labelledby="residential-complex-units" className="space-y-6">
      <h2 id="residential-complex-units" className="text-2xl">{t('Published homes', 'Опубликованные предложения', 'ที่พักที่เผยแพร่แล้ว')}</h2>
      <div className="flex flex-wrap gap-2">{(['rent', 'buy'] as const).map(value => <Button key={value} variant={mode === value ? 'default' : 'outline'} aria-pressed={mode === value} onClick={() => { setLimit(24); setParams(previous => { const next = new URLSearchParams(previous); next.set('mode', value); return next; }, { replace: true }); }}>{value === 'rent' ? t('Rent', 'Аренда', 'เช่า') : t('Buy', 'Покупка', 'ซื้อ')}</Button>)}</div>
      {unitsQuery.isLoading ? <p role="status">{t('Loading homes…', 'Загружаем предложения…', 'กำลังโหลดที่พัก…')}</p> : unitsQuery.isError ? <div role="alert" className="space-y-4"><p>{t('Could not load homes.', 'Не удалось загрузить предложения.', 'ไม่สามารถโหลดที่พักได้')}</p><Button onClick={() => unitsQuery.refetch()}>{retry}</Button></div> : units.length === 0 ? <p>{t('No published homes match these choices yet.', 'По выбранным условиям пока нет опубликованных предложений.', 'ยังไม่มีที่พักที่เผยแพร่ตรงกับตัวเลือกเหล่านี้')}</p> : <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{units.map(property => <PropertyListingCard key={property.id} property={property} mode={mode} />)}</div>
        {units.length < (unitsQuery.data?.total ?? 0) && <Button variant="outline" onClick={() => setLimit(value => value + 24)}>{t('Show more', 'Показать ещё', 'แสดงเพิ่มเติม')}</Button>}
      </>}
    </section>
    {photos.length > 0 && <section className="space-y-4"><h2 className="text-2xl">{t('Photos', 'Фотографии', 'รูปภาพ')}</h2><PropertyDetailGallery images={photos} alt={name} onOpenLightbox={setLightbox} /></section>}
    {video && <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-block underline underline-offset-4">{t('Open complex video', 'Открыть видео комплекса', 'เปิดวิดีโอโครงการ')}</a>}
    <PhotoLightbox images={photos} initialIndex={lightbox ?? 0} open={lightbox !== null} onClose={() => setLightbox(null)} alts={photos.map(() => name)} />
  </div>;
}
