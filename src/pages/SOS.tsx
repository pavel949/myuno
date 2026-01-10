import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Shield, 
  Flame, 
  Car, 
  AlertTriangle,
  FileQuestion,
  Heart,
  MessageCircle,
  Star,
  Sparkles,
  Crown,
  Stethoscope,
  Wrench,
  Key,
  ChevronRight,
  Lightbulb,
  WifiOff,
  Download,
  CheckCircle2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { FadeInUp } from '@/components/layout/AnimatedList';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { toast } from 'sonner';

// UNO Emergency Contact
const UNO_EMERGENCY_PHONE = '+66922407355';
const UNO_WHATSAPP = 'https://wa.me/66922407355';

// Quick action buttons for most critical services
const quickActions = [
  { id: 'police', icon: Shield, phone: '1155', label: 'Police', labelRu: 'Полиция', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'ambulance', icon: Heart, phone: '1669', label: 'Ambulance', labelRu: 'Скорая', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'fire', icon: Flame, phone: '199', label: 'Fire', labelRu: 'Пожарные', color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'emergency', icon: AlertTriangle, phone: '191', label: 'Emergency', labelRu: 'SOS', color: 'text-red-500', bg: 'bg-red-500/10' },
];

// Organized by category
const emergencyCategories = [
  {
    id: 'medical',
    icon: Stethoscope,
    title: 'Medical',
    titleRu: 'Медицина',
    color: 'text-rose-500',
    contacts: [
      { name: 'Ambulance', nameRu: 'Скорая помощь', phone: '1669', desc: 'Medical emergencies', descRu: 'Медицинские экстренные случаи' },
      { name: 'Phuket International Hospital', nameRu: 'Пхукет Интернешнл', phone: '076-249-400' },
      { name: 'Bangkok Hospital Phuket', nameRu: 'Бангкок Госпиталь', phone: '076-254-425' },
      { name: 'Dibuk Hospital', nameRu: 'Госпиталь Дибук', phone: '076-254-421' },
    ]
  },
  {
    id: 'police',
    icon: Shield,
    title: 'Police & Safety',
    titleRu: 'Полиция и безопасность',
    color: 'text-blue-500',
    contacts: [
      { name: 'Tourist Police', nameRu: 'Туристическая полиция', phone: '1155', desc: '24/7 English-speaking', descRu: 'Круглосуточно, на английском' },
      { name: 'Emergency Services', nameRu: 'Экстренные службы', phone: '191', desc: 'Fire, ambulance, rescue', descRu: 'Пожарные, скорая, спасатели' },
      { name: 'Traffic Accident', nameRu: 'ДТП', phone: '1193', desc: 'Road accidents', descRu: 'Дорожные происшествия' },
    ]
  },
  {
    id: 'documents',
    icon: FileQuestion,
    title: 'Documents & Money',
    titleRu: 'Документы и деньги',
    color: 'text-purple-500',
    contacts: [
      { name: 'Immigration Phuket', nameRu: 'Иммиграция Пхукет', phone: '076-221-905' },
      { name: 'Immigration Hotline', nameRu: 'Горячая линия иммиграции', phone: '1178' },
      { name: 'Russian Embassy Bangkok', nameRu: 'Посольство РФ Бангкок', phone: '02-234-9824' },
      { name: 'Russian Consulate Phuket', nameRu: 'Консульство РФ Пхукет', phone: '076-510-392' },
    ]
  },
  {
    id: 'transport',
    icon: Car,
    title: 'Transport',
    titleRu: 'Транспорт',
    color: 'text-amber-500',
    contacts: [
      { name: 'Taxi Call Center', nameRu: 'Такси', phone: '1681' },
      { name: 'Phuket Airport', nameRu: 'Аэропорт Пхукета', phone: '076-351-122' },
    ]
  },
];

