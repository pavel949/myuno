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

const steps = [
  {
    id: 'welcome',
    titleEn: 'Welcome to UNO',
    titleRu: 'Добро пожаловать в UNO',
    subtitleEn: 'Your all-in-one app for living abroad',
    subtitleRu: 'Всё для комфортной жизни за границей',
    icon: Sparkles,
  },
  {
    id: 'location',
    titleEn: 'Where are you?',
    titleRu: 'Где вы находитесь?',
    subtitleEn: 'Select your current location',
    subtitleRu: 'Выберите ваше местоположение',
    icon: MapPin,
  },
  {
    id: 'interests',
    titleEn: 'What interests you?',
    titleRu: 'Что вас интересует?',
    subtitleEn: 'Select categories to personalize your experience',
    subtitleRu: 'Выберите категории для персонализации',
    icon: Sparkles,
  },
  {
    id: 'ready',
    titleEn: "You're all set!",
    titleRu: 'Всё готово!',
    subtitleEn: 'Start exploring verified services',
    subtitleRu: 'Начните изучать проверенные сервисы',
    icon: Check,
  },
];

const locations = [
  { id: 'phuket', nameEn: 'Phuket', nameRu: 'Пхукет', flag: '🇹🇭' },
  { id: 'bangkok', nameEn: 'Bangkok', nameRu: 'Бангкок', flag: '🇹🇭' },
  { id: 'samui', nameEn: 'Koh Samui', nameRu: 'Ко Самуи', flag: '🇹🇭' },
  { id: 'pattaya', nameEn: 'Pattaya', nameRu: 'Паттайя', flag: '🇹🇭' },
  { id: 'bali', nameEn: 'Bali', nameRu: 'Бали', flag: '🇮🇩' },
  { id: 'other', nameEn: 'Other', nameRu: 'Другое', flag: '🌍' },
];

const interests = [
  { id: 'housing', nameEn: 'Housing', nameRu: 'Жильё', icon: Home, color: 'from-teal-500 to-emerald-500' },
  { id: 'transport', nameEn: 'Transport', nameRu: 'Транспорт', icon: Car, color: 'from-indigo-500 to-blue-500' },
  { id: 'food', nameEn: 'Food & Dining', nameRu: 'Еда', icon: UtensilsCrossed, color: 'from-orange-500 to-red-500' },
  { id: 'medical', nameEn: 'Medical', nameRu: 'Медицина', icon: Stethoscope, color: 'from-emerald-500 to-green-500' },
  { id: 'beauty', nameEn: 'Beauty & Spa', nameRu: 'Красота и СПА', icon: Sparkles, color: 'from-pink-500 to-purple-500' },
  { id: 'finance', nameEn: 'Finance & Legal', nameRu: 'Финансы и право', icon: Wallet, color: 'from-amber-500 to-orange-500' },
];

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { language, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save preferences to localStorage
      localStorage.setItem('uno-onboarding-complete', 'true');
      localStorage.setItem('uno-user-location', selectedLocation || 'phuket');
      localStorage.setItem('uno-user-interests', JSON.stringify(selectedInterests));
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('uno-onboarding-complete', 'true');
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
                    {language === 'ru' ? step.titleRu : step.titleEn}
                  </h2>
                  <p className="text-muted-foreground">
                    {language === 'ru' ? step.subtitleRu : step.subtitleEn}
                  </p>
                </div>
                
                {/* Language selector */}
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                      language === 'en' 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span>English</span>
                    {language === 'en' && <Check className="w-4 h-4 text-primary" />}
                  </button>
                  <button
                    onClick={() => setLanguage('ru')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                      language === 'ru' 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Русский</span>
                    {language === 'ru' && <Check className="w-4 h-4 text-primary" />}
                  </button>
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
                    {language === 'ru' ? step.titleRu : step.titleEn}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? step.subtitleRu : step.subtitleEn}
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
                        {language === 'ru' ? loc.nameRu : loc.nameEn}
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
                    {language === 'ru' ? step.titleRu : step.titleEn}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru' ? step.subtitleRu : step.subtitleEn}
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
                          {language === 'ru' ? interest.nameRu : interest.nameEn}
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
                    {language === 'ru' ? step.titleRu : step.titleEn}
                  </h2>
                  <p className="text-muted-foreground">
                    {language === 'ru' ? step.subtitleRu : step.subtitleEn}
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
                        {language === 'ru' ? interest.nameRu : interest.nameEn}
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
                  {language === 'ru' ? 'Пропустить' : 'Skip'}
                </Button>
              )}
              <Button 
                className="flex-1"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {step.id === 'ready' 
                  ? (language === 'ru' ? 'Начать' : 'Get Started')
                  : (language === 'ru' ? 'Далее' : 'Continue')
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
