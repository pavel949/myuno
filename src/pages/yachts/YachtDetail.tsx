import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  Anchor, Star, Users, MapPin, Clock, Shield, Check, X,
  Share2, Heart, Ruler, Fuel, FileText, Building2, Phone
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/uno/BackButton';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
import { useYacht, useYachts } from '@/hooks/useYachts';
import { YachtBookingQuickSelect } from '@/components/yachts/YachtBookingQuickSelect';
import { ItemCard } from '@/components/miniapp';
import { mapYachtToCardProps } from '@/lib/adapters/yachtAdapters';

export default function YachtDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [currentImage, setCurrentImage] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentImage(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  const { yacht, isLoading } = useYacht(id || '');
  const { yachts: allYachts } = useYachts();

  if (isLoading) {
    return <AppLayout><DetailPageSkeleton /></AppLayout>;
  }

  if (!yacht) {
    return (
      <AppLayout>
        <PageContainer className="py-20 text-center">
          <Anchor className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {language === 'ru' ? 'Яхта не найдена' : 'Yacht not found'}
          </h2>
          <Button onClick={() => navigate('/yachts')}>
            {language === 'ru' ? 'К списку яхт' : 'Back to yachts'}
          </Button>
        </PageContainer>
      </AppLayout>
    );
  }

  const images = yacht.images?.length ? yacht.images : [yacht.cover_image || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800'];
  const name = language === 'ru' ? yacht.name_ru : yacht.name_en;
  const description = language === 'ru' ? yacht.description_ru : yacht.description_en;
  const location = language === 'ru' ? yacht.location_ru : yacht.location_name;
  const features = language === 'ru' ? yacht.features_ru : yacht.features_en;
  const exclusions = (yacht as any).exclusions_en as string[] | null;
  const exclusionsRu = (yacht as any).exclusions_ru as string[] | null;
  const displayExclusions = language === 'ru' ? (exclusionsRu || exclusions) : exclusions;

  // Parse addons
  const addons = yacht.addons as Array<{ name_en?: string; name_ru?: string; price?: number; unit?: string }> | null;

  // Similar yachts: same type, different id, limit 4
  const similarYachts = (allYachts || [])
    .filter(y => y.id !== yacht.id && y.yacht_type === yacht.yacht_type && (y.price_full_day || y.price_half_day))
    .slice(0, 4);

  return (
    <AppLayout>
      {/* Image Gallery */}
      <div className="relative h-72">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((img, idx) => (
              <div key={idx} className="flex-[0_0_100%] min-w-0 h-full">
                <img src={img} alt={`${name} ${idx + 1}`} className="w-full h-full object-cover select-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-4 left-4">
          <BackButton fallbackPath="/yachts" variant="overlay" />
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white">
            <Heart className="w-5 h-5" />
          </button>
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.slice(0, 10).map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentImage ? 'bg-white w-4' : 'bg-white/50'}`}
              />
            ))}
            {images.length > 10 && <span className="text-white/70 text-xs ml-1">+{images.length - 10}</span>}
          </div>
        )}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {yacht.is_verified && (
            <Badge className="bg-primary text-primary-foreground">
              <Shield className="w-3 h-3 mr-1" />{language === 'ru' ? 'Проверено' : 'Verified'}
            </Badge>
          )}
          {yacht.is_featured && (
            <Badge className="bg-amber-500 text-white">
              <Star className="w-3 h-3 mr-1" />{language === 'ru' ? 'Рекомендуем' : 'Featured'}
            </Badge>
          )}
        </div>
      </div>

      <PageContainer className="-mt-4 relative z-10 bg-background rounded-t-3xl pt-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">{name}</h1>
            <Badge variant="secondary" className="capitalize">{yacht.yacht_type?.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /><span>{location || 'Phuket'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{yacht.rating}</span><span>({yacht.review_count})</span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-xl mb-6">
          <div className="text-center">
            <Users className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.capacity}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'гостей' : 'guests'}</p>
          </div>
          <div className="text-center">
            <Ruler className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.length_meters ? `${yacht.length_meters}m` : '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'длина' : 'length'}</p>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.year_built || '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'год' : 'year'}</p>
          </div>
          <div className="text-center">
            <Anchor className="w-5 h-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-sm font-medium">{yacht.cabins || '—'}</p>
            <p className="text-xs text-muted-foreground">{language === 'ru' ? 'каюты' : 'cabins'}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-32">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">{language === 'ru' ? 'Обзор' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="specs">{language === 'ru' ? 'Характеристики' : 'Specs'}</TabsTrigger>
            <TabsTrigger value="reviews">{language === 'ru' ? 'Отзывы' : 'Reviews'}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            {description && (
              <div>
                <h3 className="font-semibold mb-2">{language === 'ru' ? 'Описание' : 'Description'}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            )}

            {/* What's Included / Not Included */}
            {(features?.length || displayExclusions?.length) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features && features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                      {language === 'ru' ? '✅ Включено' : '✅ Included'}
                    </h3>
                    <div className="space-y-2">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {displayExclusions && displayExclusions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">
                      {language === 'ru' ? '❌ Не включено' : '❌ Not Included'}
                    </h3>
                    <div className="space-y-2">
                      {displayExclusions.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extras & Add-ons */}
            {addons && Array.isArray(addons) && addons.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">
                  {language === 'ru' ? '🎁 Дополнительные услуги' : '🎁 Extras & Add-ons'}
                </h3>
                <div className="space-y-2">
                  {addons.map((addon, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{language === 'ru' ? (addon.name_ru || addon.name_en) : addon.name_en}</span>
                      {addon.price && (
                        <span className="text-sm font-medium text-primary">
                          ฿{addon.price.toLocaleString()}{addon.unit ? `/${addon.unit.replace('per_', '')}` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crew info */}
            {yacht.has_crew && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-medium">{language === 'ru' ? 'Экипаж включён' : 'Crew included'}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ru' ? 'Профессиональный капитан и команда входят в стоимость' : 'Professional captain and crew are included in the price'}
                </p>
              </div>
            )}

            {/* Policies Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === 'ru' ? 'Условия и политики' : 'Policies & Terms'}
              </h3>
              <div className="space-y-3">
                <PolicyRow
                  label={language === 'ru' ? 'Отмена' : 'Cancellation'}
                  value={(yacht as any).cancellation_policy || (language === 'ru' ? 'Бесплатная отмена за 48ч' : 'Free cancellation 48h before')}
                />
                <PolicyRow
                  label={language === 'ru' ? 'Топливо' : 'Fuel'}
                  value={(yacht as any).fuel_policy || (language === 'ru' ? 'Включено в стоимость' : 'Included in price')}
                />
                <PolicyRow
                  label={language === 'ru' ? 'Страховка' : 'Insurance'}
                  value={(yacht as any).insurance_included ? (language === 'ru' ? 'Включена' : 'Included') : (language === 'ru' ? 'Не включена' : 'Not included')}
                />
                {(yacht as any).deposit_percent && (
                  <PolicyRow
                    label={language === 'ru' ? 'Депозит' : 'Deposit'}
                    value={`${(yacht as any).deposit_percent}%`}
                  />
                )}
              </div>
            </div>

            {/* Operator Card */}
            {yacht.provider_id && (
              <div className="p-4 border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{language === 'ru' ? 'Оператор' : 'Operator'}</p>
                    <p className="text-xs text-muted-foreground">{language === 'ru' ? 'Лицензированный оператор' : 'Licensed charter operator'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Phone className="w-3 h-3" />
                    {language === 'ru' ? 'Связаться' : 'Contact'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {yacht.length_meters && <SpecCard label={language === 'ru' ? 'Длина' : 'Length'} value={`${yacht.length_meters}m`} />}
              {yacht.beam && <SpecCard label={language === 'ru' ? 'Ширина' : 'Beam'} value={yacht.beam} />}
              {yacht.draft && <SpecCard label={language === 'ru' ? 'Осадка' : 'Draft'} value={yacht.draft} />}
              {yacht.engines && <SpecCard label={language === 'ru' ? 'Двигатели' : 'Engines'} value={yacht.engines} />}
              {yacht.cruising_speed && <SpecCard label={language === 'ru' ? 'Крейсерская скорость' : 'Cruising Speed'} value={yacht.cruising_speed} />}
              {yacht.max_speed && <SpecCard label={language === 'ru' ? 'Макс. скорость' : 'Max Speed'} value={yacht.max_speed} />}
              {yacht.fuel_capacity && <SpecCard label={language === 'ru' ? 'Топливный бак' : 'Fuel Capacity'} value={yacht.fuel_capacity} />}
              {yacht.cabins && <SpecCard label={language === 'ru' ? 'Каюты' : 'Cabins'} value={`${yacht.cabins}`} />}
              {yacht.bathrooms && <SpecCard label={language === 'ru' ? 'Санузлы' : 'Bathrooms'} value={`${yacht.bathrooms}`} />}
              <SpecCard label={language === 'ru' ? 'Вместимость' : 'Capacity'} value={`${yacht.capacity} ${language === 'ru' ? 'чел.' : 'guests'}`} />
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">{yacht.rating} / 5</p>
              <p className="text-sm">{yacht.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}</p>
              <p className="text-sm mt-4">{language === 'ru' ? 'Подробные отзывы скоро появятся' : 'Detailed reviews coming soon'}</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Similar Yachts */}
        {similarYachts.length > 0 && (
          <div className="mb-32">
            <h3 className="font-semibold mb-4">
              {language === 'ru' ? 'Похожие яхты' : 'Similar Yachts'}
            </h3>
            <div className="grid gap-4">
              {similarYachts.map((y) => {
                const card = mapYachtToCardProps(y, language);
                return (
                  <ItemCard
                    key={y.id}
                    title={card.title}
                    image={card.image}
                    price={card.price || 0}
                    priceLabel={card.priceLabel}
                    rating={card.rating}
                    reviewCount={card.reviewCount}
                    location={card.location}
                    meta={card.meta.map(m => ({ icon: m.icon, value: m.label }))}
                    tags={card.tags}
                    isFeatured={card.isFeatured}
                    isVerified={card.isVerified}
                    onClick={() => navigate(`/yachts/${y.id}`)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </PageContainer>

      <YachtBookingQuickSelect yacht={yacht} />
    </AppLayout>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
