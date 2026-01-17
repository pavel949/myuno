import React, { useState, forwardRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { 
  MapPin, Wallet, ChevronRight, Check, Shield,
  Sparkles, Home, Car, UtensilsCrossed, Stethoscope, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

// ForwardRef wrapper for motion.div to work with AnimatePresence inside Radix portals
const MotionDiv = forwardRef<HTMLDivElement, HTMLMotionProps<"div">>((props, ref) => (
  <motion.div ref={ref} {...props} />
));
MotionDiv.displayName = 'MotionDiv';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Language = 'ru' | 'en' | 'th';

const steps = [
  { id: 'welcome', title: { en: 'myUNO', ru: 'myUNO', th: 'myUNO' }, subtitle: { en: "The world's first superapp for living abroad", ru: 'Первый в мире суперапп для жизни за рубежом', th: 'ซูเปอร์แอปแรกของโลกสำหรับการใช้ชีวิตในต่างประเทศ' }, icon: Sparkles },
  { id: 'location', title: { en: 'Choose myUNO location', ru: 'Выберите локацию myUNO', th: 'เลือกสถานที่ myUNO' }, subtitle: { en: 'Select where you want to use myUNO', ru: 'Выберите где вы хотите использовать myUNO', th: 'เลือกสถานที่ที่คุณต้องการใช้ myUNO' }, icon: MapPin },
  { id: 'interests', title: { en: 'What interests you?', ru: 'Что вас интересует?', th: 'คุณสนใจอะไร?' }, subtitle: { en: 'Select categories to personalize your experience', ru: 'Выберите категории для персонализации', th: 'เลือกหมวดหมู่เพื่อปรับแต่งประสบการณ์' }, icon: Sparkles },
  { id: 'ready', title: { en: "You're all set!", ru: 'Всё готово!', th: 'พร้อมแล้ว!' }, subtitle: { en: 'Start exploring verified services', ru: 'Начните изучать проверенные сервисы', th: 'เริ่มค้นหาบริการที่ได้รับการยืนยัน' }, icon: Check },
];

const audienceTexts = { en: 'For tourists, expats & property owners', ru: 'Для туристов, экспатов и владельцев недвижимости', th: 'สำหรับนักท่องเที่ยว ชาวต่างชาติ และเจ้าของอสังหาริมทรัพย์' };

const welcomeCategories = [
  { icon: Home, name: { en: 'Housing', ru: 'Жильё', th: 'ที่พัก' } },
  { icon: Car, name: { en: 'Transport', ru: 'Транспорт', th: 'การเดินทาง' } },
  { icon: Stethoscope, name: { en: 'Health', ru: 'Здоровье', th: 'สุขภาพ' } },
  { icon: UtensilsCrossed, name: { en: 'Food', ru: 'Еда', th: 'อาหาร' } },
  { icon: Scale, name: { en: 'Legal', ru: 'Право', th: 'กฎหมาย' } },
  { icon: Sparkles, name: { en: 'Beauty', ru: 'Красота', th: 'ความงาม' } },
];

const locations = [
  { id: 'phuket', name: { en: 'Phuket', ru: 'Пхукет', th: 'ภูเก็ต' }, country: { en: 'Thailand', ru: 'Таиланд', th: 'ประเทศไทย' }, flag: '🇹🇭', available: true },
  { id: 'danang', name: { en: 'Da Nang', ru: 'Дананг', th: 'ดานัง' }, country: { en: 'Vietnam', ru: 'Вьетнам', th: 'เวียดนาม' }, flag: '🇻🇳', available: false },
  { id: 'bali', name: { en: 'Bali', ru: 'Бали', th: 'บาหลี' }, country: { en: 'Indonesia', ru: 'Индонезия', th: 'อินโดนีเซีย' }, flag: '🇮🇩', available: false },
  { id: 'dubai', name: { en: 'Dubai', ru: 'Дубай', th: 'ดูไบ' }, country: { en: 'UAE', ru: 'ОАЭ', th: 'สหรัฐอาหรับเอมิเรตส์' }, flag: '🇦🇪', available: false },
];

const comingSoonTexts = { en: 'Coming soon', ru: 'Скоро', th: 'เร็วๆ นี้' };

const interests = [
  { id: 'housing', name: { en: 'Housing', ru: 'Жильё', th: 'ที่พัก' }, icon: Home, color: 'from-teal-500 to-emerald-500' },
  { id: 'transport', name: { en: 'Transport', ru: 'Транспорт', th: 'การเดินทาง' }, icon: Car, color: 'from-indigo-500 to-blue-500' },
  { id: 'food', name: { en: 'Food & Dining', ru: 'Еда', th: 'อาหาร' }, icon: UtensilsCrossed, color: 'from-orange-500 to-red-500' },
  { id: 'medical', name: { en: 'Medical', ru: 'Медицина', th: 'การแพทย์' }, icon: Stethoscope, color: 'from-emerald-500 to-green-500' },
  { id: 'beauty', name: { en: 'Beauty & Spa', ru: 'Красота и СПА', th: 'ความงามและสปา' }, icon: Sparkles, color: 'from-pink-500 to-purple-500' },
  { id: 'finance', name: { en: 'Finance & Legal', ru: 'Финансы и право', th: 'การเงินและกฎหมาย' }, icon: Wallet, color: 'from-amber-500 to-orange-500' },
];

const languageOptions = [
  { code: 'en' as const, flag: '🇬🇧', label: 'English' },
  { code: 'ru' as const, flag: '🇷🇺', label: 'Русский' },
  { code: 'th' as const, flag: '🇹🇭', label: 'ไทย' },
];

const uiTexts = {
  skip: { en: 'Skip', ru: 'Пропустить', th: 'ข้าม' },
  continue: { en: 'Continue', ru: 'Далее', th: 'ถัดไป' },
  getStarted: { en: 'Get Started', ru: 'Начать', th: 'เริ่มต้น' },
};

// Memoized step indicator component
const StepIndicator = memo(function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-2 bg-primary/50" : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  );
});

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { language, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const step = steps[currentStep];
  const lang = language as Language;

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem('myuno-onboarding-complete', 'true');
      localStorage.setItem('myuno-user-location', selectedLocation || 'phuket');
      localStorage.setItem('myuno-user-interests', JSON.stringify(selectedInterests));
      onComplete();
    }
  }, [currentStep, selectedLocation, selectedInterests, onComplete]);

  const handleSkip = useCallback(() => {
    localStorage.setItem('myuno-onboarding-complete', 'true');
    onComplete();
  }, [onComplete]);

  const toggleInterest = useCallback((id: string) => {
    setSelectedInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const canProceed = step.id === 'location' ? selectedLocation !== null : step.id === 'interests' ? selectedInterests.length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0" hideCloseButton>
        <DialogTitle className="sr-only">Onboarding</DialogTitle>
        <div className="relative min-h-[520px] flex flex-col">
          {step.id === 'welcome' && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)' }} />
          )}

          <AnimatePresence mode="wait" initial={false}>
            <MotionDiv
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 relative z-10 flex-1 flex flex-col"
            >
              <StepIndicator currentStep={currentStep} totalSteps={steps.length} />

              {/* Welcome step */}
              {step.id === 'welcome' && (
                <div className="text-center space-y-5 flex-1 flex flex-col justify-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold">{step.title[lang]}</h2>
                    <p className="text-muted-foreground text-sm">{step.subtitle[lang]}</p>
                    <p className="text-xs text-muted-foreground/70">{audienceTexts[lang]}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {welcomeCategories.map((cat, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/50">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <cat.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground/80">{cat.name[lang]}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center gap-2 pt-2">
                    {languageOptions.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => setLanguage(opt.code)}
                        className={cn("px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors", language === opt.code ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}
                      >
                        <span>{opt.flag}</span>
                        <span className="hidden sm:inline">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location step */}
              {step.id === 'location' && (
                <div className="space-y-4 flex-1">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                      <step.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">{step.title[lang]}</h2>
                    <p className="text-sm text-muted-foreground">{step.subtitle[lang]}</p>
                  </div>
                  <div className="space-y-3">
                    {locations.filter(l => l.available).map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc.id)}
                        className={cn("w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all", selectedLocation === loc.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}
                      >
                        <span className="text-2xl">{loc.flag}</span>
                        <div className="flex-1 text-left">
                          <span className="font-semibold">{loc.name[lang]}</span>
                          <p className="text-xs text-muted-foreground">{lang === 'ru' ? 'Доступно' : 'Available'}</p>
                        </div>
                        {selectedLocation === loc.id && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                    <p className="text-xs text-muted-foreground text-center">{comingSoonTexts[lang]}:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {locations.filter(l => !l.available).map(loc => (
                        <div key={loc.id} className="flex items-center gap-2 p-2 rounded-lg border border-border/50 opacity-50">
                          <span>{loc.flag}</span>
                          <span className="text-xs">{loc.name[lang]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Interests step */}
              {step.id === 'interests' && (
                <div className="space-y-4 flex-1">
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-1">{step.title[lang]}</h2>
                    <p className="text-sm text-muted-foreground">{step.subtitle[lang]}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {interests.map(interest => {
                      const Icon = interest.icon;
                      const isSelected = selectedInterests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          onClick={() => toggleInterest(interest.id)}
                          className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all", isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}
                        >
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", interest.color)}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-sm text-left flex-1">{interest.name[lang]}</span>
                          {isSelected && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ready step */}
              {step.id === 'ready' && (
                <div className="text-center space-y-6 flex-1 flex flex-col justify-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{step.title[lang]}</h2>
                    <p className="text-muted-foreground">{step.subtitle[lang]}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedInterests.map(id => {
                      const interest = interests.find(i => i.id === id);
                      return interest ? (
                        <span key={id} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{interest.name[lang]}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-auto pt-6">
                {currentStep === 0 && (
                  <Button variant="ghost" className="flex-1" onClick={handleSkip}>
                    {uiTexts.skip[lang]}
                  </Button>
                )}
                <Button className="flex-1" onClick={handleNext} disabled={!canProceed}>
                  {step.id === 'ready' ? uiTexts.getStarted[lang] : uiTexts.continue[lang]}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </MotionDiv>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
