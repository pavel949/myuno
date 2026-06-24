import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Star,
  Sparkles,
  Crown,
  Wrench,
  Key,
  ChevronRight,
  Lightbulb,
  WifiOff,
  Download,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { toast } from 'sonner';
import { COMPANY_CONTACTS, getTelLink } from '@/lib/config/contacts';
import { OfflineEmergencyCard } from '@/components/home/OfflineEmergencyCard';
import {
  getEmergencyContacts,
  sanitizeTelNumber,
  EMERGENCY_TONE_CLASSES,
} from '@/lib/emergency/contacts';
import { EMERGENCY_TIP_CATEGORIES } from '@/lib/emergency/tips';

const { quickDial: quickActions, categories: emergencyCategories } = getEmergencyContacts('phuket');

// Service links — app navigation shortcuts (not emergency contacts)
const serviceLinks = [
  {
    id: 'road',
    icon: Wrench,
    title: 'Road Assistance',
    titleRu: 'Помощь на дороге',
    desc: 'Tow, fuel, battery, tires',
    descRu: 'Эвакуатор, топливо, аккумулятор',
    path: '/services?category=road-assistance',
    color: 'text-accent',
    bg: 'bg-accent/10'
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

export default function SOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isOffline, isSOSCached, cacheSOS } = useOfflineStatus();
  const [isCaching, setIsCaching] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${sanitizeTelNumber(phone)}`;
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
    <AppLayout showHeader={false}>
      <PageContainer>
        <PageHeader title="SOS" showBack fallbackPath="/" />

        {/* Offline indicator + Emergency Card */}
        {isOffline && (
          <div className="mb-4 space-y-3">
            <div className="p-3 rounded-none bg-warning/10 border border-warning/30 flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-warning" />
              <span className="text-sm text-warning font-medium">
                {language === 'ru' ? 'Вы офлайн — данные из кеша' : 'You are offline — using cached data'}
              </span>
            </div>
            <OfflineEmergencyCard />
          </div>
        )}

        {/* UNO ALERT */}
        <div className="mb-5 p-4 rounded-none bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-primary">
              <Star className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <h2 className="font-bold text-lg text-foreground">
              UNO ALERT
            </h2>
          </div>

          <p className="text-sm text-foreground/80 mb-3">
            {language === 'ru'
              ? 'Личная безопасность и помощь в экстремальных ситуациях. 24/7.'
              : 'Personal security & emergency assistance. 24/7.'}
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-accent to-accent hover:from-accent hover:to-accent text-white"
              onClick={() => window.location.href = getTelLink()}
            >
              <Phone className="w-4 h-4 mr-1.5" />
              {language === 'ru' ? 'Позвонить' : 'Call'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-accent/40 text-accent hover:bg-accent/10"
              onClick={() => window.open(COMPANY_CONTACTS.whatsapp.link, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              WhatsApp
            </Button>
          </div>
        </div>

        {/* Quick Actions - 4 big buttons */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {quickActions.map((action) => {
            const Icon = action.icon ?? resolveIcon(undefined);
            const tone = EMERGENCY_TONE_CLASSES[action.tone ?? 'destructive'];
            return (
              <button
                key={action.id}
                onClick={() => handleCall(action.phone)}
                className={cn(
                  "flex flex-col items-center p-3 rounded-none border transition-all ",
                  tone.bg, "border-transparent hover:border-current/20"
                )}
              >
                <Icon className={cn("w-6 h-6 mb-1", tone.color)} />
                <span className="font-bold text-lg">{action.phone}</span>
                <span className="text-[10px] text-muted-foreground">
                  {language === 'ru'
                    ? (action.shortLabelRu ?? action.nameRu)
                    : (action.shortLabelEn ?? action.nameEn)}
                </span>
              </button>
            );
          })}
        </div>

        {/* VIP Concierge Link */}
        <button
          className="w-full mb-5 p-3 rounded-none bg-gradient-to-r from-primary/10 to-primary/10 border border-primary/40 flex items-center justify-between hover:border-primary/40 transition-colors"
          onClick={() => navigate('/vip-concierge')}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary to-primary">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm flex items-center gap-1">
                myUNO VIP
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Вертолёты, яхты, повара...' : 'Helicopters, yachts, chefs...'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </button>

        {/* Service Links */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {serviceLinks.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => navigate(service.path)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-none border transition-all text-left",
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

        {/* Emergency Categories */}
        {emergencyCategories.map((category) => {
          const CatIcon = category.icon;
          const tone = EMERGENCY_TONE_CLASSES[category.tone];
          return (
            <div key={category.id} id={category.id} className="scroll-mt-20">
            <SectionCard className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <CatIcon className={cn("w-5 h-5", tone.color)} />
                <SectionTitle className="mb-0">
                  {language === 'ru' ? category.titleRu : category.titleEn}
                </SectionTitle>
              </div>
              <div className="space-y-2">
                {category.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {language === 'ru' ? contact.nameRu : contact.nameEn}
                      </div>
                      {(contact.descEn || contact.descRu) && (
                        <div className="text-xs text-muted-foreground">
                          {language === 'ru' ? contact.descRu : contact.descEn}
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
            </div>
          );
        })}

        {/* Grouped Tips - Accordion Style */}
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-accent" />
          <h2 className="font-semibold text-lg">
            {language === 'ru' ? 'Что делать если...' : 'What to do if...'}
          </h2>
        </div>

        <div className="space-y-2">
          {EMERGENCY_TIP_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            return (
              <div key={category.id} className="rounded-none border border-border/50 bg-card overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {(() => { const Icon = resolveIcon(category.icon); return <Icon className="w-5 h-5" />; })()}
                    <span className="font-medium text-sm">
                      {language === 'ru' ? category.titleRu : category.title}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-none">
                      {category.tips.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/30">
                    <ul className="space-y-2">
                      {category.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2 py-1">
                          <span className="text-primary mt-0.5 font-bold">→</span>
                          <span>{language === 'ru' ? tip.ru : tip.en}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save Offline Button */}
        <Button
          variant="outline"
          className="w-full mt-4 gap-2"
          onClick={handleSaveOffline}
          disabled={isCaching}
        >
          {isSOSCached ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-success" />
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

        <div className="h-8" />
      </PageContainer>
    </AppLayout>
  );
}
