import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Button } from '@/components/ui/button';
import { Laptop, Wifi, FileText, Home, Dumbbell, Utensils, Banknote, ArrowRight } from 'lucide-react';

const SECTIONS = [
  { icon: Laptop, labelEn: 'Coworking Spaces', labelRu: 'Коворкинги', descEn: 'Fast WiFi, AC, coffee — from ฿200/day', descRu: 'Быстрый WiFi, кондиционер, кофе — от ฿200/день', path: '/services?category=coworking', color: '#4E7BFF' },
  { icon: Wifi, labelEn: 'SIM & Internet', labelRu: 'SIM и интернет', descEn: 'Tourist SIM comparison, home fiber', descRu: 'Сравнение туристических SIM, домашний интернет', path: '/sim', color: '#06B6D4' },
  { icon: FileText, labelEn: 'Visa Options', labelRu: 'Варианты виз', descEn: 'Tourist, ED, DTV, Elite — which fits you', descRu: 'Туристическая, ED, DTV, Elite — что подходит вам', path: '/visa', color: '#F59E0B' },
  { icon: Home, labelEn: 'Monthly Rentals', labelRu: 'Помесячная аренда', descEn: 'Condos from ฿10k/month', descRu: 'Кондо от ฿10k/месяц', path: '/property?mode=long-term', color: '#00D68F' },
  { icon: Dumbbell, labelEn: 'Fitness & Sports', labelRu: 'Фитнес и спорт', descEn: 'Gyms, MMA, surfing, yoga', descRu: 'Залы, MMA, серфинг, йога', path: '/fitness', color: '#F43F5E' },
  { icon: Utensils, labelEn: 'Cafés & Restaurants', labelRu: 'Кафе и рестораны', descEn: 'Work-friendly spots with good coffee', descRu: 'Места для работы с хорошим кофе', path: '/restaurants?tag=cafe', color: '#F97316' },
  { icon: Banknote, labelEn: 'Banking', labelRu: 'Банки', descEn: 'Thai bank account for nomads', descRu: 'Счёт в тайском банке для номадов', path: '/banking', color: '#A855F7' },
];

export default function NomadGuidePage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="pb-24">
        <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-600 p-6 pt-16 pb-12">
          <BackButton fallbackPath="/" variant="overlay" className="absolute top-4 left-4" />
          <div className="text-white text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Laptop className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold font-display mb-2">
              {t ? 'Гид для номадов' : 'Digital Nomad Guide'}
            </h1>
            <p className="text-white/80 text-sm">
              {t ? 'Работай удалённо с Пхукета — всё что нужно для комфортной жизни' : 'Work remotely from Phuket — everything for a comfortable life'}
            </p>
          </div>
        </div>

        <div className="px-4 py-8 max-w-lg mx-auto space-y-3">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button key={i} onClick={() => navigate(s.path)} className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card text-left transition-all hover:shadow-elevation-2 active:scale-[0.98]">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + '15' }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
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
      </div>
    </AppLayout>
  );
}
