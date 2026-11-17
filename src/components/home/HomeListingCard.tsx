import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '@/hooks/useProperties';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { getDistrictLabel } from '@/lib/taxonomies';
import { showcaseImages } from './homeShowcase';
import { APP_ROUTES } from '@/lib/config/routes';

/** Photo preview only; the canonical marketplace owns facts, tariffs and details. */
export function HomeListingCard({ property, onUnavailable }: { property: Property; onUnavailable?: (id: string) => void }) {
  const { language } = useLanguage();
  const t = (value: LangValues) => pickLang(language, value);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());
  const images = showcaseImages(property);
  const image = images.find(url => !failedImages.has(url));
  const title = (language === 'ru' ? property.title_ru : property.title_en) || property.title_en || property.title_ru;
  // Keep the selected home in the existing marketplace list/map URL contract.
  const params = new URLSearchParams({ mode: 'rent', focus: property.id });
  if (title?.trim()) params.set('q', title.trim());
  const href = `${APP_ROUTES.PROPERTY_SEARCH}?${params.toString()}`;
  if (!image) return null;
  return <article className="home-listing home-listing--preview"><Link to={href} aria-label={title} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
    {image && <div className="home-listing-photo"><img key={image} src={image} alt="" width="640" height="480" loading="lazy" decoding="async" onError={() => {
      const next = new Set(failedImages).add(image);
      setFailedImages(next);
      if (images.every(url => next.has(url))) onUnavailable?.(property.id);
    }} /></div>}
    <div className="home-listing-copy">
      <p className="home-listing-location">{property.district ? getDistrictLabel(property.district, language === 'ru' ? 'ru' : 'en') : t({ ru: 'Пхукет', en: 'Phuket', th: 'ภูเก็ต' })}</p>
      <h3>{title}</h3>
    </div></Link></article>;
}
