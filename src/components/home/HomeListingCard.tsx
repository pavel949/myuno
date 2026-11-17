import { PropertyRentalRateSummary } from '@/components/property/PropertyRentalRateSummary';
import { propertyRentalRateOptions } from '@/lib/real-estate/propertyDetailIntent';
import { useState } from 'react';
import { propertyArea } from '@/lib/real-estate/propertyJourney';
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
  const rateOptions = propertyRentalRateOptions(property);
  const multipleRates = property.currency?.trim().toUpperCase() === 'THB' && rateOptions.rates.length > 1;
  // Equal amounts for different periods are a review signal, not proof of a wrong price.
  // Preserve recorded tariffs; never invent a replacement or change quoting authority.
  const needsRateReview = multipleRates && new Set(rateOptions.rates.map(rate => rate.amount)).size < rateOptions.rates.length;
  const quote = homeShowcasePrice(property);
  const area = propertyArea(property.district);
  const href = propertyDetailHref(property.id, 'rent');
  const periods: Record<string, LangValues> = {
    total: { ru: '', en: '', th: '' },
    night: { ru: 'за ночь', en: 'per night', th: 'ต่อคืน' },
    month: { ru: 'в месяц', en: 'per month', th: 'ต่อเดือน' },
    week: { ru: 'в неделю', en: 'per week', th: 'ต่อสัปดาห์' },
    year: { ru: 'в год', en: 'per year', th: 'ต่อปี' },
  };
  if (!image) return null;
  return <article className="home-listing"><Link to={href} aria-label={title}>
    {image && <div className="home-listing-photo"><img key={image} src={image} alt="" width="640" height="480" loading="lazy" decoding="async" onError={() => {
      const next = new Set(failedImages).add(image);
      setFailedImages(next);
      if (images.every(url => next.has(url))) onUnavailable?.(property.id);
    }} /></div>}
    </Link><div className="home-listing-copy"><p className="home-listing-location">{property.district ? getDistrictLabel(property.district, language === 'ru' ? 'ru' : 'en') : t({ ru: 'Пхукет', en: 'Phuket', th: 'ภูเก็ต' })}</p>
      <h3><Link to={href}>{title}</Link></h3><p className="home-listing-facts">{property.bedrooms != null && property.bedrooms > 0 ? `${property.bedrooms} ${t({ ru: 'сп.', en: 'bedrooms', th: 'ห้องนอน' })}` : t({ ru: 'Описание и условия', en: 'Details and terms', th: 'รายละเอียดและเงื่อนไข' })}{property.area_sqm != null && property.area_sqm > 0 ? ` · ${property.area_sqm} ${t({ ru: 'м²', en: 'm²', th: 'ตร.ม.' })}` : ''}</p>
      <div className="home-listing-pricing">
      {!multipleRates && <p className="home-listing-price">{quote ? <><strong>{quote.currency === 'THB' ? formatPrice(quote.amount) : `${new Intl.NumberFormat(language).format(quote.amount)} ${quote.currency}`}</strong> <span>{t(periods[quote.period])}</span></> : t({ ru: 'Стоимость и условия в карточке', en: 'Pricing and terms on the listing', th: 'ราคาและเงื่อนไขในประกาศ' })}</p>}
      <PropertyRentalRateSummary property={property} />
      {needsRateReview && <p className="home-listing-rate-note">{t({ ru: 'Одинаковые суммы за разные сроки. Уточните тариф у команды перед заявкой.', en: 'Different periods show the same amount. Confirm the rate with our team before requesting.', th: 'ค่าเช่าแต่ละระยะเวลาแสดงยอดเท่ากัน โปรดยืนยันอัตรากับทีมงานก่อนส่งคำขอ' })}</p>}
      </div>
      <Link className="home-text-link home-listing-action" to={href}>{t({ ru: 'Фото и условия аренды', en: 'View rental details', th: 'ดูรายละเอียดการเช่า' })}<span aria-hidden="true">→</span></Link>
      {area && <Link className="property-area-link home-listing-area-link" to={`/area/${area.slug}`} state={{ propertyJourney: { href, title } }}>{t({ ru: 'Познакомиться с районом', en: 'Explore the neighbourhood', th: 'สำรวจย่านนี้' })} →</Link>}
    </div></article>;
}
