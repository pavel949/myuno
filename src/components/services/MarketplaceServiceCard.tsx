import '@/styles/marketplace-service-card.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, ImageOff, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { MarketplaceService } from '@/hooks/useServiceMarketplace';
import { pickLang } from '@/lib/i18n/pickLang';
import { servicePriceLabel } from '@/lib/services/servicePresentation';
import { formatPhuketTime } from '@/lib/services/slots';

export interface MarketplaceServiceAvailability {
  status: 'available' | 'unavailable' | 'unknown';
  date: string;
  firstSlot?: string;
}

export interface MarketplaceServiceCardProps {
  service: MarketplaceService;
  returnTo: string;
  onRequest: () => void;
  availability?: MarketplaceServiceAvailability;
  onConcierge?: () => void;
}

const IMAGE_BASE_URL = 'https://myuno.invalid';

/** Only application-relative paths and explicit HTTP(S) URLs may become images. */
function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const candidate = value.trim();
  if (!candidate || candidate.startsWith('//')) return false;

  try {
    const parsed = new URL(candidate, IMAGE_BASE_URL);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function storedRating(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 5 ? value : null;
}

function storedReviewCount(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function presentFirstSlot(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatPhuketTime(date);
}

export function MarketplaceServiceCard({
  service,
  returnTo,
  onRequest,
  availability,
  onConcierge,
}: MarketplaceServiceCardProps) {
  const { language } = useLanguage();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const L = (ru: string, en: string, th?: string) => pickLang(language, { ru, en, th });

  const name = (language === 'ru' ? service.name_ru : service.name_en) || service.name_en;
  const description = (language === 'ru' ? service.description_ru : service.description_en) || service.description_en;
  const imageUrl = service.images?.find(isSafeImageUrl) ?? null;
  const visibleImageUrl = imageUrl && failedImage !== imageUrl ? imageUrl : null;
  const rating = storedRating(service.provider?.rating);
  const reviewCount = storedReviewCount(service.provider?.review_count);
  const district = service.location?.district?.trim() || null;
  const pricingScope = [service.unit, service.pricing_model]
    .map(value => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join(' · ');
  const firstSlot = presentFirstSlot(availability?.firstSlot);
  const providerHref = service.provider
    ? `/services/provider/${encodeURIComponent(service.provider.id)}?returnTo=${encodeURIComponent(returnTo)}`
    : null;
  const duration = service.duration_minutes != null && Number.isFinite(service.duration_minutes) && service.duration_minutes > 0
    ? `${service.duration_minutes} ${L('мин', 'min', 'นาที')}`
    : null;

  const availabilityLabel = availability
    ? availability.status === 'available'
      ? `${L('Свободные слоты для заявки, требуется подтверждение', 'Free request slots subject to confirmation', 'มีช่วงเวลาสำหรับส่งคำขอ ต้องรอยืนยัน')}${availability.date ? ` · ${availability.date}` : ''}${firstSlot ? ` · ${firstSlot}` : ''}`
      : availability.status === 'unavailable'
        ? `${L('Свободные слоты для заявки не записаны', 'No request slots recorded', 'ไม่มีช่วงเวลาสำหรับส่งคำขอที่บันทึกไว้')}${availability.date ? ` · ${availability.date}` : ''}`
        : `${L('Доступность неизвестна', 'Availability unknown', 'ยังไม่ทราบความพร้อมให้บริการ')}${availability.date ? ` · ${availability.date}` : ''}`
    : null;

  return (
    <article className="marketplace-service-card flex min-w-0 flex-col overflow-hidden" data-testid="marketplace-service-card">
      <div className="marketplace-service-card__media" data-testid="marketplace-service-card-media">
        {visibleImageUrl ? (
          // The image error event swaps to the non-stock unavailable state.
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
          <img
            src={visibleImageUrl}
            alt={name}
            loading="lazy"
            className="marketplace-service-card__image"
            onError={() => setFailedImage(visibleImageUrl)}
          />
        ) : (
          <div className="marketplace-service-card__image-fallback" role="img" aria-label={L('Изображение услуги недоступно', 'Service image unavailable', 'ไม่มีภาพบริการ')}>
            <ImageOff aria-hidden="true" />
            <span>{L('Фото услуги недоступно', 'Service photo unavailable', 'ไม่มีภาพบริการ')}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="font-display text-base font-medium leading-snug">{name}</h3>
          {description && <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>

        <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
          <span className="font-medium text-primary">{servicePriceLabel(service.price, service.currency, language)}</span>
          {pricingScope && (
            <span className="text-muted-foreground">
              {L('Единица тарифа', 'Pricing unit', 'หน่วยราคา')}: {pricingScope}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock3 aria-hidden="true" />
              {duration}
            </span>
          )}
        </div>

        {providerHref && service.provider && (
          <div className="marketplace-service-card__provider-meta">
            <Link
              to={providerHref}
              className="marketplace-service-card__provider inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:underline"
            >
              {service.provider.is_verified === true && (
                <CheckCircle2
                  aria-label={L('Проверенный специалист', 'Verified provider', 'ผู้ให้บริการยืนยันแล้ว')}
                  aria-hidden="false"
                />
              )}
              <span>{service.provider.name.trim() || L('Название специалиста не указано', 'Provider name not provided', 'ยังไม่ได้ระบุชื่อผู้ให้บริการ')}</span>
            </Link>
            <div
              className="marketplace-service-card__provider-rating"
              data-testid="marketplace-provider-rating"
              aria-label={rating === null
                ? L('Рейтинг специалиста: нет отзывов', 'Provider rating: no reviews yet', 'คะแนนผู้ให้บริการ: ยังไม่มีรีวิว')
                : `${L('Рейтинг специалиста', 'Provider rating', 'คะแนนผู้ให้บริการ')} ${rating.toFixed(1)} / 5`}
            >
              <span className="marketplace-service-card__provider-rating-label">{L('Рейтинг специалиста', 'Provider rating', 'คะแนนผู้ให้บริการ')}</span>
              <Star aria-hidden="true" />
              <span>{rating === null ? L('Нет отзывов', 'No reviews yet', 'ยังไม่มีรีวิว') : rating.toFixed(1)}</span>
              {reviewCount !== null && <span>· {reviewCount.toLocaleString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-US')} {L('отзывов', 'reviews', 'รีวิว')}</span>}
            </div>
          </div>
        )}

        {district && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" />
            <span>{district}</span>
          </div>
        )}

        {availabilityLabel && (
          <p
            className="marketplace-service-card__availability flex items-start gap-2 text-sm text-muted-foreground"
            data-availability-status={availability?.status}
            role="status"
          >
            <CalendarDays aria-hidden="true" />
            <span>{availabilityLabel}</span>
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
          <Button type="button" className="w-full" onClick={onRequest}>
            {L('Оставить заявку', 'Request service', 'ส่งคำขอบริการ')}
          </Button>
          {onConcierge && (
            <Button type="button" variant="outline" className="w-full" onClick={onConcierge}>
              {L('Спросить консьержа', 'Ask concierge', 'สอบถามคอนเซียร์จ')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
