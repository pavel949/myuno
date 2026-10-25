import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AREA_GUIDES, areaName, mediaSource, mediaUrl, type AreaGuide } from '@/content/areas/areaRegistry';
import { useAreaInventory } from '@/hooks/useAreaInventory';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

export function AreaPhoto({ area, eager = false, href }: { area: AreaGuide; eager?: boolean; href?: string }) {
  const [failed, setFailed] = useState(false);
  const { language } = useLanguage();
  const visual = <div className="aspect-[3/2] overflow-hidden bg-muted">
      {failed ? <p role="status" className="p-4 text-sm">{language === 'ru' ? 'Фотография недоступна' : 'Photo unavailable'}</p> : <img
        src={mediaUrl(area)} srcSet={`${mediaUrl(area, 640)} 640w, ${mediaUrl(area)} 1280w`}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={area.media.alt} width={1280} height={853} loading={eager ? 'eager' : 'lazy'} decoding="async"
        onError={() => setFailed(true)} className="h-full w-full object-cover" />}
    </div>;
  return <figure className="min-w-0">
    {href ? <Link to={href} aria-label={`${areaName(area, language)} — ${language === 'ru' ? 'О районе' : 'About the area'}`}>{visual}</Link> : visual}
    <figcaption className="px-1 py-2 text-xs text-muted-foreground">
      Photo: <a className="underline" href={mediaSource(area)}>{area.media.author}</a> · <a className="underline" href={`https://creativecommons.org/licenses/by-sa/${area.media.license}/`}>CC BY-SA {area.media.license}</a> · {area.media.capturedAt} · {language === 'ru' ? 'Кадрирование' : 'Cropped'}
    </figcaption>
  </figure>;
}
function AreaGalleryCard({ area }: { area: AreaGuide }) {
  const inventory = useAreaInventory(area);
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const queries = [inventory.rentals, inventory.projects, inventory.resale];
  if (queries.some(query => query.isPending)) return <p role="status">{t('Загружаем предложения…', 'Loading listings…', 'กำลังโหลดรายการ…')}</p>;
  if (queries.some(query => query.isError)) return <div role="alert"><p>{areaName(area, language)}: {t('Не удалось проверить предложения', 'Could not check listings', 'ตรวจสอบรายการไม่สำเร็จ')}</p><button className="underline" onClick={() => queries.forEach(query => void query.refetch())}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</button></div>;
  if (!queries.some(query => (query.data ?? 0) > 0)) return null;
  return <article className="min-w-0 border border-border bg-card">
    <AreaPhoto area={area} href={`/area/${area.slug}`} />
    <div className="p-4"><h3 className="text-xl font-semibold"><Link className="hover:underline" to={`/area/${area.slug}`}>{areaName(area, language)}</Link></h3>
      <p className="my-3 text-sm">{area.content[language === 'ru' ? 'ru' : 'en'].intro}</p>
      {language === 'th' && <p lang="en" className="text-xs">English guide · Thai translation pending review</p>}
      <div className="space-y-1 text-sm">
        {!!inventory.rentals.data && <p>{t('Аренда: объектов', 'Rental properties', 'ที่พักให้เช่า')}: {inventory.rentals.data}</p>}
        {!!inventory.projects.data && <p>{t('Новостройки: проектов', 'New-build projects', 'โครงการใหม่')}: {inventory.projects.data}</p>}
        {!!inventory.resale.data && <p>{t('Вторичка: объектов', 'Resale properties', 'อสังหาริมทรัพย์มือสอง')}: {inventory.resale.data}</p>}
      </div>
      <Link className="mt-4 inline-block underline" to={`/area/${area.slug}`}>{t('Знакомство с локацией →', 'Explore the area →', 'ทำความรู้จักย่าน →')}</Link>
    </div>
  </article>;
}
export function HomeAreaGallery() {
  const { language } = useLanguage();
  return <section className="home-area-gallery home-container my-8" aria-labelledby="home-locations-title">
    <div className="home-section-heading"><h2 id="home-locations-title">{pickLang(language, { ru: 'Знакомство с локацией', en: 'Get to know the area', th: 'ทำความรู้จักย่าน' })}</h2><Link className="underline" to="/area">{pickLang(language, { ru: 'Все районы', en: 'All areas', th: 'ทุกย่าน' })}</Link></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{AREA_GUIDES.map(area => <AreaGalleryCard key={area.key} area={area} />)}</div>
  </section>;
}
