import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import type { Property } from '@/hooks/useProperties';
import { propertyArea, propertyOffers, propertyOfferHref } from '@/lib/real-estate/propertyJourney';
import { propertyCatalogHref } from '@/lib/real-estate/propertyDetailIntent';
import '@/styles/property-journey.css';

type JourneyProperty = Property & { tenancy_modes?: string[] | null };

export function PropertyOfferLinks({ property, mode, search = '' }: { property: JourneyProperty; mode?: 'rent' | 'buy'; search?: string }) {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const offers = propertyOffers(property);
  return <nav className="property-offer-links" aria-label={t({ ru: 'Предложения по объекту', en: 'Property offers', th: 'ข้อเสนอของที่พัก' })}>
    {offers.rent && <Link to={propertyOfferHref(property.id, 'rent', search)} aria-current={mode === 'rent' ? 'page' : undefined}>{t({ ru: 'Арендовать', en: 'Rent', th: 'เช่า' })}</Link>}
    {offers.buy && <Link to={propertyOfferHref(property.id, 'buy', search)} aria-current={mode === 'buy' ? 'page' : undefined}>{t({ ru: 'Купить', en: 'Buy', th: 'ซื้อ' })}</Link>}
    {offers.long && <Link to={propertyOfferHref(property.id, 'rent', search, 'long')}>{t({ ru: 'Снять надолго', en: 'Long stay', th: 'เช่าระยะยาว' })}</Link>}
  </nav>;
}

export function PropertyJourneyNav({ property, mode }: { property: JourneyProperty; mode: 'rent' | 'buy' }) {
  const { language } = useLanguage();
  const location = useLocation();
  const t = (value: LangValues) => pickLang(language, value);
  const area = propertyArea(property.district);
  const title = (language === 'ru' ? property.title_ru : property.title_en) || property.title_en || property.title_ru;
  return <div className="property-journey">
    <nav className="property-journey-breadcrumbs" aria-label={t({ ru: 'Путь к объекту', en: 'Property navigation', th: 'การนำทางที่พัก' })}>
      <Link to="/">{t({ ru: 'Главная', en: 'Home', th: 'หน้าหลัก' })}</Link><span aria-hidden="true">/</span>
      <Link to={propertyCatalogHref(mode, location.search)}>{mode === 'buy' ? t({ ru: 'Покупка', en: 'Buy', th: 'ซื้อ' }) : t({ ru: 'Аренда', en: 'Rent', th: 'เช่า' })}</Link>
      {area && <><span aria-hidden="true">/</span><Link to={`/area/${area.slug}`} state={{ propertyJourney: { href: location.pathname + location.search, title } }}>{language === 'ru' ? area.name_ru : area.name_en}</Link></>}
    </nav>
    <PropertyOfferLinks property={property} mode={mode} search={location.search} />
  </div>;
}

export function PropertyAreaGuide({ property }: { property: JourneyProperty }) {
  const { language } = useLanguage();
  const location = useLocation();
  const area = propertyArea(property.district);
  if (!area) return null;
  const t = (value: LangValues) => pickLang(language, value);
  const name = language === 'ru' ? area.name_ru : area.name_en;
  const title = (language === 'ru' ? property.title_ru : property.title_en) || property.title_en || property.title_ru;
  return <section className="property-area-guide" aria-labelledby="property-area-title">
    <div className="property-area-eyebrow"><MapPin size={17} aria-hidden="true" />{name} · {t({ ru: 'Пхукет', en: 'Phuket', th: 'ภูเก็ต' })}</div>
    <h2 id="property-area-title">{t({ ru: 'Познакомьтесь с районом', en: 'Get to know the neighbourhood', th: 'ทำความรู้จักย่านนี้' })}</h2>
    <p>{language === 'ru' ? area.description_ru : area.description_en}</p>
    <Link to={`/area/${area.slug}`} state={{ propertyJourney: { href: location.pathname + location.search, title } }}>
      {t({ ru: 'Открыть путеводитель', en: 'Explore the area guide', th: 'เปิดคู่มือย่าน' })}<ArrowRight size={18} aria-hidden="true" />
    </Link>
  </section>;
}
