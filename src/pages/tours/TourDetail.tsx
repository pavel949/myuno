import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTour } from "@/hooks/useTours";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { LoadingSpinner } from "@/components/uno/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, Star, Check, Calendar, MapPin, Shield } from "lucide-react";
import { FavoriteButton } from "@/components/uno/FavoriteButton";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { TrustScoreCard } from "@/components/reviews/TrustScoreCard";
import { TrustBadges } from "@/components/uno/TrustBadges";

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { tour, isLoading, error } = useTour(id);

  if (isLoading) return <AppLayout><div className="flex items-center justify-center min-h-screen"><LoadingSpinner size="lg" /></div></AppLayout>;
  if (error || !tour) return <AppLayout><PageContainer><div className="text-center py-12"><p>{t('tours.notFound')}</p><Button onClick={() => navigate('/tours')} className="mt-4">{t('action.back')}</Button></div></PageContainer></AppLayout>;

  const tourName = language === 'ru' ? tour.title_ru : tour.title_en;

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Hero Image */}
        <div className="relative h-72">
          <img src={tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800'} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm" onClick={() => navigate('/tours')}><ArrowLeft className="w-5 h-5" /></Button>
            <FavoriteButton itemId={tour.id} itemType="tour" itemData={{ title: tourName, image: tour.cover_image, price: tour.price }} />
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            {tour.is_featured && (
              <Badge className="bg-yellow-500 text-black border-0 mb-2">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {language === 'ru' ? 'Популярный' : 'Featured'}
              </Badge>
            )}
            <h1 className="text-2xl font-bold text-white mb-2">{tourName}</h1>
            {tour.meeting_point && (
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <MapPin className="w-4 h-4" />
                {tour.meeting_point}
              </div>
            )}
          </div>
        </div>

        <PageContainer className="pb-28">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 py-4 border-b text-center">
            <div>
              <Clock className="w-5 h-5 mx-auto text-primary mb-1" />
              <span className="text-sm font-medium">{tour.duration_hours}h</span>
            </div>
            <div>
              <Users className="w-5 h-5 mx-auto text-primary mb-1" />
              <span className="text-sm font-medium">{tour.max_participants}</span>
            </div>
            <div>
              <Star className="w-5 h-5 mx-auto text-yellow-500 fill-yellow-500 mb-1" />
              <span className="text-sm font-medium">{tour.rating || '—'}</span>
            </div>
            <div>
              <Shield className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <span className="text-sm font-medium">{language === 'ru' ? 'Проверен' : 'Verified'}</span>
            </div>
          </div>

          {/* Trust Badges */}
          {tour.provider_id && (
            <div className="py-4 border-b">
              <TrustBadges providerId={tour.provider_id} />
            </div>
          )}

          {/* Description */}
          <div className="py-4 border-b">
            <h2 className="font-semibold mb-2">{t('tours.description')}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {language === 'ru' ? tour.description_ru : tour.description_en}
            </p>
          </div>

          {/* Highlights */}
          {tour.highlights.length > 0 && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">{t('tours.highlights')}</h2>
              <div className="flex flex-wrap gap-2">
                {tour.highlights.map((h, i) => (
                  <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                    {h}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Itinerary */}
          {tour.itinerary.length > 0 && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">{t('tours.itinerary')}</h2>
              <div className="space-y-3">
                {tour.itinerary.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-14 h-6 rounded-full bg-primary/10 text-xs flex items-center justify-center text-primary font-semibold shrink-0">
                      {item.time}
                    </div>
                    <p className="text-sm">{language === 'ru' ? item.title_ru : item.title_en}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Includes */}
          {tour.includes.length > 0 && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">{t('tours.includes')}</h2>
              <ul className="space-y-2">
                {tour.includes.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Provider Trust Card */}
          {tour.provider_id && (
            <div className="py-4 border-b">
              <h2 className="font-semibold mb-3">
                {language === 'ru' ? 'О провайдере' : 'About Provider'}
              </h2>
              <TrustScoreCard 
                providerId={tour.provider_id}
                trustScore={85}
                isVerified={true}
                stats={{
                  totalBookings: 250,
                  responseRate: 98,
                  responseTime: '< 1h',
                  memberSince: '2022',
                  repeatCustomers: 42,
                }}
              />
            </div>
          )}

          {/* Reviews Section */}
          <div className="py-4">
            <ReviewsSection
              itemType="tour"
              itemId={tour.id}
              itemName={tourName}
            />
          </div>
        </PageContainer>

        {/* Booking Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 safe-area-bottom">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div>
              <span className="text-2xl font-bold text-primary">฿{tour.price?.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-1">{t('tours.perPerson')}</span>
            </div>
            <Button size="lg" onClick={() => navigate(`/tours/${tour.id}/book`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {t('tours.bookNow')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
