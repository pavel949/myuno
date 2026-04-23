/**
 * Welcome Flow — The "Last Mile" monetization page
 * 
 * Shown to guests after check-in via QR code or push notification.
 * Personalized service recommendations based on booking context.
 * Airbnb-style clean, friendly design.
 */
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, UtensilsCrossed, Waves, Ship, Flower2, ShoppingCart, 
  Brush, Dumbbell, Heart, Baby, Sparkles, MapPin, 
  ArrowRight, Star, Clock, ChevronRight, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Service cards for welcome flow ──
interface WelcomeService {
  id: string;
  icon: React.ElementType;
  gradient: string;
  path: string;
  labelEn: string;
  labelRu: string;
  subtitleEn: string;
  subtitleRu: string;
  tagEn?: string;
  tagRu?: string;
  popular?: boolean;
}

const WELCOME_SERVICES: WelcomeService[] = [
  {
    id: 'transfer',
    icon: Car,
    gradient: 'from-slate-600 to-slate-800',
    path: '/transport/airport-transfer',
    labelEn: 'Airport Transfer',
    labelRu: 'Трансфер из аэропорта',
    subtitleEn: 'Pre-book your ride home',
    subtitleRu: 'Закажите поездку заранее',
    tagEn: 'Essential',
    tagRu: 'Важно',
    popular: true,
  },
  {
    id: 'restaurants',
    icon: UtensilsCrossed,
    gradient: 'from-orange-400 to-red-500',
    path: '/restaurants',
    labelEn: 'Restaurants',
    labelRu: 'Рестораны',
    subtitleEn: 'Best tables nearby',
    subtitleRu: 'Лучшие места рядом',
    tagEn: 'Popular',
    tagRu: 'Популярно',
    popular: true,
  },
  {
    id: 'experiences',
    icon: MapPin,
    gradient: 'from-emerald-400 to-teal-600',
    path: '/experiences',
    labelEn: 'Tours & Activities',
    labelRu: 'Туры и активности',
    subtitleEn: 'Explore Phuket',
    subtitleRu: 'Исследуйте Пхукет',
    popular: true,
  },
  {
    id: 'yachts',
    icon: Ship,
    gradient: 'from-cyan-400 to-blue-600',
    path: '/yachts',
    labelEn: 'Yacht Charters',
    labelRu: 'Аренда яхт',
    subtitleEn: 'Island hopping trips',
    subtitleRu: 'Морские прогулки',
  },
  {
    id: 'cleaning',
    icon: Brush,
    gradient: 'from-teal-400 to-cyan-500',
    path: '/cleaning',
    labelEn: 'Extra Cleaning',
    labelRu: 'Доп. уборка',
    subtitleEn: 'Professional service',
    subtitleRu: 'Профессионально',
  },
  {
    id: 'grocery',
    icon: ShoppingCart,
    gradient: 'from-green-400 to-emerald-600',
    path: '/market',
    labelEn: 'Grocery Delivery',
    labelRu: 'Доставка продуктов',
    subtitleEn: 'Stock your fridge',
    subtitleRu: 'Наполните холодильник',
  },
  {
    id: 'flowers',
    icon: Flower2,
    gradient: 'from-pink-400 to-rose-500',
    path: '/flowers',
    labelEn: 'Flowers',
    labelRu: 'Цветы',
    subtitleEn: 'Welcome bouquet',
    subtitleRu: 'Букет к приезду',
  },
  {
    id: 'water',
    icon: Waves,
    gradient: 'from-blue-400 to-cyan-500',
    path: '/experiences?type=activity',
    labelEn: 'Water Sports',
    labelRu: 'Водный спорт',
    subtitleEn: 'Diving, surfing & more',
    subtitleRu: 'Дайвинг, сёрфинг',
  },
  {
    id: 'fitness',
    icon: Dumbbell,
    gradient: 'from-violet-400 to-purple-600',
    path: '/fitness',
    labelEn: 'Fitness',
    labelRu: 'Фитнес',
    subtitleEn: 'Gyms & classes',
    subtitleRu: 'Залы и занятия',
  },
  {
    id: 'spa',
    icon: Heart,
    gradient: 'from-rose-300 to-pink-500',
    path: '/beauty',
    labelEn: 'Spa & Beauty',
    labelRu: 'Спа и красота',
    subtitleEn: 'Relax and unwind',
    subtitleRu: 'Расслабьтесь',
  },
  {
    id: 'babysitter',
    icon: Baby,
    gradient: 'from-amber-300 to-orange-400',
    path: '/babysitter',
    labelEn: 'Babysitter',
    labelRu: 'Няня',
    subtitleEn: 'Certified nannies',
    subtitleRu: 'Проверенные няни',
  },
  {
    id: 'concierge',
    icon: Sparkles,
    gradient: 'from-amber-400 to-yellow-500',
    path: '/vip-concierge',
    labelEn: 'VIP Concierge',
    labelRu: 'VIP-консьерж',
    subtitleEn: 'Anything you need',
    subtitleRu: 'Любой запрос',
  },
];

