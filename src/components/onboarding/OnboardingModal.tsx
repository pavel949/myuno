import React, { forwardRef, useCallback, useState, memo } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ChevronRight, Globe, Plane, Home, Building2, TrendingUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

const MotionDiv = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>((props, ref) => (
  <motion.div ref={ref} {...props} />
));
MotionDiv.displayName = 'MotionDiv';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Language = 'ru' | 'en' | 'th';

const texts = {
  headline: { 
    en: 'Your life abroad, organized', 
    ru: 'Жизнь за рубежом — без хаоса', 
    th: 'ชีวิตต่างแดน เป็นระเบียบ' 
  },
  subtitle: { 
    en: 'One system for housing, services, and daily needs', 
    ru: 'Одна система для жилья, сервисов и повседневных задач', 
    th: 'ระบบเดียวสำหรับที่อยู่ บริการ และความต้องการในชีวิตประจำวัน' 
  },
  comingSoon: { en: 'Coming soon', ru: 'Скоро', th: 'เร็วๆ นี้' },
  continue: { en: 'Continue', ru: 'Продолжить', th: 'ดำเนินการต่อ' },
  personaTitle: { en: "I'm here as:", ru: 'Я здесь как:', th: 'ฉันอยู่ที่นี่ในฐานะ:' },
  personaHint: { en: 'You can change this later', ru: 'Можно изменить позже', th: 'สามารถเปลี่ยนได้ภายหลัง' },
  getStarted: { en: 'Get Started', ru: 'Начать', th: 'เริ่มต้น' },
};

const languageOptions = [
  { code: 'en' as const, flag: '🇬🇧', label: 'EN' },
  { code: 'ru' as const, flag: '🇷🇺', label: 'RU' },
  { code: 'th' as const, flag: '🇹🇭', label: 'TH' },
];

interface PersonaOption {
  persona: UserPersona;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  descEn: string;
  descRu: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  { persona: 'tourist', icon: Plane, labelEn: 'Tourist', labelRu: 'Турист', labelTh: 'นักท่องเที่ยว', descEn: 'Trips, tours, transfers', descRu: 'Поездки, туры, трансферы' },
  { persona: 'resident', icon: Home, labelEn: 'Resident', labelRu: 'Резидент', labelTh: 'ผู้อาศัย', descEn: 'Daily life, services, docs', descRu: 'Быт, сервисы, документы' },
  { persona: 'property_owner', icon: Building2, labelEn: 'Owner / MC', labelRu: 'Владелец / УК', labelTh: 'เจ้าของ', descEn: 'Manage your property', descRu: 'Управление недвижимостью' },
  { persona: 'investor', icon: TrendingUp, labelEn: 'Investor', labelRu: 'Инвестор', labelTh: 'นักลงทุน', descEn: 'Projects & opportunities', descRu: 'Проекты и возможности' },
];

