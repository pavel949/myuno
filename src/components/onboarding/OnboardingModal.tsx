import React, { forwardRef, useCallback, memo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from '@/contexts/LocationContext';
import { Skeleton } from '@/components/ui/skeleton';

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
  getStarted: { en: 'Continue', ru: 'Продолжить', th: 'ดำเนินการต่อ' },
};

const languageOptions = [
  { code: 'en' as const, flag: '🇬🇧', label: 'EN' },
  { code: 'ru' as const, flag: '🇷🇺', label: 'RU' },
  { code: 'th' as const, flag: '🇹🇭', label: 'TH' },
];

export const OnboardingModal = memo(forwardRef<HTMLDivElement, OnboardingModalProps>(
  function OnboardingModal({ open, onComplete }, ref) {
  const { language, setLanguage } = useLanguage();
  const { activeCities, comingSoonCities, isLoading, setCity } = useLocation();
  const lang = language as Language;

  const activeCity = activeCities[0];

  const handleComplete = useCallback(() => {
    localStorage.setItem('myuno-onboarding-complete', 'true');
    if (activeCity) {
      setCity(activeCity.slug);
    }
    onComplete();
  }, [onComplete, activeCity, setCity]);

  const getCityName = (city: typeof activeCity, lang: Language) => {
    if (!city) return '';
    switch (lang) {
      case 'ru': return city.name_ru || city.name_en;
      case 'th': return city.name_th || city.name_en;
      default: return city.name_en;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent ref={ref} className="sm:max-w-sm p-0 gap-0 overflow-hidden border-0" hideCloseButton>
        <DialogTitle className="sr-only">Welcome to myUNO</DialogTitle>
        <div className="relative flex flex-col">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-6 sm:p-8 relative z-10 flex flex-col items-center text-center"
          >
            {/* Icon — calm, functional */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
            >
              <Globe className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Location badge */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border/60 mb-6"
            >
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
            </motion.div>
            
            {/* Headline — calm, factual */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-semibold leading-tight mb-2"
            >
              {texts.headline[lang]}
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground mb-8"
            >
              {texts.subtitle[lang]}
            </motion.p>

            {/* Future locations */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 mb-8 flex-wrap"
            >
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
            </motion.div>

            {/* Language Selection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-2 mb-6"
            >
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
            </motion.div>

            {/* CTA */}
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full"
            >
              <Button 
                className="w-full h-12 text-base font-medium rounded-xl" 
                onClick={handleComplete}
                disabled={isLoading}
              >
                {texts.getStarted[lang]}
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </MotionDiv>
        </div>
      </DialogContent>
    </Dialog>
  );
}));

OnboardingModal.displayName = 'OnboardingModal';
