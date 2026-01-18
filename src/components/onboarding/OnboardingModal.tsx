import React, { forwardRef, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

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
    en: 'The world is yours. At home everywhere.', 
    ru: 'Мир — твой. Везде как дома.', 
    th: 'โลกเป็นของคุณ ทุกที่คือบ้าน' 
  },
  subtitle: { 
    en: 'All services for living abroad — in one app', 
    ru: 'Все сервисы для жизни за рубежом — в одном приложении', 
    th: 'บริการทั้งหมดสำหรับการใช้ชีวิตในต่างประเทศ — ในแอปเดียว' 
  },
  nowIn: { en: 'Phuket', ru: 'Пхукет', th: 'ภูเก็ต' },
  comingSoon: { en: 'Coming soon', ru: 'Скоро', th: 'เร็วๆ นี้' },
  getStarted: { en: 'Get Started', ru: 'Начать', th: 'เริ่มต้น' },
};

const futureLocations = [
  { name: { en: 'Bali', ru: 'Бали', th: 'บาหลี' }, flag: '🇮🇩' },
  { name: { en: 'Dubai', ru: 'Дубай', th: 'ดูไบ' }, flag: '🇦🇪' },
  { name: { en: 'Da Nang', ru: 'Дананг', th: 'ดานัง' }, flag: '🇻🇳' },
];

const languageOptions = [
  { code: 'en' as const, flag: '🇬🇧', label: 'EN' },
  { code: 'ru' as const, flag: '🇷🇺', label: 'RU' },
  { code: 'th' as const, flag: '🇹🇭', label: 'TH' },
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { language, setLanguage } = useLanguage();
  const lang = language as Language;

  const handleComplete = useCallback(() => {
    localStorage.setItem('myuno-onboarding-complete', 'true');
    localStorage.setItem('myuno-user-location', 'phuket');
    onComplete();
  }, [onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden border-0" hideCloseButton>
        <DialogTitle className="sr-only">Welcome to myUNO</DialogTitle>
        <div className="relative flex flex-col">
          {/* Background gradient */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ background: 'radial-gradient(circle at 50% 20%, hsl(var(--primary) / 0.2) 0%, transparent 60%)' }} 
          />

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="p-6 sm:p-8 relative z-10 flex flex-col items-center text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-xl shadow-primary/30 mb-6"
            >
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            {/* Location badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <span className="text-xl">🇹🇭</span>
              <span className="font-semibold text-sm text-primary">{texts.nowIn[lang]}</span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
            >
              {texts.headline[lang]}
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-sm sm:text-base text-muted-foreground mb-8"
            >
              {texts.subtitle[lang]}
            </motion.p>

            {/* Future locations */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 mb-8"
            >
              <span>{texts.comingSoon[lang]}:</span>
              {futureLocations.map((loc, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {loc.flag} {loc.name[lang]}
                </span>
              ))}
            </motion.div>

            {/* Language Selection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-2 mb-6"
            >
              {languageOptions.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all",
                    language === opt.code 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full"
            >
              <Button 
                className="w-full h-12 text-base font-semibold rounded-xl" 
                onClick={handleComplete}
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
}
