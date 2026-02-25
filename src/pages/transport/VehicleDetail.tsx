/**
 * VehicleDetail — Premium vehicle detail page
 * Turo + Hertz hybrid: gallery, specs, trust layer, sticky CTA
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Users, Fuel, Settings2, Calendar,
  Shield, ShieldCheck, Check, Share2, Phone, MessageCircle,
  Briefcase, DoorOpen, Gauge, Info, ChevronRight, Zap
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
import { cn } from '@/lib/utils';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { BackButton } from '@/components/uno/BackButton';
import { useVehicle } from '@/hooks/useVehicles';
import { RelatedServicesSection } from '@/components/crosssell';
import { TrustBadges } from '@/components/uno/TrustBadges';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getTransmissionLabel, getFuelLabel, getLocalizedFeatures, getCategoryConfig } from '@/lib/taxonomies';
import { getCurrencySymbol } from '@/lib/config/currencies';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(0);
  const { trackView } = useViewHistory();
  const { vehicle, isLoading } = useVehicle(id || '');

  const isRu = language === 'ru';
  const lang = isRu ? 'ru' : 'en';

  useEffect(() => {
    if (vehicle) {
      trackView(vehicle.id, 'vehicle', {
        name_en: vehicle.name_en,
        name_ru: vehicle.name_ru,
        image: vehicle.cover_image || vehicle.images?.[0],
        price: vehicle.price_per_day,
        location: vehicle.location_name,
      });
    }
  }, [vehicle?.id]);

  if (isLoading) {
    return (
      <AppLayout showBottomNav={false}>
        <DetailPageSkeleton />
      </AppLayout>
    );
  }

  if (!vehicle) {
    return (
      <AppLayout showBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <Settings2 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {isRu ? 'Транспорт не найден' : 'Vehicle not found'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Возможно, он был удалён или недоступен' : 'It may have been removed or is unavailable'}
          </p>
          <Button onClick={() => navigate('/transport')}>
            {isRu ? 'Назад к каталогу' : 'Back to catalog'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = vehicle.images?.length > 0
    ? vehicle.images
    : vehicle.cover_image
      ? [vehicle.cover_image]
      : ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800'];

  const name = isRu ? vehicle.name_ru : vehicle.name_en;
  const description = isRu ? vehicle.description_ru : vehicle.description_en;
  const location = isRu ? (vehicle.location_ru || vehicle.location_name) : vehicle.location_name;
  const currencySymbol = getCurrencySymbol(vehicle.currency || 'THB');
  const transmissionLabel = getTransmissionLabel(vehicle.transmission, lang);
  const fuelLabel = getFuelLabel(vehicle.fuel_type, lang);
  const localizedFeatures = getLocalizedFeatures(vehicle.features, lang);
  const categoryConfig = getCategoryConfig(vehicle.vehicle_type);

  return (
    <AppLayout showBottomNav={false}>
      <div className="pb-28">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border/50">
          <BackButton fallbackPath="/transport" variant="ghost" />
          <div className="flex items-center gap-1.5">
            <FavoriteButton
              itemType="vehicle"
              itemId={vehicle.id}
              itemData={{
                title_en: vehicle.name_en,
                title_ru: vehicle.name_ru,
                image: images[0],
                price: vehicle.price_per_day,
                location: vehicle.location_name,
              }}
              variant="ghost"
            />
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative bg-muted">
          <div className="aspect-[16/10] md:aspect-[2/1] overflow-hidden">
            <OptimizedImage
              src={images[activeImage]}
              alt={name}
              className="w-full h-full"
              priority
              quality={85}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-background">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                    activeImage === i ? "border-primary shadow-sm" : "border-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="px-4 space-y-6 pt-5">

            {/* Title block */}
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl md:text-2xl font-display font-bold text-foreground">{name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {isRu ? categoryConfig.labelRu : categoryConfig.labelEn}
                    {vehicle.year_built && ` • ${vehicle.year_built}`}
                  </p>
                </div>
              </div>

              {location && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}

              {/* Rating */}
              {vehicle.rating && vehicle.rating > 0 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warning/10">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-bold text-sm">{vehicle.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({vehicle.review_count || 0} {isRu ? 'отзывов' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* G-Trust Block */}
            {vehicle.is_verified && (
              <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-sm text-foreground">
                    {isRu ? 'G-Trust верификация' : 'G-Trust Verified'}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <TrustItem label={isRu ? 'Владелец проверен' : 'Owner verified'} />
                  <TrustItem label={isRu ? 'Страховка включена' : 'Insurance included'} />
                  <TrustItem label={isRu ? 'Залог прозрачен' : 'Deposit transparent'} />
                  <TrustItem label={isRu ? 'Отмена 24ч' : 'Free cancel 24h'} />
                </div>
                <div className="mt-3">
                  <TrustBadges providerId={vehicle.provider_id || undefined} compact />
                </div>
              </div>
            )}

            {/* Price Card */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    {isRu ? 'Стоимость' : 'Pricing'}
                  </span>
                  <p className="text-2xl md:text-3xl font-bold text-foreground mt-0.5">
                    {currencySymbol}{vehicle.price_per_day?.toLocaleString() || 0}
                    <span className="text-base font-normal text-muted-foreground ml-1">
                      /{isRu ? 'день' : 'day'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {isRu ? 'Страховка' : 'Insured'}
                  </span>
                </div>
              </div>

              {/* Price variants */}
              <div className="grid grid-cols-3 gap-2">
                {vehicle.price_per_hour && (
                  <PriceVariant
                    label={isRu ? 'Час' : 'Hour'}
                    value={`${currencySymbol}${vehicle.price_per_hour.toLocaleString()}`}
                  />
                )}
                {vehicle.price_per_week && (
                  <PriceVariant
                    label={isRu ? 'Неделя' : 'Week'}
                    value={`${currencySymbol}${vehicle.price_per_week.toLocaleString()}`}
                  />
                )}
                {vehicle.price_per_month && (
                  <PriceVariant
                    label={isRu ? 'Месяц' : 'Month'}
                    value={`${currencySymbol}${vehicle.price_per_month.toLocaleString()}`}
                  />
                )}
              </div>
            </div>

            {/* Specs Grid */}
            <div>
              <h2 className="text-base font-semibold mb-3">{isRu ? 'Характеристики' : 'Specifications'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <SpecCard icon={Users} label={isRu ? 'Мест' : 'Seats'} value={`${vehicle.capacity || '-'}`} />
                <SpecCard icon={Settings2} label={isRu ? 'Коробка' : 'Transmission'} value={transmissionLabel} />
                <SpecCard icon={Fuel} label={isRu ? 'Топливо' : 'Fuel'} value={fuelLabel} />
                <SpecCard icon={Calendar} label={isRu ? 'Год' : 'Year'} value={`${vehicle.year_built || '-'}`} />
                {vehicle.doors > 0 && (
                  <SpecCard icon={DoorOpen} label={isRu ? 'Двери' : 'Doors'} value={`${vehicle.doors}`} />
                )}
                {vehicle.luggage_capacity > 0 && (
                  <SpecCard icon={Briefcase} label={isRu ? 'Багаж' : 'Luggage'} value={`${vehicle.luggage_capacity}`} />
                )}
                {vehicle.engine_size && (
                  <SpecCard icon={Gauge} label={isRu ? 'Двигатель' : 'Engine'} value={vehicle.engine_size} />
                )}
                {vehicle.deposit_amount && (
                  <SpecCard icon={Shield} label={isRu ? 'Залог' : 'Deposit'} value={`${currencySymbol}${vehicle.deposit_amount.toLocaleString()}`} />
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div>
                <h2 className="text-base font-semibold mb-2">{isRu ? 'Описание' : 'Description'}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}

            {/* Features */}
            {localizedFeatures.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-3">{isRu ? 'Включено' : 'Included'}</h2>
                <div className="grid grid-cols-2 gap-2">
                  {localizedFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border/50">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rental Terms */}
            <div>
              <h2 className="text-base font-semibold mb-3">{isRu ? 'Условия аренды' : 'Rental Terms'}</h2>
              <div className="space-y-2">
                <TermRow icon={Calendar} text={`${isRu ? 'Минимум' : 'Minimum'} ${vehicle.min_rental_days || 1} ${isRu ? 'дней' : 'days'}`} />
                {vehicle.free_km_per_day && (
                  <TermRow icon={Zap} text={`${vehicle.free_km_per_day} ${isRu ? 'км/день бесплатно' : 'km/day free'}`} />
                )}
                {vehicle.extra_km_price && (
                  <TermRow icon={Info} text={`${currencySymbol}${vehicle.extra_km_price}/${isRu ? 'доп. км' : 'extra km'}`} />
                )}
                <TermRow icon={Shield} text={isRu ? 'Действующие водительские права обязательны' : 'Valid driver license required'} />
                {vehicle.insurance_note && (
                  <TermRow icon={ShieldCheck} text={vehicle.insurance_note} />
                )}
                {vehicle.mileage_policy && (
                  <TermRow icon={Gauge} text={vehicle.mileage_policy} />
                )}
              </div>
            </div>

            {/* FAQ placeholder */}
            <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
              <h3 className="font-semibold text-sm mb-2">{isRu ? 'Часто задаваемые вопросы' : 'FAQ'}</h3>
              <div className="space-y-2">
                <FaqItem q={isRu ? 'Нужны ли международные права?' : 'Do I need an international license?'} a={isRu ? 'Для аренды автомобиля или скутера на Пхукете рекомендуется иметь международное водительское удостоверение (МВУ). Полиция может проверить документы.' : 'An International Driving Permit (IDP) is recommended for renting cars or scooters in Phuket. Police may check your documents.'} />
                <FaqItem q={isRu ? 'Что включено в страховку?' : 'What does the insurance cover?'} a={isRu ? 'Базовая страховка покрывает ущерб третьим лицам. Полная страховка (CDW) доступна за дополнительную плату и покрывает повреждения арендованного транспорта.' : 'Basic insurance covers third-party damage. Full coverage (CDW) is available for an extra fee and covers damage to the rented vehicle.'} />
                <FaqItem q={isRu ? 'Как происходит доставка?' : 'How does delivery work?'} a={isRu ? 'Мы доставим транспорт к вашему отелю или вилле бесплатно в пределах основных районов Пхукета. Доставка занимает 30–60 минут.' : 'We deliver the vehicle to your hotel or villa for free within main Phuket areas. Delivery takes 30–60 minutes.'} />
              </div>
            </div>
          </div>

          {/* Related */}
          <div className="mt-6">
            <RelatedServicesSection currentVertical="transport" />
          </div>
        </div>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}>
          <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{isRu ? 'От' : 'From'}</p>
              <p className="text-lg font-bold text-foreground">
                {currencySymbol}{vehicle.price_per_day?.toLocaleString() || 0}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">/{isRu ? 'день' : 'day'}</span>
              </p>
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              className="flex-1 h-11 rounded-xl font-semibold"
              onClick={() => navigate(`/transport/booking/${id}`, {
                state: {
                  vehicle: {
                    nameEn: vehicle.name_en,
                    nameRu: vehicle.name_ru,
                    pricePerDay: vehicle.price_per_day,
                    image: images[0],
                  }
                }
              })}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {isRu ? 'Забронировать' : 'Reserve'}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* --- Sub-components --- */

function SpecCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 text-center">
      <Icon className="w-5 h-5 text-primary mb-1.5" />
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="w-3.5 h-3.5 text-success shrink-0" />
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function PriceVariant({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-background text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function TermRow({ icon: Icon, text }: { icon: typeof Check; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      className="w-full flex flex-col p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium">{q}</span>
        <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </div>
      {open && (
        <span className="text-xs text-muted-foreground mt-2 leading-relaxed">{a}</span>
      )}
    </button>
  );
}
