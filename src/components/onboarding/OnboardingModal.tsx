import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Wallet, ChevronRight, Check,
  Sparkles, Home, Car, UtensilsCrossed, Stethoscope, Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

type Language = 'ru' | 'en' | 'th';

const steps = [
  {
    id: 'welcome',
    title: { en: 'myUNO', ru: 'myUNO', th: 'myUNO' },
    subtitle: { 
      en: "The world's first superapp for living abroad", 
      ru: 'Первый в мире суперапп для жизни за рубежом', 
      th: 'ซูเปอร์แอปแรกของโลกสำหรับการใช้ชีวิตในต่างประเทศ' 
    },
    icon: Sparkles,
  },
  {
    id: 'location',
    title: { en: 'Choose myUNO location', ru: 'Выберите локацию myUNO', th: 'เลือกสถานที่ myUNO' },
    subtitle: { en: 'Select where you want to use myUNO', ru: 'Выберите где вы хотите использовать myUNO', th: 'เลือกสถานที่ที่คุณต้องการใช้ myUNO' },
    icon: MapPin,
  },
  {
    id: 'interests',
    title: { en: 'What interests you?', ru: 'Что вас интересует?', th: 'คุณสนใจอะไร?' },
    subtitle: { en: 'Select categories to personalize your experience', ru: 'Выберите категории для персонализации', th: 'เลือกหมวดหมู่เพื่อปรับแต่งประสบการณ์' },
    icon: Sparkles,
  },
  {
    id: 'ready',
    title: { en: "You're all set!", ru: 'Всё готово!', th: 'พร้อมแล้ว!' },
    subtitle: { en: 'Start exploring verified services', ru: 'Начните изучать проверенные сервисы', th: 'เริ่มค้นหาบริการที่ได้รับการยืนยัน' },
    icon: Check,
  },
];

const audienceTexts = {
  en: 'For tourists, expats & property owners',
  ru: 'Для туристов, экспатов и владельцев недвижимости',
  th: 'สำหรับนักท่องเที่ยว ชาวต่างชาติ และเจ้าของอสังหาริมทรัพย์'
};

const welcomeCategories = [
  { icon: Home, name: { en: 'Housing', ru: 'Жильё', th: 'ที่พัก' } },
  { icon: Car, name: { en: 'Transport', ru: 'Транспорт', th: 'การเดินทาง' } },
  { icon: Stethoscope, name: { en: 'Health', ru: 'Здоровье', th: 'สุขภาพ' } },
  { icon: UtensilsCrossed, name: { en: 'Food', ru: 'Еда', th: 'อาหาร' } },
  { icon: Scale, name: { en: 'Legal', ru: 'Право', th: 'กฎหมาย' } },
  { icon: Sparkles, name: { en: 'Beauty', ru: 'Красота', th: 'ความงาม' } },
];

const locations = [
  { id: 'phuket', name: { en: 'Phuket', ru: 'Пхукет', th: 'ภูเก็ต' }, flag: '🇹🇭', available: true },
  { id: 'danang', name: { en: 'Da Nang', ru: 'Дананг', th: 'ดานัง' }, flag: '🇻🇳', available: false },
  { id: 'bali', name: { en: 'Bali', ru: 'Бали', th: 'บาหลี' }, flag: '🇮🇩', available: false },
  { id: 'dubai', name: { en: 'Dubai', ru: 'Дубай', th: 'ดูไบ' }, flag: '🇦🇪', available: false },
  { id: 'lisbon', name: { en: 'Lisbon', ru: 'Лиссабон', th: 'ลิสบอน' }, flag: '🇵🇹', available: false },
];

