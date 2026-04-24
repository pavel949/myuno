import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Camera, Anchor, Utensils, Flower2, Music, Car, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';

const SERVICES = [
  { icon: MapPin, labelEn: 'Venues', labelRu: 'Площадки', descEn: 'Beachfront, cliff-top, garden', descRu: 'У океана, на утёсе, в саду', path: '/experiences?tag=wedding-venue', color: 'destructive' },
  { icon: Camera, labelEn: 'Photo & Video', labelRu: 'Фото и видео', descEn: 'Professional teams', descRu: 'Профессиональные команды', path: '/services?category=photography', color: 'accent-purple' },
  { icon: Anchor, labelEn: 'Yacht Ceremony', labelRu: 'Церемония на яхте', descEn: 'Sunset wedding cruise', descRu: 'Свадебный круиз на закате', path: '/yachts', color: 'cluster-live' },
  { icon: Flower2, labelEn: 'Floristry', labelRu: 'Флористика', descEn: 'Tropical arrangements', descRu: 'Тропические композиции', path: '/flowers', color: 'accent-purple' },
  { icon: Utensils, labelEn: 'Catering', labelRu: 'Кейтеринг', descEn: 'From intimate to grand', descRu: 'От камерного до грандиозного', path: '/restaurants?tag=catering', color: 'accent-amber' },
  { icon: Music, labelEn: 'Entertainment', labelRu: 'Развлечения', descEn: 'DJs, bands, performers', descRu: 'DJ, группы, артисты', path: '/experiences?tag=entertainment', color: 'accent-cyan' },
  { icon: Car, labelEn: 'Guest Transport', labelRu: 'Трансфер гостей', descEn: 'Luxury fleet', descRu: 'Люксовый автопарк', path: '/transport', color: 'cluster-arrive' },
];

export default function WeddingLandingPage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();
  const whatsappUrl = 'https://wa.me/66800000000?text=' + encodeURIComponent(t ? 'Здравствуйте! Интересует организация свадьбы' : 'Hello! I am interested in a wedding in Phuket');

  return (
    <LandingLayout
      icon={Heart}
      title={t ? 'Свадьба на Пхукете' : 'Wedding in Phuket'}
      subtitle={t ? 'Организуем свадьбу вашей мечты — от площадки до последнего лепестка' : 'We organize your dream wedding — from venue to the last petal'}
      gradient="from-accent via-accent to-accent"
      heroCta={{ label: t ? 'Обсудить свадьбу' : 'Discuss Your Wedding', onClick: () => window.open(whatsappUrl, '_blank') }}
      whatsappUrl={whatsappUrl}
      whatsappLabel={t ? 'Получить предложение' : 'Get a Quote'}
    >
      <div className="px-4 py-8 max-w-lg mx-auto space-y-3">
        <h2 className="text-xl font-bold font-display text-foreground mb-4 text-center">
          {t ? 'Все сервисы для свадьбы' : 'All Wedding Services'}
        </h2>
        {SERVICES.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={i} onClick={() => navigate(s.path)} className="w-full flex items-center gap-4 p-4 rounded-none border border-border bg-card text-left transition-all hover:[box-shadow:var(--shadow-elevation-2)] ">
              <div className="w-11 h-11 rounded-none flex items-center justify-center shrink-0" style={{ background: tokenColor(s.color, 0.15) }}>
                <Icon className="w-5 h-5" style={{ color: tokenColor(s.color) }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground">{t ? s.labelRu : s.labelEn}</h3>
                <p className="text-xs text-muted-foreground">{t ? s.descRu : s.descEn}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="px-4 py-8 text-center bg-muted/30">
        <p className="text-sm text-muted-foreground mb-2">{t ? 'Средний бюджет свадьбы на Пхукете' : 'Average wedding budget in Phuket'}</p>
        <p className="text-3xl font-bold font-display text-foreground">$10,000 — $50,000</p>
        <p className="text-xs text-muted-foreground mt-1">{t ? 'Комиссия платформы 10% с каждого вендора' : '10% platform commission per vendor'}</p>
      </div>
    </LandingLayout>
  );
}