// Service links
const serviceLinks = [
  { 
    id: 'road', 
    icon: Wrench, 
    title: 'Road Assistance', 
    titleRu: 'Помощь на дороге',
    desc: 'Tow, fuel, battery, tires',
    descRu: 'Эвакуатор, топливо, аккумулятор',
    path: '/services?category=road-assistance',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  { 
    id: 'locksmith', 
    icon: Key, 
    title: 'Locksmith', 
    titleRu: 'Слесарь',
    desc: 'Keys, locks, safes',
    descRu: 'Ключи, замки, сейфы',
    path: '/services?category=locksmith',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10'
  },
];

const tips = [
  { en: 'UNO ALERT provides personal security and emergency help 24/7', ru: 'UNO ALERT — личная безопасность и экстренная помощь 24/7' },
  { en: 'Tourist Police (1155) speaks English and helps tourists', ru: 'Турполиция (1155) говорит по-английски и помогает туристам' },
  { en: 'Save this page offline for emergencies', ru: 'Сохраните эту страницу для офлайн-доступа' },
  { en: 'For snake bites, call 1669 and go to hospital immediately', ru: 'При укусе змеи звоните 1669 и езжайте в больницу' },
];

export default function SOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isOffline, isSOSCached, cacheSOS } = useOfflineStatus();
  const [isCaching, setIsCaching] = useState(false);

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSaveOffline = async () => {
    setIsCaching(true);
    try {
      const success = await cacheSOS();
      if (success) {
        toast.success(
          language === 'ru' 
            ? 'Страница SOS сохранена для офлайн-доступа' 
            : 'SOS page saved for offline access'
        );
      } else {
        toast.error(
          language === 'ru' 
            ? 'Не удалось сохранить. Попробуйте обновить страницу.' 
            : 'Could not save. Try refreshing the page.'
        );
      }
    } catch {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    }
    setIsCaching(false);
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader title="SOS" showBack />

        {/* Offline indicator */}
        {isOffline && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {language === 'ru' ? 'Вы офлайн — данные из кеша' : 'You are offline — using cached data'}
            </span>
          </div>
        )}

        {/* UNO ALERT */}
        <FadeInUp>
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/20 border-2 border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500">
                <Star className="w-4 h-4 text-white" fill="white" />
              </div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                UNO ALERT
              </h2>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            
            <p className="text-sm text-foreground/80 mb-3">
              {language === 'ru' 
                ? 'Личная безопасность и помощь в экстремальных ситуациях. 24/7.' 
                : 'Personal security & emergency assistance. 24/7.'}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                onClick={() => window.location.href = `tel:${UNO_EMERGENCY_PHONE}`}
              >
                <Phone className="w-4 h-4 mr-1.5" />
                {language === 'ru' ? 'Позвонить' : 'Call'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                onClick={() => window.open(UNO_WHATSAPP, '_blank')}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </FadeInUp>

        {/* Quick Actions - 4 big buttons */}
        <FadeInUp delay={0.05}>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleCall(action.phone)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl border transition-all active:scale-95",
                    action.bg, "border-transparent hover:border-current/20"
                  )}
                >
                  <Icon className={cn("w-6 h-6 mb-1", action.color)} />
                  <span className="font-bold text-lg">{action.phone}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {language === 'ru' ? action.labelRu : action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* VIP Concierge Link */}
        <FadeInUp delay={0.1}>
          <button 
            className="w-full mb-5 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-purple-500/30 flex items-center justify-between hover:border-purple-500/50 transition-colors"
            onClick={() => navigate('/vip-concierge')}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm flex items-center gap-1">
                  {language === 'ru' ? 'VIP Консьерж' : 'VIP Concierge'}
                  <Sparkles className="w-3 h-3 text-purple-500" />
                </div>
                <div className="text-xs text-muted-foreground">
                  {language === 'ru' ? 'Вертолёты, яхты, повара...' : 'Helicopters, yachts, chefs...'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-500" />
          </button>
        </FadeInUp>

        {/* Service Links */}
        <FadeInUp delay={0.15}>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {serviceLinks.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => navigate(service.path)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                    service.bg, "border-transparent hover:border-current/20"
                  )}
                >
                  <Icon className={cn("w-5 h-5", service.color)} />
                  <div>
                    <div className="font-medium text-sm">
                      {language === 'ru' ? service.titleRu : service.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {language === 'ru' ? service.descRu : service.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </FadeInUp>

        {/* Emergency Categories */}
        {emergencyCategories.map((category, catIdx) => {
          const CatIcon = category.icon;
          return (
            <FadeInUp key={category.id} delay={0.2 + catIdx * 0.05}>
              <SectionCard className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <CatIcon className={cn("w-5 h-5", category.color)} />
                  <SectionTitle className="mb-0">
                    {language === 'ru' ? category.titleRu : category.title}
                  </SectionTitle>
                </div>
                <div className="space-y-2">
                  {category.contacts.map((contact, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {language === 'ru' ? contact.nameRu : contact.name}
                        </div>
                        {contact.desc && (
                          <div className="text-xs text-muted-foreground">
                            {language === 'ru' ? contact.descRu : contact.desc}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-primary"
                        onClick={() => handleCall(contact.phone)}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        {contact.phone}
                      </Button>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </FadeInUp>
          );
        })}

        {/* Tips */}
        <FadeInUp delay={0.45}>
          <SectionCard className="bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <SectionTitle className="mb-0">
                {language === 'ru' ? 'Советы' : 'Tips'}
              </SectionTitle>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  {language === 'ru' ? tip.ru : tip.en}
                </li>
              ))}
            </ul>
          </SectionCard>
        </FadeInUp>

        {/* Save Offline Button */}
        <FadeInUp delay={0.5}>
          <Button
            variant="outline"
            className="w-full mt-4 gap-2"
            onClick={handleSaveOffline}
            disabled={isCaching}
          >
            {isSOSCached ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {language === 'ru' ? 'Сохранено для офлайн' : 'Saved for offline'}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {isCaching 
                  ? (language === 'ru' ? 'Сохранение...' : 'Saving...') 
                  : (language === 'ru' ? 'Сохранить для офлайн' : 'Save for offline')}
              </>
            )}
          </Button>
        </FadeInUp>

        <div className="h-8" />
      </PageContainer>
    </AppLayout>
  );
}