const comingSoonTexts = {
  en: 'Coming soon',
  ru: 'Скоро',
  th: 'เร็วๆ นี้',
};

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
};

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { language, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const step = steps[currentStep];
  const lang = language as Language;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences to localStorage
      localStorage.setItem('myuno-onboarding-complete', 'true');
      localStorage.setItem('myuno-user-location', selectedLocation || 'phuket');
      localStorage.setItem('myuno-user-interests', JSON.stringify(selectedInterests));
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('myuno-onboarding-complete', 'true');
    onComplete();
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step.id === 'location') return selectedLocation !== null;
    if (step.id === 'interests') return selectedInterests.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0" hideCloseButton>
        <div className="relative min-h-[520px] flex flex-col">
          {/* Premium gradient background for welcome step */}
          {step.id === 'welcome' && (
            <>
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                    radial-gradient(circle at 80% 80%, hsl(43 74% 49% / 0.1) 0%, transparent 40%),
                    radial-gradient(circle at 20% 90%, hsl(var(--primary) / 0.08) 0%, transparent 30%)
                  `,
                }}
              />
              <div 
                className="absolute inset-0 pointer-events-none opacity-50"
                style={{
                  backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.04) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-6 relative z-10 flex-1 flex flex-col"
            >
              {/* Step indicator */}
              <div className="flex justify-center gap-2 mb-6">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === currentStep 
                        ? "w-8 bg-primary" 
                        : i < currentStep 
                        ? "w-2 bg-primary/50" 
                        : "w-2 bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Welcome step with premium design */}
              {step.id === 'welcome' && (
                <div className="text-center space-y-5 flex-1 flex flex-col justify-center">
                  {/* Animated Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25"
                  >
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </motion.div>

                  {/* Title and Subtitle */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2"
                  >
                    <h2 className="text-3xl font-bold">
                      {step.title[lang]}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.subtitle[lang]}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {audienceTexts[lang]}
                    </p>
                  </motion.div>

                  {/* Categories Grid with Staggered Animation */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-3 gap-3 pt-2"
                  >
                    {welcomeCategories.map((cat, index) => {
                      const IconComponent = cat.icon;
                      return (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-200"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-xs font-medium text-foreground/80">
                            {cat.name[lang]}
                          </span>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Language Selection */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex justify-center gap-2 pt-2"
                  >
                    {languageOptions.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => setLanguage(opt.code)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200",
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
                </div>
              )}

              {/* Location step */}
              {step.id === 'location' && (
                <div className="space-y-6 flex-1">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4">
                      <step.icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold mb-1">
                      {step.title[lang]}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {step.subtitle[lang]}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Active location - Phuket */}
                    {locations.filter(loc => loc.available).map(loc => (
                      <button
                        key={loc.id}
                        onClick={() => setSelectedLocation(loc.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                          selectedLocation === loc.id 
                            ? "border-primary bg-primary/10 shadow-md" 
                            : "border-primary/50 hover:border-primary bg-card"
                        )}
                      >
                        <span className="text-2xl">{loc.flag}</span>
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-lg">{loc.name[lang]}</span>
                          <p className="text-xs text-muted-foreground">
                            {lang === 'ru' ? 'Доступно сейчас' : lang === 'th' ? 'พร้อมใช้งาน' : 'Available now'}
                          </p>
                        </div>
                        {selectedLocation === loc.id && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </button>
                    ))}

                    {/* Coming soon locations */}
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                        {comingSoonTexts[lang]}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {locations.filter(loc => !loc.available).map(loc => (
                          <div
                            key={loc.id}
                            className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/30 opacity-60"
                          >
                            <span className="text-lg">{loc.flag}</span>
                            <span className="text-sm font-medium text-muted-foreground">
                              {loc.name[lang]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Interests step */}
              {step.id === 'interests' && (
                <div className="space-y-6 flex-1">
                  <div className="text-center">
                    <h2 className="text-xl font-bold mb-1">
                      {step.title[lang]}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {step.subtitle[lang]}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {interests.map(interest => {
                      const Icon = interest.icon;
                      const isSelected = selectedInterests.includes(interest.id);
                      return (
                        <button
                          key={interest.id}
                          onClick={() => toggleInterest(interest.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            isSelected 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                            interest.color
                          )}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="font-medium text-sm text-left flex-1">
                            {interest.name[lang]}
                          </span>
                          {isSelected && (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ready step */}
              {step.id === 'ready' && (
                <div className="text-center space-y-6 flex-1 flex flex-col justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
                  >
                    <Check className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {step.title[lang]}
                    </h2>
                    <p className="text-muted-foreground">
                      {step.subtitle[lang]}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedInterests.map(id => {
                      const interest = interests.find(i => i.id === id);
                      if (!interest) return null;
                      return (
                        <span 
                          key={id}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {interest.name[lang]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-auto pt-6">
                {currentStep === 0 && (
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={handleSkip}
                  >
                    {uiTexts.skip[lang]}
                  </Button>
                )}
                <Button 
                  className="flex-1"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  {step.id === 'ready' 
                    ? uiTexts.getStarted[lang]
                    : uiTexts.continue[lang]
                  }
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
