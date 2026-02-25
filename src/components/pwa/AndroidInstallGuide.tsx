import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Download, CheckCircle2, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface AndroidInstallGuideProps {
  onClose?: () => void;
}

export function AndroidInstallGuide({ onClose }: AndroidInstallGuideProps) {
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const t = {
    en: {
      title: 'Install myUNO App',
      step1Title: 'Tap the menu button',
      step1Desc: 'Find the three dots (⋮) in the top right corner of Chrome',
      step2Title: 'Select "Install app"',
      step2Desc: 'Or "Add to Home screen" in some browsers',
      step3Title: 'Confirm installation',
      step3Desc: 'The app icon will appear on your home screen',
      done: 'Done! App installed',
      next: 'Next',
      back: 'Back',
      gotIt: 'Got it!',
      close: 'Close',
      chromeNote: 'Use Chrome for the best experience',
    },
    ru: {
      title: 'Установка myUNO',
      step1Title: 'Нажмите на меню',
      step1Desc: 'Найдите три точки (⋮) в правом верхнем углу Chrome',
      step2Title: 'Выберите "Установить приложение"',
      step2Desc: 'Или "Добавить на главный экран" в некоторых браузерах',
      step3Title: 'Подтвердите установку',
      step3Desc: 'Иконка появится на главном экране',
      done: 'Готово! Приложение установлено',
      next: 'Далее',
      back: 'Назад',
      gotIt: 'Понятно!',
      close: 'Закрыть',
      chromeNote: 'Используйте Chrome для лучшего опыта',
    },
  };

  const text = t[language] || t.en;

  const steps = [
    {
      icon: <MoreVertical className="w-12 h-12 text-primary" />,
      title: text.step1Title,
      description: text.step1Desc,
      visual: (
        <div className="relative mt-4">
          <div className="bg-muted/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-background/50 rounded" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary"
              >
                <MoreVertical className="w-6 h-6 text-primary" />
              </motion.div>
            </div>
            <div className="h-32 bg-background/30 rounded-lg" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
            Chrome
          </div>
        </div>
      ),
    },
    {
      icon: <Download className="w-12 h-12 text-primary" />,
      title: text.step2Title,
      description: text.step2Desc,
      visual: (
        <div className="mt-4 bg-muted/50 rounded-2xl p-4">
          <div className="space-y-2">
            <div className="h-10 bg-background/50 rounded-lg flex items-center px-4 gap-3">
              <Menu className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Новая вкладка' : 'New tab'}
              </span>
            </div>
            <div className="h-10 bg-background/50 rounded-lg" />
            <motion.div
              animate={{ 
                backgroundColor: ['hsl(var(--background))', 'hsl(var(--primary) / 0.2)', 'hsl(var(--background))']
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-12 rounded-lg flex items-center px-4 gap-3 border-2 border-primary"
            >
              <Download className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                {language === 'ru' ? 'Установить приложение' : 'Install app'}
              </span>
            </motion.div>
            <div className="h-10 bg-background/50 rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      icon: <CheckCircle2 className="w-12 h-12 text-success" />,
      title: text.step3Title,
      description: text.step3Desc,
      visual: (
        <div className="mt-4 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg"
          >
            <span className="text-3xl font-bold text-primary-foreground">U</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-sm text-muted-foreground"
          >
            myUNO
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 flex items-center gap-2 text-success"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">{text.done}</span>
          </motion.div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose?.();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{text.title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 px-4 py-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {steps[currentStep].icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-muted-foreground">
                {steps[currentStep].description}
              </p>
              {steps[currentStep].visual}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-4 border-t flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              {text.back}
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1">
            {currentStep === steps.length - 1 ? text.gotIt : text.next}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
