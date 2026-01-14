import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Globe, Wallet, ChevronRight, Check,
  Sparkles, Home, Car, UtensilsCrossed, Stethoscope
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
    title: { en: 'Home is where myUNO is', ru: 'Дом там, где myUNO', th: 'บ้านอยู่ที่ myUNO' },
    subtitle: { en: 'Your life abroad, simplified', ru: 'Твоя жизнь за рубежом — проще', th: 'ชีวิตต่างแดนของคุณ ง่ายขึ้น' },
    icon: Sparkles,
  },
  {
    id: 'location',
    title: { en: 'Where are you?', ru: 'Где вы находитесь?', th: 'คุณอยู่ที่ไหน?' },
    subtitle: { en: 'Select your current location', ru: 'Выберите ваше местоположение', th: 'เลือกตำแหน่งปัจจุบันของคุณ' },
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

const locations = [
  { id: 'phuket', name: { en: 'Phuket', ru: 'Пхукет', th: 'ภูเก็ต' }, flag: '🇹🇭' },
  { id: 'bangkok', name: { en: 'Bangkok', ru: 'Бангкок', th: 'กรุงเทพฯ' }, flag: '🇹🇭' },
  { id: 'samui', name: { en: 'Koh Samui', ru: 'Ко Самуи', th: 'เกาะสมุย' }, flag: '🇹🇭' },
  { id: 'pattaya', name: { en: 'Pattaya', ru: 'Паттайя', th: 'พัทยา' }, flag: '🇹🇭' },
  { id: 'bali', name: { en: 'Bali', ru: 'Бали', th: 'บาหลี' }, flag: '🇮🇩' },
  { id: 'other', name: { en: 'Other', ru: 'Другое', th: 'อื่นๆ' }, flag: '🌍' },
];

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
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden" hideCloseButton>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {/* Step indicator */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Welcome step with language selector */}
            {step.id === 'welcome' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {step.title[lang]}
                  </h2>
                  <p className="text-muted-foreground">
                    {step.subtitle[lang]}
                  </p>
                </div>
                
                {/* Language selector - 3 languages */}
                <div className="flex justify-center gap-2 flex-wrap">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setLanguage(opt.code)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                        language === opt.code 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-lg">{opt.flag}</span>
                      <span className="text-sm">{opt.label}</span>
                      {language === opt.code && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location step */}
            {step.id === 'location' && (
              <div className="space-y-6">
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
                
                <div className="grid grid-cols-2 gap-2">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocation(loc.id)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all",
                        selectedLocation === loc.id 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-xl">{loc.flag}</span>
                      <span className="font-medium">
                        {loc.name[lang]}
                      </span>
                      {selectedLocation === loc.id && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interests step */}
            {step.id === 'interests' && (
              <div className="space-y-6">
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
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Check className="w-10 h-10 text-white" />
                </div>
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
            <div className="flex gap-3 mt-8">
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
      </DialogContent>
    </Dialog>
  );
}
