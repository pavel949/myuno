import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, 
  Share2, CheckCircle, Users, Dumbbell, Calendar, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';
import { useGym } from '@/hooks/useGyms';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { AppLayout } from '@/components/layout/AppLayout';

const GymDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedImage, setSelectedImage] = useState(0);
  const { gym, isLoading } = useGym(id || '');

  const prices = [
    { type: 'day', price: gym?.price_day_pass || 0, labelEn: 'Day Pass', labelRu: 'Дневной' },
    { type: 'week', price: gym?.price_week_pass || 0, labelEn: 'Weekly', labelRu: 'Недельный' },
    { type: 'month', price: gym?.price_month_pass || 0, labelEn: 'Monthly', labelRu: 'Месячный' },
  ].filter(p => p.price > 0);

  const [selectedPrice, setSelectedPrice] = useState(prices[0]);

  useEffect(() => {
    if (prices.length > 0 && !selectedPrice) {
      setSelectedPrice(prices[0]);
    }
  }, [gym]);

  useEffect(() => {
    if (gym && id) {
      trackView(id, 'gym', {
        name: gym.name_en,
        name_en: gym.name_en,
        name_ru: gym.name_ru,
        image: gym.images?.[0] || gym.cover_image,
        rating: gym.rating,
        price: gym.price_day_pass,
        location: gym.district,
      });
    }
  }, [gym?.id]);

  if (isLoading) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!gym) {
    return (
      <AppLayout showHeader={false} showBottomNav>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Dumbbell className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{language === 'ru' ? 'Зал не найден' : 'Gym not found'}</h2>
          <Button onClick={() => navigate('/fitness')}>
            {language === 'ru' ? 'К списку залов' : 'Back to gyms'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const images = gym.images?.length ? gym.images : [gym.cover_image || PLACEHOLDER_IMAGES.gym];
  const name = language === 'ru' ? gym.name_ru : gym.name_en;
  const description = language === 'ru' ? gym.description_ru : gym.description_en;
  const amenities = gym.amenities || [];
  const classes = gym.classes || [];
  const currentPrice = selectedPrice || prices[0];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-72">
        <img src={images[selectedImage]} alt={name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate('/fitness')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="gym"
              itemId={id || ''}
              itemData={{ title_en: gym.name_en, title_ru: gym.name_ru, image: images[0], price: gym.price_day_pass, location: gym.district }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon"><Share2 className="w-5 h-5" /></Button>
          </div>
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-12 h-12 rounded-none overflow-hidden border-2 ${selectedImage === idx ? 'border-primary' : 'border-white/50'}`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-none relative z-10">
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {gym.is_verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {language === 'ru' ? 'Проверен' : 'Verified'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-warning text-warning" />
                <span className="font-bold">{gym.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{gym.review_count} reviews</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          {gym.district && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" /><span>{gym.district}</span>
            </div>
          )}
          {gym.phone && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="w-4 h-4" /><span>{gym.phone}</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        {prices.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">{language === 'ru' ? 'Выберите абонемент' : 'Select Membership'}</h3>
            <div className="grid grid-cols-3 gap-3">
              {prices.map(price => (
                <button
                  key={price.type}
                  onClick={() => setSelectedPrice(price)}
                  className={`p-3 rounded-none border text-center transition-all ${
                    currentPrice?.type === price.type ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                >
                  <p className="text-lg font-bold text-primary">฿{price.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ru' ? price.labelRu : price.labelEn}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="about" className="mb-24">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="about">{language === 'ru' ? 'О зале' : 'About'}</TabsTrigger>
            <TabsTrigger value="amenities">{language === 'ru' ? 'Удобства' : 'Amenities'}</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            {description && <p className="text-muted-foreground">{description}</p>}
            {gym.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /><span>{gym.address}</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="amenities" className="mt-4">
            {amenities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {amenities.map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{language === 'ru' ? 'Информация будет добавлена' : 'Information coming soon'}</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom CTA */}
      {currentPrice && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ru' ? currentPrice.labelRu : currentPrice.labelEn}</p>
              <p className="text-xl font-bold text-primary">฿{currentPrice.price.toLocaleString()}</p>
            </div>
            <Button size="lg" className="flex-1" onClick={() => navigate(`/fitness/booking/${id}?type=${currentPrice.type}`)}>
              <Calendar className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Записаться' : 'Book Now'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GymDetail;