export const OnboardingModal = memo(forwardRef<HTMLDivElement, OnboardingModalProps>(
  function OnboardingModal({ open, onComplete }, ref) {
  const { language, setLanguage } = useLanguage();
  const { activeCities, comingSoonCities, isLoading, setCity } = useLocation();
  const { togglePersona } = useUserPersonas();
  const navigate = useNavigate();
  const lang = language as Language;
  const [step, setStep] = useState<'welcome' | 'persona'>('welcome');
  const [selectedPersonas, setSelectedPersonas] = useState<UserPersona[]>([]);

  const activeCity = activeCities[0];

  const handleContinueToPersona = useCallback(() => {
    setStep('persona');
  }, []);

  const handleTogglePersona = useCallback((persona: UserPersona) => {
    triggerHaptic('light');
    setSelectedPersonas(prev => 
      prev.includes(persona) ? prev.filter(p => p !== persona) : [...prev, persona]
    );
  }, []);

  const handleComplete = useCallback(() => {
    localStorage.setItem('myuno-onboarding-complete', 'true');
    if (activeCity) {
      setCity(activeCity.slug);
    }
    // Save selected personas
    selectedPersonas.forEach(p => togglePersona(p));
    onComplete();

    // Redirect based on persona
    if (selectedPersonas.includes('property_owner')) {
      navigate('/owner/landing');
    } else if (selectedPersonas.includes('investor')) {
      navigate('/invest');
    }
  }, [onComplete, activeCity, setCity, selectedPersonas, togglePersona, navigate]);

  const getCityName = (city: typeof activeCity, lang: Language) => {
    if (!city) return '';
    switch (lang) {
      case 'ru': return city.name_ru || city.name_en;
      case 'th': return city.name_th || city.name_en;
      default: return city.name_en;
    }
  };

  const getPersonaLabel = (opt: PersonaOption) => {
    switch (lang) {
      case 'ru': return opt.labelRu;
      case 'th': return opt.labelTh;
      default: return opt.labelEn;
    }
  };

  const getPersonaDesc = (opt: PersonaOption) => {
    return lang === 'ru' ? opt.descRu : opt.descEn;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent ref={ref} className="sm:max-w-sm p-0 gap-0 overflow-hidden border-0" hideCloseButton>
        <DialogTitle className="sr-only">Welcome to myUNO</DialogTitle>
        <div className="relative flex flex-col">
          <AnimatePresence mode="wait">
            {step === 'welcome' ? (
              <MotionDiv
                key="welcome"
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
                >
                  <Globe className="w-8 h-8 text-primary" />
                </motion.div>

                {/* Location badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border/60 mb-6">
                  {isLoading ? (
                    <Skeleton className="h-5 w-24" />
                  ) : activeCity ? (
                    <>
                      <span className="text-lg">{activeCity.flag}</span>
                      <span className="font-medium text-sm text-foreground">
                        {getCityName(activeCity, lang)}
                      </span>
                    </>
                  ) : null}
                </div>
                
                <h1 className="text-xl font-semibold leading-tight mb-2">
                  {texts.headline[lang]}
                </h1>
                
                <p className="text-sm text-muted-foreground mb-8">
                  {texts.subtitle[lang]}
                </p>

                {/* Future locations */}
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 mb-8 flex-wrap">
                  {isLoading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : comingSoonCities.length > 0 ? (
                    <>
                      <span>{texts.comingSoon[lang]}:</span>
                      {comingSoonCities.slice(0, 4).map((city) => (
                        <span key={city.id} className="flex items-center gap-1">
                          {city.flag} {getCityName(city, lang)}
                        </span>
                      ))}
                    </>
                  ) : null}
                </div>

                {/* Language Selection */}
                <div className="flex justify-center gap-2 mb-6">
                  {languageOptions.map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => setLanguage(opt.code)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all",
                        language === opt.code 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      <span>{opt.flag}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* CTA → next step */}
                <div className="w-full">
                  <Button 
                    className="w-full h-12 text-base font-medium rounded-xl" 
                    onClick={handleContinueToPersona}
                    disabled={isLoading}
                  >
                    {texts.continue[lang]}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </MotionDiv>
            ) : (
              <MotionDiv
                key="persona"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 relative z-10 flex flex-col items-center text-center"
              >
                <h2 className="text-lg font-semibold mb-1">
                  {texts.personaTitle[lang]}
                </h2>
                <p className="text-xs text-muted-foreground mb-6">
                  {texts.personaHint[lang]}
                </p>

                {/* Persona cards */}
                <div className="grid grid-cols-2 gap-3 w-full mb-6">
                  {PERSONA_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedPersonas.includes(opt.persona);
                    return (
                      <button
                        key={opt.persona}
                        onClick={() => handleTogglePersona(opt.persona)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.97]",
                          isSelected
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          isSelected ? "bg-primary/15" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>
                          {getPersonaLabel(opt)}
                        </span>
                        <span className="text-[11px] text-muted-foreground leading-tight">
                          {getPersonaDesc(opt)}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="w-full">
                  <Button 
                    className="w-full h-12 text-base font-medium rounded-xl" 
                    onClick={handleComplete}
                  >
                    {texts.getStarted[lang]}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </MotionDiv>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}));

OnboardingModal.displayName = 'OnboardingModal';
