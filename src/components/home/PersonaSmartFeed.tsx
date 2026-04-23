/**
 * PersonaSmartFeed — AI-powered recommendations based on active persona.
 * Shows 3-4 relevant service cards below the PersonaSwitcher on the home page.
 */
import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { APP_ROUTES } from '@/lib/config/routes';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Recommendation {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  emoji: string;
}

/** Static persona-based recommendations when no DB data available */
const PERSONA_RECS: Record<UserPersona, { en: Recommendation[]; ru: Recommendation[] }> = {
  tourist: {
    en: [
      { id: 't1', title: 'Airport Transfer', subtitle: 'From ฿800', path: '/transport/airport-transfer', emoji: '🚐' },
      { id: 't2', title: 'Island Tours', subtitle: 'Phi Phi, James Bond', path: '/experiences', emoji: '🏝️' },
      { id: 't3', title: 'Yacht Charter', subtitle: 'Sunset cruise', path: '/yachts', emoji: '⛵' },
    ],
    ru: [
      { id: 't1', title: 'Трансфер из аэропорта', subtitle: 'От ฿800', path: '/transport/airport-transfer', emoji: '🚐' },
      { id: 't2', title: 'Туры по островам', subtitle: 'Пхи-Пхи, Джеймс Бонд', path: '/experiences', emoji: '🏝️' },
      { id: 't3', title: 'Яхта', subtitle: 'Круиз на закате', path: '/yachts', emoji: '⛵' },
    ],
  },
  resident: {
    en: [
      { id: 'r1', title: 'Visa Services', subtitle: 'Extensions & renewals', path: '/visa', emoji: '📋' },
      { id: 'r2', title: 'Medical', subtitle: 'Clinics & insurance', path: '/medical', emoji: '🏥' },
      { id: 'r3', title: 'Home Cleaning', subtitle: 'Weekly service', path: '/cleaning', emoji: '🧹' },
    ],
    ru: [
      { id: 'r1', title: 'Визовые услуги', subtitle: 'Продление и оформление', path: '/visa', emoji: '📋' },
      { id: 'r2', title: 'Медицина', subtitle: 'Клиники и страховки', path: '/medical', emoji: '🏥' },
      { id: 'r3', title: 'Клининг', subtitle: 'Еженедельная уборка', path: '/cleaning', emoji: '🧹' },
    ],
  },
  property_owner: {
    en: [
      { id: 'o1', title: 'Property Dashboard', subtitle: 'Manage bookings', path: '/owner', emoji: '📊' },
      { id: 'o2', title: 'Cleaning Service', subtitle: 'For your guests', path: '/cleaning', emoji: '✨' },
      { id: 'o3', title: 'Maintenance', subtitle: 'Repairs & service', path: '/services', emoji: '🔧' },
    ],
    ru: [
      { id: 'o1', title: 'Панель управления', subtitle: 'Бронирования', path: '/owner', emoji: '📊' },
      { id: 'o2', title: 'Клининг', subtitle: 'Для гостей', path: '/cleaning', emoji: '✨' },
      { id: 'o3', title: 'Обслуживание', subtitle: 'Ремонт и сервис', path: '/services', emoji: '🔧' },
    ],
  },
  investor: {
    en: [
      { id: 'i1', title: 'New Projects', subtitle: 'Off-plan deals', path: APP_ROUTES.OFFPLAN, emoji: '🏗️' },
      { id: 'i2', title: 'ROI Calculator', subtitle: 'Estimate returns', path: '/invest', emoji: '📈' },
      { id: 'i3', title: 'Due Diligence', subtitle: 'AI-powered checks', path: '/invest', emoji: '🔍' },
    ],
    ru: [
      { id: 'i1', title: 'Новостройки', subtitle: 'Off-plan проекты', path: APP_ROUTES.OFFPLAN, emoji: '🏗️' },
      { id: 'i2', title: 'ROI калькулятор', subtitle: 'Рассчитать доходность', path: '/invest', emoji: '📈' },
      { id: 'i3', title: 'Due Diligence', subtitle: 'AI-проверка', path: '/invest', emoji: '🔍' },
    ],
  },
  family: {
    en: [
      { id: 'f1', title: 'International Schools', subtitle: 'Top-rated', path: '/education', emoji: '🎓' },
      { id: 'f2', title: 'Pediatrician', subtitle: 'English-speaking', path: '/medical', emoji: '👶' },
      { id: 'f3', title: 'Kids Activities', subtitle: 'Fun for all ages', path: '/experiences?tag=family', emoji: '🎠' },
    ],
    ru: [
      { id: 'f1', title: 'Международные школы', subtitle: 'С аккредитацией', path: '/education', emoji: '🎓' },
      { id: 'f2', title: 'Педиатр', subtitle: 'Англоговорящие', path: '/medical', emoji: '👶' },
      { id: 'f3', title: 'Детские активности', subtitle: 'Для всех возрастов', path: '/experiences?tag=family', emoji: '🎠' },
    ],
  },
  couple: {
    en: [
      { id: 'c1', title: 'Couples Spa', subtitle: 'Relaxation for two', path: '/beauty?category=spa', emoji: '💆' },
      { id: 'c2', title: 'Romantic Dinner', subtitle: 'Beachfront dining', path: '/restaurants?tag=romantic', emoji: '🕯️' },
      { id: 'c3', title: 'Sunset Yacht', subtitle: 'Private cruise', path: '/yachts', emoji: '🌅' },
    ],
    ru: [
      { id: 'c1', title: 'Спа для двоих', subtitle: 'Релакс вместе', path: '/beauty?category=spa', emoji: '💆' },
      { id: 'c2', title: 'Романтический ужин', subtitle: 'У океана', path: '/restaurants?tag=romantic', emoji: '🕯️' },
      { id: 'c3', title: 'Яхта на закате', subtitle: 'Приватный круиз', path: '/yachts', emoji: '🌅' },
    ],
  },
  nightlife: {
    en: [
      { id: 'n1', title: 'Beach Clubs', subtitle: 'Open tonight', path: '/experiences?tag=nightlife', emoji: '🎵' },
      { id: 'n2', title: 'VIP Tables', subtitle: 'Skip the line', path: '/experiences?tag=vip', emoji: '🥂' },
      { id: 'n3', title: 'Yacht Party', subtitle: 'Weekend special', path: '/yachts', emoji: '🛥️' },
    ],
    ru: [
      { id: 'n1', title: 'Бич-клабы', subtitle: 'Открыто сегодня', path: '/experiences?tag=nightlife', emoji: '🎵' },
      { id: 'n2', title: 'VIP-столы', subtitle: 'Без очереди', path: '/experiences?tag=vip', emoji: '🥂' },
      { id: 'n3', title: 'Яхт-пати', subtitle: 'Выходные', path: '/yachts', emoji: '🛥️' },
    ],
  },
  active: {
    en: [
      { id: 'a1', title: 'Surf Lessons', subtitle: 'All levels', path: '/experiences?tag=surf', emoji: '🏄' },
      { id: 'a2', title: 'Muay Thai', subtitle: 'Train like a pro', path: '/experiences?tag=mma', emoji: '🥊' },
      { id: 'a3', title: 'Scuba Diving', subtitle: 'PADI certified', path: '/experiences?tag=diving', emoji: '🤿' },
    ],
    ru: [
      { id: 'a1', title: 'Уроки серфинга', subtitle: 'Любой уровень', path: '/experiences?tag=surf', emoji: '🏄' },
      { id: 'a2', title: 'Муай-тай', subtitle: 'Тренировки с профи', path: '/experiences?tag=mma', emoji: '🥊' },
      { id: 'a3', title: 'Дайвинг', subtitle: 'Сертификат PADI', path: '/experiences?tag=diving', emoji: '🤿' },
    ],
  },
  business: {
    en: [
      { id: 'b1', title: 'Business Lawyer', subtitle: 'Company setup & contracts', path: '/legal', emoji: '⚖️' },
      { id: 'b2', title: 'Thai Bank Account', subtitle: 'For companies & founders', path: '/banking', emoji: '🏦' },
      { id: 'b3', title: 'Coworking & Office', subtitle: 'Workspaces', path: '/services?category=coworking', emoji: '💻' },
    ],
    ru: [
      { id: 'b1', title: 'Корпоративный юрист', subtitle: 'Компания и договоры', path: '/legal', emoji: '⚖️' },
      { id: 'b2', title: 'Счёт в банке', subtitle: 'Для бизнеса и фаундеров', path: '/banking', emoji: '🏦' },
      { id: 'b3', title: 'Офис и коворкинг', subtitle: 'Рабочие пространства', path: '/services?category=coworking', emoji: '💻' },
    ],
  },
  nomad: {
    en: [
      { id: 'nm1', title: 'SIM & Internet', subtitle: 'Stay connected', path: '/services?category=connectivity', emoji: '📶' },
      { id: 'nm2', title: 'Long-term Rental', subtitle: 'Monthly deals', path: '/property?mode=long-term', emoji: '🏠' },
      { id: 'nm3', title: 'Work-friendly Cafés', subtitle: 'Laptop-friendly spots', path: '/restaurants?tag=cafe', emoji: '☕' },
    ],
    ru: [
      { id: 'nm1', title: 'SIM и интернет', subtitle: 'Оставайтесь на связи', path: '/services?category=connectivity', emoji: '📶' },
      { id: 'nm2', title: 'Долгосрочная аренда', subtitle: 'Помесячно', path: '/property?mode=long-term', emoji: '🏠' },
      { id: 'nm3', title: 'Кафе для работы', subtitle: 'С ноутбуком', path: '/restaurants?tag=cafe', emoji: '☕' },
    ],
  },
  pet_owner: {
    en: [
      { id: 'p1', title: 'Find a Vet', subtitle: '24/7 clinics', path: '/pets?category=veterinary', emoji: '🏥' },
      { id: 'p2', title: 'Pet Grooming', subtitle: 'Verified salons', path: '/pets?category=grooming', emoji: '✂️' },
      { id: 'p3', title: 'Pet Hotel', subtitle: 'While you travel', path: '/pets?category=hotel', emoji: '🏨' },
    ],
    ru: [
      { id: 'p1', title: 'Найти ветеринара', subtitle: 'Клиники 24/7', path: '/pets?category=veterinary', emoji: '🏥' },
      { id: 'p2', title: 'Груминг', subtitle: 'Проверенные салоны', path: '/pets?category=grooming', emoji: '✂️' },
      { id: 'p3', title: 'Отель для питомцев', subtitle: 'Пока вы в поездке', path: '/pets?category=hotel', emoji: '🏨' },
    ],
  },
  relocation: {
    en: [
      { id: 'rl1', title: 'Free Consultation', subtitle: 'Relocation roadmap', path: '/relocate', emoji: '🗺️' },
      { id: 'rl2', title: 'Find Housing', subtitle: 'Long-term rentals', path: '/property?mode=long-term', emoji: '🏡' },
      { id: 'rl3', title: 'Schools for Kids', subtitle: 'International schools', path: '/education', emoji: '🎓' },
    ],
    ru: [
      { id: 'rl1', title: 'Бесплатная консультация', subtitle: 'Дорожная карта переезда', path: '/relocate', emoji: '🗺️' },
      { id: 'rl2', title: 'Найти жильё', subtitle: 'Долгосрочная аренда', path: '/property?mode=long-term', emoji: '🏡' },
      { id: 'rl3', title: 'Школы для детей', subtitle: 'Международные школы', path: '/education', emoji: '🎓' },
    ],
  },
  real_estate_developer: {
    en: [
      { id: 'd1', title: 'Developer landing', subtitle: 'Projects & leads', path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, emoji: '🏗️' },
      { id: 'd2', title: 'Newbuilds showcase', subtitle: 'Premium placement', path: APP_ROUTES.NEWBUILDS, emoji: '📣' },
      { id: 'd3', title: 'Developer directory', subtitle: 'Join the catalog', path: APP_ROUTES.DEVELOPERS, emoji: '📇' },
    ],
    ru: [
      { id: 'd1', title: 'Страница застройщика', subtitle: 'Проекты и лиды', path: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, emoji: '🏗️' },
      { id: 'd2', title: 'Витрина новостроек', subtitle: 'Премиальное размещение', path: APP_ROUTES.NEWBUILDS, emoji: '📣' },
      { id: 'd3', title: 'Каталог девелоперов', subtitle: 'Подключиться', path: APP_ROUTES.DEVELOPERS, emoji: '📇' },
    ],
  },
  local_services_provider: {
    en: [
      { id: 'l1', title: 'Partner landing', subtitle: 'Marketplace & payouts', path: APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS, emoji: '🤝' },
      { id: 'l2', title: 'Become a partner', subtitle: 'Vendor onboarding', path: APP_ROUTES.VENDOR_JOIN, emoji: '✅' },
      { id: 'l3', title: 'List with us', subtitle: 'Services or inventory', path: APP_ROUTES.LIST_WITH_US, emoji: '📝' },
    ],
    ru: [
      { id: 'l1', title: 'Страница партнёра', subtitle: 'Маркетплейс и выплаты', path: APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS, emoji: '🤝' },
      { id: 'l2', title: 'Стать партнёром', subtitle: 'Онбординг вендора', path: APP_ROUTES.VENDOR_JOIN, emoji: '✅' },
      { id: 'l3', title: 'Разместить у нас', subtitle: 'Услуги или каталог', path: APP_ROUTES.LIST_WITH_US, emoji: '📝' },
    ],
  },
};

export const PersonaSmartFeed = memo(function PersonaSmartFeed() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { personas } = useUserPersonas();
  
  const activePersona = useMemo(() => personas[0] ?? 'tourist', [personas]);
  const info = PERSONA_INFO[activePersona];
  const recs = useMemo(() => {
    const lang = isRu ? 'ru' : 'en';
    return PERSONA_RECS[activePersona]?.[lang] || PERSONA_RECS.tourist[lang];
  }, [activePersona, isRu]);

  if (recs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {isRu ? `Для вас · ${info.labelRu}` : `For you · ${info.labelEn}`}
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3">
        {recs.map((rec) => (
          <button
            key={rec.id}
            onClick={() => navigate(rec.path)}
            className="min-w-[200px] lg:min-w-0 flex items-center gap-3 p-3.5 rounded-[var(--radius-md)] text-left transition-all active:scale-[0.97] hover:shadow-elevation-2"
            style={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(0 0% 100% / 0.07)',
            }}
          >
            <span className="text-2xl shrink-0">{rec.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{rec.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{rec.subtitle}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
});
