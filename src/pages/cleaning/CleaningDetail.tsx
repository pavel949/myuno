import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Star, Shield, Calendar, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { DetailPageHeader } from '@/components/uno/DetailPageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const cleaningServices = [
  {
    id: 'clean-1',
    type: 'home',
    nameEn: 'Regular Home Cleaning',
    nameRu: 'Регулярная уборка',
    descEn: 'Weekly or bi-weekly home cleaning service. Our professional team will thoroughly clean your home including floors, surfaces, bathrooms, and kitchen.',
    descRu: 'Еженедельная уборка дома. Наша профессиональная команда тщательно уберёт ваш дом, включая полы, поверхности, ванные комнаты и кухню.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
    priceFrom: 800,
    duration: '2-3h',
    rating: 4.9,
    reviewCount: 234,
    provider: 'Clean House Phuket',
    includes: ['Floor cleaning', 'Surface dusting', 'Bathroom cleaning', 'Kitchen cleaning', 'Trash removal'],
    includesRu: ['Мытьё полов', 'Протирка поверхностей', 'Уборка ванной', 'Уборка кухни', 'Вынос мусора'],
  },
  {
    id: 'clean-2',
    type: 'deep',
    nameEn: 'Deep Cleaning',
    nameRu: 'Генеральная уборка',
    descEn: 'Complete deep clean of your entire home. We will clean every corner, including hard-to-reach areas, appliances, and detailed furniture cleaning.',
    descRu: 'Полная генеральная уборка вашего дома. Мы уберём каждый уголок, включая труднодоступные места, бытовую технику и детальную чистку мебели.',
    image: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800',
    priceFrom: 2500,
    duration: '4-6h',
    rating: 4.8,
    reviewCount: 156,
    provider: 'Pro Cleaners',
    includes: ['All regular cleaning', 'Inside appliances', 'Window cleaning', 'Detailed furniture', 'Cabinet interiors'],
    includesRu: ['Вся обычная уборка', 'Внутри техники', 'Мытьё окон', 'Детальная чистка мебели', 'Внутри шкафов'],
  },
  {
    id: 'clean-3',
    type: 'laundry',
    nameEn: 'Laundry & Ironing',
    nameRu: 'Стирка и глажка',
    descEn: 'Pickup, wash, iron and deliver. We handle your laundry with care using premium detergents and professional equipment.',
    descRu: 'Заберём, постираем, погладим и доставим. Мы бережно обращаемся с вашим бельём, используя премиальные средства и профессиональное оборудование.',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800',
    priceFrom: 200,
    duration: '24h',
    rating: 4.7,
    reviewCount: 312,
    provider: 'Fresh Laundry',
    includes: ['Pickup service', 'Washing', 'Ironing', 'Delivery', 'Premium detergents'],
    includesRu: ['Забор белья', 'Стирка', 'Глажка', 'Доставка', 'Премиальные средства'],
  },
  {
    id: 'clean-4',
    type: 'office',
    nameEn: 'Office Cleaning',
    nameRu: 'Уборка офиса',
    descEn: 'Professional office cleaning services. Keep your workspace clean and healthy for your employees and clients.',
    descRu: 'Профессиональная уборка офисов. Поддерживайте чистоту и здоровую атмосферу для сотрудников и клиентов.',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    priceFrom: 1500,
    duration: '3-4h',
    rating: 4.9,
    reviewCount: 89,
    provider: 'Corporate Clean',
    includes: ['Desk cleaning', 'Floor cleaning', 'Restroom sanitation', 'Trash removal', 'Window cleaning'],
    includesRu: ['Чистка столов', 'Мытьё полов', 'Санитарная обработка туалетов', 'Вынос мусора', 'Мытьё окон'],
  },
  {
    id: 'clean-5',
    type: 'home',
    nameEn: 'Move-in/out Cleaning',
    nameRu: 'Уборка при въезде/выезде',
    descEn: 'Perfect for moving apartments. We will make sure your old place is spotless for the next tenant or your new home is fresh and clean.',
    descRu: 'Идеально при смене квартиры. Мы позаботимся о том, чтобы ваше старое место было безупречно чистым для следующего жильца, или ваш новый дом был свежим и чистым.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    priceFrom: 3000,
    duration: '5-7h',
    rating: 4.8,
    reviewCount: 78,
    provider: 'Clean House Phuket',
    includes: ['Deep cleaning', 'Appliance cleaning', 'Cabinet interiors', 'All surfaces', 'Balcony cleaning'],
    includesRu: ['Генеральная уборка', 'Чистка техники', 'Внутри шкафов', 'Все поверхности', 'Уборка балкона'],
  },
  {
    id: 'clean-6',
    type: 'laundry',
    nameEn: 'Dry Cleaning',
    nameRu: 'Химчистка',
    descEn: 'Premium dry cleaning for delicate items. We specialize in suits, dresses, silk, and other delicate fabrics.',
    descRu: 'Химчистка деликатных вещей. Мы специализируемся на костюмах, платьях, шёлке и других деликатных тканях.',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800',
    priceFrom: 300,
    duration: '48h',
    rating: 4.6,
    reviewCount: 145,
    provider: 'Deluxe Dry Clean',
    includes: ['Suits', 'Dresses', 'Silk items', 'Delicate fabrics', 'Express service available'],
    includesRu: ['Костюмы', 'Платья', 'Шёлковые изделия', 'Деликатные ткани', 'Доступен экспресс'],
  },
];

export default function CleaningDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const service = cleaningServices.find(s => s.id === id) || cleaningServices[0];
  const name = language === 'ru' ? service.nameRu : service.nameEn;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: language === 'ru' ? service.descRu : service.descEn,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-28 px-0">
        {/* Hero Image with Overlay Header */}
        <div className="relative h-56">
          <img 
            src={service.image} 
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <DetailPageHeader fallbackPath="/cleaning" onShare={handleShare} />
        </div>

        {/* Service Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ru' ? service.nameRu : service.nameEn}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{service.provider}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{service.rating}</span>
              <span className="text-muted-foreground">({service.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{service.duration}</span>
            </div>
          </div>

          <p className="text-muted-foreground">
            {language === 'ru' ? service.descRu : service.descEn}
          </p>

          {/* What's Included */}
          <div className="bg-card rounded-2xl border p-5">
            <h3 className="font-semibold mb-4">
              {language === 'ru' ? 'Что включено' : "What's Included"}
            </h3>
            <div className="space-y-2">
              {(language === 'ru' ? service.includesRu : service.includes).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm">
              {language === 'ru' 
                ? 'Все специалисты проверены и застрахованы'
                : 'All specialists are verified and insured'}
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4 z-50">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'От' : 'From'}
              </p>
              <p className="text-2xl font-bold text-primary">
                ฿{service.priceFrom}
              </p>
            </div>
            <Button 
              size="lg" 
              className="flex-1 gap-2"
              onClick={() => navigate(`/cleaning/${service.id}/book`)}
            >
              <Calendar className="w-5 h-5" />
              {language === 'ru' ? 'Забронировать' : 'Book Now'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
