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
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';

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
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    id: 'jets',
    icon: Plane,
    title: 'Private Jets',
    titleRu: 'Частные самолёты',
    description: 'Charter flights, airport VIP services, jet rentals',
    descriptionRu: 'Чартерные рейсы, VIP-услуги в аэропорту, аренда самолётов',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  {
    id: 'chefs',
    icon: ChefHat,
    title: 'Personal Chefs',
    titleRu: 'Персональные повара',
    description: 'Private chefs, catering, exclusive dining experiences',
    descriptionRu: 'Частные повара, кейтеринг, эксклюзивные ужины',
    color: 'text-accent-amber',
    bgColor: 'bg-accent-amber/10',
  },
  {
    id: 'housekeeping',
    icon: Home,
    title: 'Housekeeping & Maids',
    titleRu: 'Горничные и уборка',
    description: 'Daily housekeeping, laundry, villa management',
    descriptionRu: 'Ежедневная уборка, прачечная, управление виллой',
    color: 'text-accent-teal',
    bgColor: 'bg-accent-teal/10',
  },
  {
    id: 'cars',
    icon: Car,
    title: 'Luxury Cars',
    titleRu: 'Люксовые автомобили',
    description: 'Supercars, limousines, chauffeur services',
    descriptionRu: 'Суперкары, лимузины, услуги водителя',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    id: 'yachts',
    icon: Anchor,
    title: 'Boat Charters',
    titleRu: 'Аренда яхт и катеров',
    description: 'Yacht charters, sailing trips, boat parties',
    descriptionRu: 'Аренда яхт, парусные поездки, вечеринки на катере',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    id: 'events',
    icon: Calendar,
    title: 'Private Events',
    titleRu: 'Частные мероприятия',
    description: 'Birthday parties, weddings, corporate events',
    descriptionRu: 'Дни рождения, свадьбы, корпоративы',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  {
    id: 'photography',
    icon: Camera,
    title: 'Photography & Video',
    titleRu: 'Фото и видео',
    description: 'Professional photographers, drone footage, content creation',
    descriptionRu: 'Профессиональные фотографы, съёмка с дрона, создание контента',
    color: 'text-accent-purple',
    bgColor: 'bg-accent-purple/10',
  },
  {
    id: 'personal',
    icon: Users,
    title: 'Personal Assistants',
    titleRu: 'Личные ассистенты',
    description: 'Translators, guides, personal shoppers',
    descriptionRu: 'Переводчики, гиды, персональные шопперы',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'gifts',
    icon: Gift,
    title: 'Luxury Gifts',
    titleRu: 'Люксовые подарки',
    description: 'Exclusive gifts, flower arrangements, surprises',
    descriptionRu: 'Эксклюзивные подарки, цветочные композиции, сюрпризы',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Personal Security',
    titleRu: 'Личная охрана',
    description: 'Bodyguards, secure transport, 24/7 protection',
    descriptionRu: 'Телохранители, безопасный транспорт, круглосуточная защита',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
];

export default function VipConcierge() {
  const { language, t } = useLanguage();

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={t('vip.title')}
          showBack
        />

        {/* Hero Section */}
        <FadeInUp>
          <div className="mb-6 p-6 rounded-3xl bg-gradient-to-br from-accent-purple/20 via-accent-purple/15 to-accent-purple/20 border-2 border-accent-purple/40 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-accent-purple to-accent-purple/80 shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-2xl bg-gradient-to-r from-accent-purple to-accent-purple/80 bg-clip-text text-transparent">
                  UNO VIP
                </h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-accent-purple" />
                  {t('vip.subtitle')}
                </div>
              </div>
            </div>
            
            <p className="text-foreground/80 mb-5 leading-relaxed">
              {t('vip.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:from-accent-purple/90 hover:to-accent-purple/70 text-white font-semibold shadow-lg"
                onClick={() => window.location.href = getTelLink()}
              >
                <Phone className="w-5 h-5 mr-2" />
                {t('vip.callUs')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-accent-purple/50 text-accent-purple hover:bg-accent-purple/10"
                onClick={() => window.open(COMPANY_CONTACTS.whatsapp.link, '_blank')}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>
        </FadeInUp>

        {/* Features */}
        <FadeInUp delay={0.05}>
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-accent-amber/10 to-warning/10 border border-accent-amber/20">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-accent-amber" fill="currentColor" />
              <span className="font-semibold text-accent-amber">
                {t('vip.whyVip')}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li>✓ {t('vip.support247')}</li>
              <li>✓ {t('vip.personalManager')}</li>
              <li>✓ {t('vip.exclusiveAccess')}</li>
              <li>✓ {t('vip.confidentiality')}</li>
            </ul>
          </div>
        </FadeInUp>

        {/* VIP Services Grid */}
        <FadeInUp delay={0.1}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-accent-purple" />
            {t('vip.ourServices')}
          </h3>
        </FadeInUp>

        <AnimatedList className="space-y-3 mb-6">
          {vipServices.map((service) => {
            const Icon = service.icon;
            return (
              <AnimatedItem key={service.id}>
              <div 
                  className="p-4 rounded-2xl border bg-card cursor-pointer hover:border-accent-purple/30 transition-colors"
                  onClick={() => window.open(COMPANY_CONTACTS.whatsapp.link, '_blank')}
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
          <div className="p-5 rounded-2xl bg-gradient-to-r from-accent-purple/10 to-accent-purple/5 border border-accent-purple/20 text-center">
            <Crown className="w-10 h-10 text-accent-purple mx-auto mb-3" />
            <h3 className="font-semibold mb-2">
              {t('vip.readyForVip')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('vip.contactUs')}
            </p>
            <Button
              className="w-full bg-gradient-to-r from-accent-purple to-accent-purple/80 hover:from-accent-purple/90 hover:to-accent-purple/70 text-white"
              onClick={() => window.open(COMPANY_CONTACTS.whatsapp.link, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('vip.messageWhatsApp')}
            </Button>
          </div>
        </FadeInUp>
      </PageContainer>
    </AppLayout>
  );
}