// ── Service Card Component ──
const ServiceCard: React.FC<{ 
  service: WelcomeService; 
  index: number;
  isRu: boolean;
  onNavigate: (path: string) => void;
}> = ({ service, index, isRu, onNavigate }) => {
  const Icon = service.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.3, ease: 'easeOut' }}
      onClick={() => onNavigate(service.path)}
      className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left w-full group"
    >
      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0',
        service.gradient
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-[15px]">
            {isRu ? service.labelRu : service.labelEn}
          </span>
          {service.popular && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              <Star className="w-2.5 h-2.5" />
              {isRu ? (service.tagRu || 'Топ') : (service.tagEn || 'Top')}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {isRu ? service.subtitleRu : service.subtitleEn}
        </p>
      </div>
      
      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </motion.button>
  );
};

// ── Main Welcome Flow Page ──
export default function WelcomeFlow() {
  const { bookingId } = useParams<{ bookingId?: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const firstName = user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || '';
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return isRu ? 'Доброе утро' : 'Good morning';
    if (hour < 18) return isRu ? 'Добрый день' : 'Good afternoon';
    return isRu ? 'Добрый вечер' : 'Good evening';
  }, [isRu]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Split into popular (top picks) and others
  const topPicks = WELCOME_SERVICES.filter(s => s.popular);
  const moreServices = WELCOME_SERVICES.filter(s => !s.popular);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5"
      >
        <div className="px-5 pt-14 pb-8 max-w-lg mx-auto">
          {/* Welcome badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full mb-4"
          >
            <Gift className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              {isRu ? 'Добро пожаловать на Пхукет' : 'Welcome to Phuket'}
            </span>
          </motion.div>
          
          {/* Greeting */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-2xl font-display font-bold text-foreground"
          >
            {greeting}{firstName ? `, ${firstName}` : ''}! 👋
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-muted-foreground mt-2 text-[15px] leading-relaxed"
          >
            {isRu 
              ? 'Подобрали проверенные сервисы для вашего пребывания. Всё в одном месте — выберите нужное.' 
              : 'We have curated verified services for your stay. Everything in one place — pick what you need.'}
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-5 max-w-lg mx-auto pb-32">
        {/* Top picks */}
        <div className="mt-6">
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
          >
            {isRu ? 'Рекомендуем' : 'Recommended for you'}
          </motion.h2>
          
          <div className="space-y-2">
            {topPicks.map((service, i) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={i}
                isRu={isRu}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>

        {/* More services */}
        <div className="mt-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"
          >
            {isRu ? 'Все сервисы' : 'All services'}
          </motion.h2>
          
          <div className="space-y-2">
            {moreServices.map((service, i) => (
              <ServiceCard
                key={service.id}
                service={service}
                index={i + topPicks.length}
                isRu={isRu}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        </div>

        {/* Help banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-8 p-5 bg-card border border-border rounded-2xl text-center"
        >
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="font-medium text-foreground text-[15px]">
            {isRu ? 'Нужна помощь?' : 'Need anything else?'}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            {isRu 
              ? 'Наш консьерж на связи 24/7' 
              : 'Our concierge is available 24/7'}
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate('/support')}
          >
            {isRu ? 'Написать' : 'Get in touch'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>

        {/* Powered by */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Powered by myUNO
        </p>
      </div>
    </div>
  );
}
