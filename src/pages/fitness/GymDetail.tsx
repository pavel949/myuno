import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Clock, Phone, Globe, 
  Share2, CheckCircle, Users, Dumbbell, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { FavoriteButton } from '@/components/uno/FavoriteButton';
import { useViewHistory } from '@/hooks/useViewHistory';

const gymData = {
  id: 'gym-1',
  name: 'Tiger Muay Thai',
  nameRu: 'Тигр Муай Тай',
  type: 'muay-thai',
  images: [
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
    'https://images.unsplash.com/photo-1517438322307-e67f79e99d32?w=800',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  ],
  rating: 4.9,
  reviewCount: 456,
  location: 'Chalong',
  locationRu: 'Чалонг',
  address: '7/35 Moo 5, Soi Ta-iad, Ao Chalong, Phuket 83130',
  phone: '+66 76 367 071',
  website: 'tigermuaythai.com',
  descriptionEn: 'World-famous Muay Thai training camp offering professional training for all levels. State-of-the-art facilities, experienced trainers, and a supportive community.',
  descriptionRu: 'Всемирно известный тренировочный лагерь по муай-тай, предлагающий профессиональные тренировки для всех уровней. Современное оборудование, опытные тренеры и поддерживающее сообщество.',
  isVerified: true,
  hours: '06:00 - 21:00',
  prices: [
    { type: 'day', price: 800, labelEn: 'Day Pass', labelRu: 'Дневной' },
    { type: 'week', price: 4500, labelEn: 'Weekly', labelRu: 'Недельный' },
    { type: 'month', price: 15000, labelEn: 'Monthly', labelRu: 'Месячный' },
  ],
  amenities: [
    { icon: 'ring', labelEn: '3 Boxing Rings', labelRu: '3 Ринга' },
    { icon: 'mma', labelEn: 'MMA Cage', labelRu: 'MMA Клетка' },
    { icon: 'gym', labelEn: 'Fitness Center', labelRu: 'Фитнес Зал' },
    { icon: 'pool', labelEn: 'Swimming Pool', labelRu: 'Бассейн' },
    { icon: 'sauna', labelEn: 'Sauna', labelRu: 'Сауна' },
    { icon: 'restaurant', labelEn: 'Restaurant', labelRu: 'Ресторан' },
  ],
  classes: [
    { time: '07:00', name: 'Morning Muay Thai', nameRu: 'Утренний Муай Тай', duration: 120, trainer: 'Kru Dam' },
    { time: '09:30', name: 'Fitness Class', nameRu: 'Фитнес', duration: 60, trainer: 'Coach Mike' },
    { time: '14:00', name: 'Beginner Muay Thai', nameRu: 'Муай Тай для начинающих', duration: 90, trainer: 'Kru Phet' },
    { time: '16:00', name: 'Advanced Sparring', nameRu: 'Продвинутый спарринг', duration: 90, trainer: 'Kru Dam' },
    { time: '18:00', name: 'Evening Muay Thai', nameRu: 'Вечерний Муай Тай', duration: 120, trainer: 'Kru Tong' },
  ],
  trainers: [
    { name: 'Kru Dam', specialty: 'Muay Thai', experience: '15 years', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200' },
    { name: 'Kru Phet', specialty: 'Clinch Work', experience: '12 years', image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200' },
    { name: 'Coach Mike', specialty: 'S&C', experience: '10 years', image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=200' },
  ],
};

const GymDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { trackView } = useViewHistory();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState(gymData.prices[0]);

  // Track view when page loads
  useEffect(() => {
    if (id) {
      trackView(id, 'gym', {
        name: gymData.name,
        name_en: gymData.name,
        name_ru: gymData.nameRu,
        image: gymData.images[0],
        rating: gymData.rating,
        price: gymData.prices[0].price,
        location: gymData.location,
      });
    }
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={gymData.images[selectedImage]}
          alt={gymData.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button variant="secondary" size="icon" onClick={() => navigate('/fitness')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <FavoriteButton
              itemType="gym"
              itemId={id || 'gym-1'}
              itemData={{
                title_en: gymData.name,
                title_ru: gymData.nameRu,
                image: gymData.images[0],
                price: gymData.prices[0].price,
                location: gymData.location,
              }}
              variant="secondary"
            />
            <Button variant="secondary" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Image Thumbnails */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
          {gymData.images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                selectedImage === idx ? 'border-primary' : 'border-white/50'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        {/* Title Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? gymData.nameRu : gymData.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {gymData.isVerified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {language === 'ru' ? 'Проверен' : 'Verified'}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{gymData.rating}</span>
              </div>
              <p className="text-sm text-muted-foreground">{gymData.reviewCount} reviews</p>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{language === 'ru' ? gymData.locationRu : gymData.location}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{gymData.hours}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Phone className="w-4 h-4" />
            <span>{gymData.phone}</span>
          </div>
        </div>

        {/* Pricing Options */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">
            {language === 'ru' ? 'Выберите абонемент' : 'Select Membership'}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {gymData.prices.map(price => (
              <button
                key={price.type}
                onClick={() => setSelectedPrice(price)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedPrice.type === price.type
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <p className="text-lg font-bold text-primary">฿{price.price.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? price.labelRu : price.labelEn}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mb-24">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="about">
              {language === 'ru' ? 'О зале' : 'About'}
            </TabsTrigger>
            <TabsTrigger value="classes">
              {language === 'ru' ? 'Занятия' : 'Classes'}
            </TabsTrigger>
            <TabsTrigger value="trainers">
              {language === 'ru' ? 'Тренеры' : 'Trainers'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-4 space-y-4">
            <p className="text-muted-foreground">
              {language === 'ru' ? gymData.descriptionRu : gymData.descriptionEn}
            </p>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'ru' ? 'Удобства' : 'Amenities'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {gymData.amenities.map(amenity => (
                  <div key={amenity.icon} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>{language === 'ru' ? amenity.labelRu : amenity.labelEn}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classes" className="mt-4 space-y-3">
            {gymData.classes.map((cls, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-primary">{cls.time}</p>
                    <p className="text-xs text-muted-foreground">{cls.duration}min</p>
                  </div>
                  <div>
                    <p className="font-medium">{language === 'ru' ? cls.nameRu : cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.trainer}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  {language === 'ru' ? 'Записаться' : 'Book'}
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="trainers" className="mt-4 space-y-3">
            {gymData.trainers.map((trainer, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-card rounded-xl border border-border">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-semibold">{trainer.name}</p>
                  <p className="text-sm text-muted-foreground">{trainer.specialty}</p>
                  <p className="text-xs text-primary">{trainer.experience}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {language === 'ru' ? selectedPrice.labelRu : selectedPrice.labelEn}
            </p>
            <p className="text-xl font-bold text-primary">
              ฿{selectedPrice.price.toLocaleString()}
            </p>
          </div>
          <Button 
            size="lg" 
            className="flex-1"
            onClick={() => navigate(`/fitness/booking/${id}?type=${selectedPrice.type}`)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {language === 'ru' ? 'Записаться' : 'Book Now'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GymDetail;