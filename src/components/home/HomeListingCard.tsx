import { PropertyRentalRateSummary } from '@/components/property/PropertyRentalRateSummary';
import { propertyRentalRateOptions } from '@/lib/real-estate/propertyDetailIntent';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '@/hooks/useProperties';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { getDistrictLabel } from '@/lib/taxonomies';
import { propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';
import { showcaseImages, homeShowcasePrice } from './homeShowcase';

/** A quiet editorial card; no generated ratings, inferred types or availability badges. */
export function HomeListingCard({ property, onUnavailable }: { property: Property; onUnavailable?: (id: string) => void }) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const t = (value: LangValues) => pickLang(language, value);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const images = showcaseImages(property);
  const image = images.find(url => !failedImages.has(url));
  const title = (language === 'ru' ? property.title_ru : property.title_en) || property.title_en || property.title_ru;
  const multipleRates = propertyRentalRateOptions(property).rates.length > 1;
  const quote = homeShowcasePrice(property);
  const periods: Record<string, LangValues> = {
    total: { ru: '', en: '', th: '' },
    night: { ru: 'за ночь', en: 'per night', th: 'ต่อคืน' },
    month: { ru: 'в месяц', en: 'per month', th: 'ต่อเดือน' },
    week: { ru: 'в неделю', en: 'per week', th: 'ต่อสัปดาห์' },
    year: { ru: 'в год', en: 'per year', th: 'ต่อปี' },
  };
  if (!image) return null;
  return <article className="home-listing"><Link to={propertyDetailHref(property.id, 'rent')}>
    {image && <div className="home-listing-photo"><img key={image} src={image} alt="" width="640" height="480" loading="lazy" decoding="async" onError={() => {
      const next = new Set(failedImages).add(image);
      setFailedImages(next);
      if (images.every(url => next.has(url))) onUnavailable?.(property.id);
    }} /></div>}
    <div className="home-listing-copy"><p className="home-listing-location">{property.district ? getDistrictLabel(property.district, language === 'ru' ? 'ru' : 'en') : t({ ru: 'Пхукет', en: 'Phuket', th: 'ภูเก็ต' })}</p>
      <h3>{title}</h3><p className="home-listing-facts">{property.bedrooms != null && property.bedrooms > 0 ? `${property.bedrooms} ${t({ ru: 'сп.', en: 'bedrooms', th: 'ห้องนอน' })}` : t({ ru: 'Описание и условия', en: 'Details and terms', th: 'รายละเอียดและเงื่อนไข' })}{property.area_sqm != null && property.area_sqm > 0 ? ` · ${property.area_sqm} ${t({ ru: 'м²', en: 'm²', th: 'ตร.ม.' })}` : ''}</p>
      {!multipleRates && <p className="home-listing-price">{quote ? <><strong>{quote.currency === 'THB' ? formatPrice(quote.amount) : `${new Intl.NumberFormat(language).format(quote.amount)} ${quote.currency}`}</strong> <span>{t(periods[quote.period])}</span></> : t({ ru: 'Стоимость и условия в карточке', en: 'Pricing and terms on the listing', th: 'ราคาและเงื่อนไขในประกาศ' })}</p>}
      <PropertyRentalRateSummary property={property} />
    </div></Link></article>;
}
