import React, { forwardRef, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { 
  ChevronRight, Sparkles, Home, Car, UtensilsCrossed, 
  Stethoscope, Scale, Globe, Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// ForwardRef wrapper for motion.div
const MotionDiv = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>((props, ref) => (
  <motion.div ref={ref} {...props} />
));
MotionDiv.displayName = 'MotionDiv';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Language = 'ru' | 'en' | 'th';

// Texts
const texts = {
  title: { en: 'myUNO', ru: 'myUNO', th: 'myUNO' },
  subtitle: { 
    en: 'Your personal assistant for living abroad', 
    ru: 'Ваш персональный помощник для жизни за рубежом', 
    th: 'ผู้ช่วยส่วนตัวของคุณสำหรับการใช้ชีวิตในต่างประเทศ' 
  },
  audience: { 
    en: 'For tourists, expats and property owners', 
    ru: 'Для туристов, экспатов и владельцев недвижимости', 
    th: 'สำหรับนักท่องเที่ยว ชาวต่างชาติ และเจ้าของอสังหาริมทรัพย์' 
  },
  nowIn: { en: 'Now in Phuket', ru: 'Сейчас на Пхукете', th: 'ตอนนี้ที่ภูเก็ต' },
  mission: { 
    en: 'We travel with you. Feel at home anywhere in the world.', 
    ru: 'Мы путешествуем вместе с вами. Чувствуйте себя как дома в любой точке мира.', 
    th: 'เราเดินทางไปกับคุณ รู้สึกเหมือนอยู่บ้านทุกที่ในโลก' 
  },
  comingSoon: { en: 'Coming soon', ru: 'Скоро', th: 'เร็วๆ นี้' },
  getStarted: { en: 'Get Started', ru: 'Начать', th: 'เริ่มต้น' },
};

const categories = [
  { icon: Home, name: { en: 'Housing', ru: 'Жильё', th: 'ที่พัก' } },
  { icon: Car, name: { en: 'Transport', ru: 'Транспорт', th: 'การเดินทาง' } },
  { icon: Stethoscope, name: { en: 'Health', ru: 'Здоровье', th: 'สุขภาพ' } },
  { icon: UtensilsCrossed, name: { en: 'Food', ru: 'Еда', th: 'อาหาร' } },
  { icon: Scale, name: { en: 'Legal', ru: 'Право', th: 'กฎหมาย' } },
  { icon: Sparkles, name: { en: 'Beauty', ru: 'Красота', th: 'ความงาม' } },
];

const futureLocations = [
  { name: { en: 'Bali', ru: 'Бали', th: 'บาหลี' }, flag: '🇮🇩' },
  { name: { en: 'Dubai', ru: 'Дубай', th: 'ดูไบ' }, flag: '🇦🇪' },
  { name: { en: 'Da Nang', ru: 'Дананг', th: 'ดานัง' }, flag: '🇻🇳' },
];

const languageOptions = [
  { code: 'en' as const, flag: '🇬🇧', label: 'English' },
  { code: 'ru' as const, flag: '🇷🇺', label: 'Русский' },
  { code: 'th' as const, flag: '🇹🇭', label: 'ไทย' },
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
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 max-h-[90vh]" hideCloseButton>
        <DialogTitle className="sr-only">Welcome to myUNO</DialogTitle>
        <div className="relative min-h-[500px] max-h-[85vh] flex flex-col overflow-y-auto">
          {/* Background gradient */}
          <div 
            className="absolute inset-0 pointer-events-none" 
            style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)' }}
          />

          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-4 sm:p-6 relative z-10 flex-1 flex flex-col"
          >
            {/* Hero Section */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
              >
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground" />
              </motion.div>
              
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold">{texts.title[lang]}</h2>
                <p className="text-muted-foreground text-xs sm:text-sm">{texts.subtitle[lang]}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/70">{texts.audience[lang]}</p>
              </div>
            </div>

            {/* Categories Grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4"
            >
              {categories.map((cat, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.05 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card/50 border border-border/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <cat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-foreground/80">{cat.name[lang]}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Mission Block */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-base sm:text-lg">🇹🇭</span>
                  <span className="font-semibold text-xs sm:text-sm">{texts.nowIn[lang]}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2 mb-2">
                <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {texts.mission[lang]}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-primary/10">
                <span className="text-[10px] sm:text-xs text-muted-foreground">{texts.comingSoon[lang]}:</span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {futureLocations.map((loc, idx) => (
                    <span key={idx} className="text-[10px] sm:text-xs text-muted-foreground/70 flex items-center gap-0.5">
                      {loc.flag} {loc.name[lang]}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Language Selection */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-1.5 sm:gap-2 mt-4"
            >
              {languageOptions.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all",
                    language === opt.code 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{opt.flag}</span>
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-auto pt-4"
            >
              <Button 
                className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" 
                onClick={handleComplete}
              >
                {texts.getStarted[lang]}
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
              </Button>
            </motion.div>
          </MotionDiv>
        </div>
      </DialogContent>
    </Dialog>
  );
}
