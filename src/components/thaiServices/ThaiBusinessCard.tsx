/**
 * ThaiBusinessCard — B2C catalogue card with the two primary CTAs
 * ("Message" → chat, "Book" → booking). Mobile-first, semantic tokens only.
 */
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, MessageCircle, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { thaiCategoryMeta, THAI_OWNERSHIP_LABELS, type ThaiBusiness } from '@/types/thaiBusiness';

interface Props {
  business: ThaiBusiness;
  onMessage?: (business: ThaiBusiness) => void;
}

export function ThaiBusinessCard({ business, onMessage }: Props) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const cat = thaiCategoryMeta(business.category);
  const ownership = business.ownership_type ? THAI_OWNERSHIP_LABELS[business.ownership_type] : null;
  const name = business.name_ru || business.name_en || business.name_th;
  const cover = business.logo_url || business.gallery_urls?.[0];

  const goDetail = () => navigate(APP_ROUTES.THAI_SERVICES_DETAIL(business.id));

  return (
    <Card className="overflow-hidden border-border">
      <button type="button" onClick={goDetail} className="block w-full text-left">
        <div className="aspect-[16/10] bg-muted overflow-hidden">
          {cover ? (
            <img src={cover} alt={name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              {language === 'ru' ? cat.ru : cat.en}
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground leading-tight">{name}</h3>
            {business.rating_avg != null && (
              <span className="inline-flex items-center gap-0.5 text-sm text-foreground shrink-0">
                <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                {business.rating_avg.toFixed(1)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{language === 'ru' ? cat.ru : cat.en}</span>
            {business.district && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />{business.district}
              </span>
            )}
          </div>
          {ownership && (
            <span className="mt-2 inline-block bg-primary/10 text-primary text-[11px] px-1.5 py-0.5">
              {language === 'ru' ? ownership.ru : ownership.en}
            </span>
          )}
        </div>
      </button>
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => onMessage?.(business)}>
          <MessageCircle className="w-4 h-4 mr-1" />{t('thai.cta.message')}
        </Button>
        <Button size="sm" onClick={() => navigate(`${APP_ROUTES.THAI_SERVICES_DETAIL(business.id)}?book=1`)}>
          <CalendarPlus className="w-4 h-4 mr-1" />{t('thai.cta.book')}
        </Button>
      </div>
    </Card>
  );
}
