import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, Clock, MapPin, Phone, ExternalLink,
  Share2, CalendarDays, UtensilsCrossed, Globe, Mail
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRestaurant } from '@/hooks/useRestaurants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailPageSkeleton } from '@/components/ui/page-skeletons';
import { DetailPageHeader } from '@/components/uno/DetailPageHeader';
import { useViewHistory } from '@/hooks/useViewHistory';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { RelatedServicesSection } from '@/components/crosssell';

const PRICE_BAND_LABEL: Record<string, string> = {
  budget: '฿',
  mid: '฿฿',
  mid_high: '฿฿฿',
  premium: '฿฿฿฿',
};

function getReservationCTA(provider?: string | null, language: string = 'en') {
  switch (provider) {
    case 'chope':
    case 'tablecheck':
    case 'sevenrooms':
      return language === 'ru' ? 'Забронировать столик' : 'Reserve a Table';
    case 'website':
      return language === 'ru' ? 'Забронировать на сайте' : 'Book on Website';
    case 'phone':
      return language === 'ru' ? 'Позвонить для брони' : 'Call to Reserve';
    default:
      return language === 'ru' ? 'Забронировать' : 'Reserve';
  }
}

function getProviderBadge(provider?: string | null) {
  switch (provider) {
    case 'chope': return 'Chope';
    case 'tablecheck': return 'TableCheck';
    case 'sevenrooms': return 'SevenRooms';
    case 'website': return 'Official';
    case 'phone': return 'Phone';
    default: return null;
  }
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { trackView } = useViewHistory();
  const { restaurant, menuCategories, menuItems, isLoading } = useRestaurant(id || '');
  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews'>('info');

  useEffect(() => {
    if (restaurant) {
      trackView(id || restaurant.id, 'restaurant', {
        name_en: restaurant.name_en,
        name_ru: restaurant.name_ru,
        image: restaurant.cover_image,
        rating: restaurant.rating,
        location: restaurant.district,
      });
    }
  }, [id, restaurant, trackView]);

  if (isLoading) {
    return <AppLayout><DetailPageSkeleton /></AppLayout>;
  }

  if (!restaurant) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">
            {language === 'ru' ? 'Ресторан не найден' : 'Restaurant not found'}
          </p>
        </div>
      </AppLayout>
    );
  }

  const r = restaurant as any;
  const cuisineTags = r.cuisine_tags as string[] | null;
  const priceBand = r.price_band as string | null;
  const reservationProvider = r.reservation_provider as string | null;
  const reservationUrl = r.reservation_url as string | null;
  const heroImage = r.hero_image_url || restaurant.cover_image;
  const area = r.area as string | null;
  const galleryImages = (r.images || restaurant.images || []) as string[];
  const websiteUrl = r.website || restaurant.website;
  const providerBadge = getProviderBadge(reservationProvider);

  return (
    <AppLayout>
      <SEOHead
        title={r.seo_title || (language === 'ru' ? restaurant.name_ru : restaurant.name_en)}
        description={r.seo_description || r.description_short || (language === 'ru' ? restaurant.description_ru : restaurant.description_en)}
        image={heroImage}
        type="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          name: restaurant.name_en,
          description: r.seo_description || r.description_short,
          image: heroImage,
          address: restaurant.address ? { '@type': 'PostalAddress', streetAddress: restaurant.address } : undefined,
          telephone: restaurant.phone,
          servesCuisine: cuisineTags,
          priceRange: priceBand ? PRICE_BAND_LABEL[priceBand] : undefined,
          ...(restaurant.rating > 0 && {
            aggregateRating: { '@type': 'AggregateRating', ratingValue: restaurant.rating, reviewCount: restaurant.review_count || 0 },
          }),
          ...(reservationUrl && { acceptsReservations: true, url: reservationUrl }),
        }}
      />
      <div className="pb-24">
        {/* Hero Image */}
        <div className="relative h-56">
          <img
            src={heroImage || PLACEHOLDER_IMAGES.restaurant}
            alt={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          <DetailPageHeader
            fallbackPath="/restaurants"
            actions={
              <FavoriteButton
                itemType="restaurant"
                itemId={id || ''}
                itemData={{
                  name: restaurant.name_en,
                  nameRu: restaurant.name_ru,
                  image: heroImage,
                  rating: restaurant.rating,
                  location: area || restaurant.district,
                  cuisine: cuisineTags?.join(', ') || restaurant.cuisine,
                }}
                className="bg-background/80 backdrop-blur-sm"
              />
            }
          />
        </div>

        {/* Restaurant Info Card */}
        <div className="px-4 -mt-10 relative z-10">
          <Card variant="elevated">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-xl font-display font-bold">
                    {language === 'ru' ? restaurant.name_ru : restaurant.name_en}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {cuisineTags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {priceBand && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {PRICE_BAND_LABEL[priceBand]}
                      </Badge>
                    )}
                  </div>
                </div>
                {providerBadge && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {providerBadge}
                  </Badge>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                {restaurant.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="font-medium">{restaurant.rating}</span>
                    <span className="text-muted-foreground">({restaurant.review_count || 0})</span>
                  </div>
                )}
                {area && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{area}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {(restaurant.description_en || restaurant.description_ru) && (
                <p className="text-sm text-muted-foreground mt-3">
                  {language === 'ru' ? restaurant.description_ru : restaurant.description_en}
                </p>
              )}

              {/* Primary CTA: Reserve */}
              {reservationUrl && (
                <Button
                  className="w-full mt-4 h-12 text-base gap-2"
                  onClick={() => {
                    if (reservationProvider === 'phone' && restaurant.phone) {
                      window.location.href = `tel:${restaurant.phone}`;
                    } else {
                      window.open(reservationUrl, '_blank', 'noopener');
                    }
                  }}
                >
                  <CalendarDays className="w-5 h-5" />
                  {getReservationCTA(reservationProvider, language)}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <div className="mt-4 px-4">
            <h3 className="text-sm font-semibold mb-2">
              {language === 'ru' ? 'Фото' : 'Photos'}
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {galleryImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${restaurant.name_en} ${i + 1}`}
                  className="w-32 h-24 rounded-none object-cover flex-shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 mt-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info" className="gap-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                {language === 'ru' ? 'Инфо' : 'Info'}
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-1.5 text-xs">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                {language === 'ru' ? 'Меню' : 'Menu'}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1.5 text-xs">
                <Star className="w-3.5 h-3.5" />
                {language === 'ru' ? 'Отзывы' : 'Reviews'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="px-4 mt-4 space-y-4">
            {/* Contact */}
            <Card variant="surface">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">
                  {language === 'ru' ? 'Контакты' : 'Contact'}
                </h3>
                
                {restaurant.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{restaurant.address}</span>
                  </div>
                )}
                
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-sm text-primary">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{restaurant.phone}</span>
                  </a>
                )}
                
                {restaurant.email && (
                  <a href={`mailto:${restaurant.email}`} className="flex items-center gap-3 text-sm text-primary">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>{restaurant.email}</span>
                  </a>
                )}
                
                {websiteUrl && (
                  <a 
                    href={websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-primary"
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>{language === 'ru' ? 'Сайт ресторана' : 'Restaurant website'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Reservation Info */}
            {reservationUrl && (
              <Card variant="surface">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm">
                    {language === 'ru' ? 'Бронирование' : 'Reservation'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {reservationProvider === 'chope' && (language === 'ru' ? 'Бронирование через Chope' : 'Book via Chope – free online reservation')}
                    {reservationProvider === 'tablecheck' && (language === 'ru' ? 'Бронирование через TableCheck' : 'Book via TableCheck – instant confirmation')}
                    {reservationProvider === 'sevenrooms' && (language === 'ru' ? 'Бронирование через SevenRooms' : 'Book via SevenRooms')}
                    {reservationProvider === 'website' && (language === 'ru' ? 'Бронирование на сайте ресторана' : 'Book directly on the restaurant website')}
                    {reservationProvider === 'phone' && (language === 'ru' ? 'Позвоните для бронирования' : 'Call the restaurant to make a reservation')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => window.open(reservationUrl, '_blank', 'noopener')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {language === 'ru' ? 'Открыть бронирование' : 'Open reservation page'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Data Quality badge */}
            {r.needs_manual_verification === false && r.last_verified_at && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                ✅ {language === 'ru' ? 'Проверено' : 'Verified'} {new Date(r.last_verified_at).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="px-4 mt-4 space-y-4">
            {menuItems.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {language === 'ru' ? 'Меню скоро появится' : 'Menu coming soon'}
                </p>
                {r.menu_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(r.menu_url, '_blank', 'noopener')}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {language === 'ru' ? 'Посмотреть меню на сайте' : 'View menu on website'}
                  </Button>
                )}
                {reservationUrl && (
                  <p className="text-xs text-muted-foreground mt-3">
                    {language === 'ru' 
                      ? 'Меню доступно на странице бронирования' 
                      : 'Menu may be available on the reservation page'}
                  </p>
                )}
              </div>
            ) : (
              <>
                {menuCategories.map(category => {
                  const items = menuItems.filter(item => item.category_id === category.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={category.id}>
                      <h2 className="text-lg font-semibold mb-3">
                        {language === 'ru' ? category.name_ru : category.name_en}
                      </h2>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.id} className="flex gap-3 p-3 rounded-none bg-card border border-border/50">
                            {item.image && (
                              <img src={item.image} alt="" className="w-16 h-16 rounded-none object-cover shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm">
                                {language === 'ru' ? item.name_ru : item.name_en}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {language === 'ru' ? item.description_ru : item.description_en}
                              </p>
                              <span className="font-bold text-primary text-sm">฿{item.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="px-4 mt-4">
            <ReviewsSection 
              itemType="restaurant" 
              itemId={id || ''} 
              itemName={language === 'ru' ? restaurant.name_ru : restaurant.name_en}
            />
          </div>
        )}

        {/* Cross-sell */}
        <div className="px-4">
          <RelatedServicesSection currentVertical="restaurants" />
        </div>
      </div>
    </AppLayout>
  );
}
