import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePublicComplexDetail } from '@/hooks/usePropertyComplexes';
import { residentialComplexDetailHref } from '@/lib/real-estate/propertyDetailIntent';

/** A private or unpublished linked complex must not gain a public card. */
export function ResidentialComplexLink({ complexId, mode }: { complexId: string; mode: 'rent' | 'buy' }) {
  const { data: complex } = usePublicComplexDetail(complexId);
  const { language } = useLanguage();
  const { search } = useLocation();
  if (!complex) return null;
  const label = language === 'ru' ? 'Жилой комплекс' : language === 'th' ? 'โครงการที่พักอาศัย' : 'Residential complex';
  const name = language === 'ru' ? complex.name_ru || complex.name : complex.name || complex.name_ru;
  return <Link to={residentialComplexDetailHref(complex.id, mode, search)} className="block border p-5 space-y-2 break-words"><span className="block text-sm text-muted-foreground">{label}</span><span className="underline underline-offset-4">{name}</span></Link>;
}
