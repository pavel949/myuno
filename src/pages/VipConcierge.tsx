import React from 'react';
import { 
  Crown, 
  Sparkles, 
  Phone, 
  MessageCircle,
  Plane,
  Navigation,
  ChefHat,
  Car,
  Anchor,
  Home,
  Camera,
  Users,
  Gift,
  Calendar,
  Shield,
  Star
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { FadeInUp, AnimatedList, AnimatedItem } from '@/components/layout/AnimatedList';
import { cn } from '@/lib/utils';

const UNO_CONCIERGE_PHONE = '+66-XX-XXX-XXXX'; // Replace with actual number
const UNO_WHATSAPP = 'https://wa.me/66XXXXXXXXX'; // Replace with actual WhatsApp

interface VipService {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  description: string;
  descriptionRu: string;
  color: string;
  bgColor: string;
}

const vipServices: VipService[] = [
  {
    id: 'helicopters',
    icon: Navigation,
    title: 'Helicopter Transfers',
    titleRu: 'Вертолётные трансферы',
    description: 'Private helicopter flights, island hopping, aerial tours',
    descriptionRu: 'Частные вертолётные рейсы, полёты на острова, воздушные туры',
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
  },
  {
    id: 'jets',
    icon: Plane,
    title: 'Private Jets',
    titleRu: 'Частные самолёты',
    description: 'Charter flights, airport VIP services, jet rentals',
    descriptionRu: 'Чартерные рейсы, VIP-услуги в аэропорту, аренда самолётов',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    id: 'chefs',
    icon: ChefHat,
    title: 'Personal Chefs',
    titleRu: 'Персональные повара',
    description: 'Private chefs, catering, exclusive dining experiences',
    descriptionRu: 'Частные повара, кейтеринг, эксклюзивные ужины',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    id: 'housekeeping',
    icon: Home,
    title: 'Housekeeping & Maids',
    titleRu: 'Горничные и уборка',
    description: 'Daily housekeeping, laundry, villa management',
    descriptionRu: 'Ежедневная уборка, прачечная, управление виллой',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'cars',
    icon: Car,
    title: 'Luxury Cars',
    titleRu: 'Люксовые автомобили',
    description: 'Supercars, limousines, chauffeur services',
    descriptionRu: 'Суперкары, лимузины, услуги водителя',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  {
    id: 'yachts',
    icon: Anchor,
    title: 'Yachts & Boats',
    titleRu: 'Яхты и катера',
    description: 'Yacht charters, sailing trips, boat parties',
    descriptionRu: 'Аренда яхт, парусные поездки, вечеринки на катере',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'events',
    icon: Calendar,
    title: 'Private Events',
    titleRu: 'Частные мероприятия',
    description: 'Birthday parties, weddings, corporate events',
    descriptionRu: 'Дни рождения, свадьбы, корпоративы',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'photography',
    icon: Camera,
    title: 'Photography & Video',
    titleRu: 'Фото и видео',
    description: 'Professional photographers, drone footage, content creation',
    descriptionRu: 'Профессиональные фотографы, съёмка с дрона, создание контента',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    id: 'personal',
    icon: Users,
    title: 'Personal Assistants',
    titleRu: 'Личные ассистенты',
    description: 'Translators, guides, personal shoppers',
    descriptionRu: 'Переводчики, гиды, персональные шопперы',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'gifts',
    icon: Gift,
    title: 'Luxury Gifts',
    titleRu: 'Люксовые подарки',
    description: 'Exclusive gifts, flower arrangements, surprises',
    descriptionRu: 'Эксклюзивные подарки, цветочные композиции, сюрпризы',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Personal Security',
    titleRu: 'Личная охрана',
    description: 'Bodyguards, secure transport, 24/7 protection',
    descriptionRu: 'Телохранители, безопасный транспорт, круглосуточная защита',
    color: 'text-slate-600',
    bgColor: 'bg-slate-500/10',
  },
];

export default function VipConcierge() {
  const { language } = useLanguage();

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'VIP Консьерж' : 'VIP Concierge'}
          showBack
        />

        {/* Hero Section */}
        <FadeInUp>
          <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 border-2 border-purple-500/40 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-2xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  UNO VIP
                </h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  {language === 'ru' ? 'Люкс консьерж сервис' : 'Luxury Concierge Service'}
                </div>
              </div>
            </div>
            
            <p className="text-foreground/80 mb-5 leading-relaxed">
              {language === 'ru' 
                ? 'Эксклюзивные услуги премиум-класса для взыскательных клиентов. Вертолёты, частные самолёты, персональные повара, яхты, люксовые автомобили и полный спектр VIP-сервисов.' 
                : 'Exclusive premium services for discerning clients. Helicopters, private jets, personal chefs, yachts, luxury cars and full range of VIP services.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold shadow-lg"
                onClick={() => window.location.href = `tel:${UNO_CONCIERGE_PHONE}`}
              >
                <Phone className="w-5 h-5 mr-2" />
                {language === 'ru' ? 'Позвонить' : 'Call Us'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                onClick={() => window.open(UNO_WHATSAPP, '_blank')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </FadeInUp>

        {/* Features */}
        <FadeInUp delay={0.05}>
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
              <span className="font-semibold text-amber-600">
                {language === 'ru' ? 'Почему UNO VIP?' : 'Why UNO VIP?'}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li>✓ {language === 'ru' ? 'Круглосуточная поддержка 24/7' : '24/7 support around the clock'}</li>
              <li>✓ {language === 'ru' ? 'Персональный менеджер' : 'Personal manager'}</li>
              <li>✓ {language === 'ru' ? 'Эксклюзивный доступ' : 'Exclusive access'}</li>
              <li>✓ {language === 'ru' ? 'Конфиденциальность' : 'Confidentiality'}</li>
            </ul>
          </div>
        </FadeInUp>

        {/* VIP Services Grid */}
        <FadeInUp delay={0.1}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-500" />
            {language === 'ru' ? 'Наши услуги' : 'Our Services'}
          </h3>
        </FadeInUp>

        <AnimatedList className="space-y-3 mb-6">
          {vipServices.map((service) => {
            const Icon = service.icon;
            return (
              <AnimatedItem key={service.id}>
                <div 
                  className="p-4 rounded-2xl border bg-card cursor-pointer hover:border-purple-500/30 transition-colors"
                  onClick={() => window.open(UNO_WHATSAPP, '_blank')}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", service.bgColor)}>
                      <Icon className={cn("w-6 h-6", service.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">
                        {language === 'ru' ? service.titleRu : service.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {language === 'ru' ? service.descriptionRu : service.description}
                      </p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </div>
              </AnimatedItem>
            );
          })}
        </AnimatedList>

        {/* Bottom CTA */}
        <FadeInUp delay={0.3}>
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-purple-500/20 text-center">
            <Crown className="w-10 h-10 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">
              {language === 'ru' ? 'Готовы к VIP опыту?' : 'Ready for VIP Experience?'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'ru' 
                ? 'Свяжитесь с нами для персонального предложения' 
                : 'Contact us for a personalized offer'}
            </p>
            <Button
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
              onClick={() => window.open(UNO_WHATSAPP, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Написать в WhatsApp' : 'Message on WhatsApp'}
            </Button>
          </div>
        </FadeInUp>
      </PageContainer>
    </AppLayout>
  );
}
