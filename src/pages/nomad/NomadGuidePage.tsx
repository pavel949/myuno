import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingLayout } from '@/components/miniapp/LandingLayout';
import { Laptop, Wifi, FileText, Home, Dumbbell, Utensils, Banknote, ArrowRight } from 'lucide-react';
import { tokenColor } from '@/lib/utils/hslAlpha';

const SECTIONS = [
  { icon: Laptop, labelEn: 'Coworking Spaces', labelRu: 'Коворкинги', descEn: 'Fast WiFi, AC, coffee — from ฿200/day', descRu: 'Быстрый WiFi, кондиционер, кофе — от ฿200/день', path: '/services?category=coworking', color: 'cluster-live' },
  { icon: Wifi, labelEn: 'SIM & Internet', labelRu: 'SIM и интернет', descEn: 'Tourist SIM comparison, home fiber', descRu: 'Сравнение туристических SIM, домашний интернет', path: '/sim', color: 'accent-cyan' },
  { icon: FileText, labelEn: 'Visa Options', labelRu: 'Варианты виз', descEn: 'Tourist, ED, DTV, Elite — which fits you', descRu: 'Туристическая, ED, DTV, Elite — что подходит вам', path: '/visa', color: 'accent-amber' },
  { icon: Home, labelEn: 'Monthly Rentals', labelRu: 'Помесячная аренда', descEn: 'Condos from ฿10k/month', descRu: 'Кондо от ฿10k/месяц', path: '/property?mode=long-term', color: 'cluster-arrive' },
  { icon: Dumbbell, labelEn: 'Fitness & Sports', labelRu: 'Фитнес и спорт', descEn: 'Gyms, MMA, surfing, yoga', descRu: 'Залы, MMA, серфинг, йога', path: '/fitness', color: 'destructive' },
  { icon: Utensils, labelEn: 'Cafés & Restaurants', labelRu: 'Кафе и рестораны', descEn: 'Work-friendly spots with good coffee', descRu: 'Места для работы с хорошим кофе', path: '/restaurants?tag=cafe', color: 'accent-coral' },
  { icon: Banknote, labelEn: 'Banking', labelRu: 'Банки', descEn: 'Thai bank account for nomads', descRu: 'Счёт в тайском банке для номадов', path: '/banking', color: 'accent-purple' },
];

export default function NomadGuidePage() {
  const { language } = useLanguage();
  const t = language === 'ru';
  const navigate = useNavigate();

  return (
    <LandingLayout
      icon={Laptop}
      title={t ? 'Гид для номадов' : 'Digital Nomad Guide'}
      subtitle={t ? 'Работай удалённо с Пхукета — всё для комфортной жизни' : 'Work remotely from Phuket — everything for a comfortable life'}
      gradient="from-success via-success to-primary"
    >
      <div className="px-4 py-8 max-w-lg mx-auto space-y-3">
        {SECTIONS.map((s, i) => {
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
    </LandingLayout>
  );
}
