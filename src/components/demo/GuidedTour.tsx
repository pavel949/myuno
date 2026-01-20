import { useEffect, useState } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDemoMode } from '@/hooks/useDemoMode';

const tourSteps: Record<string, DriveStep[]> = {
  en: [
    {
      element: '[data-tour="search"]',
      popover: {
        title: '🔍 Smart Search',
        description: 'Find anything: hotels, restaurants, tours, services. AI understands natural language!',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="categories"]',
      popover: {
        title: '📂 15+ Service Categories',
        description: 'From housing and yachts to medical and legal services — everything in one place.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="recommended"]',
      popover: {
        title: '⭐ Personalized Recommendations',
        description: 'AI learns your preferences and suggests the best options.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="cart"]',
      popover: {
        title: '🛒 Unified Cart',
        description: 'Collect services from different categories and pay in one checkout.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="profile"]',
      popover: {
        title: '👤 Your Profile',
        description: 'Bookings, favorites, cashback, documents — all in one place.',
        side: 'top',
        align: 'center',
      },
    },
  ],
  ru: [
    {
      element: '[data-tour="search"]',
      popover: {
        title: '🔍 Умный поиск',
        description: 'Найдите что угодно: отели, рестораны, туры, услуги. AI понимает естественный язык!',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="categories"]',
      popover: {
        title: '📂 15+ категорий услуг',
        description: 'От жилья и яхт до медицины и юридических услуг — всё в одном месте.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="recommended"]',
      popover: {
        title: '⭐ Персональные рекомендации',
        description: 'AI изучает ваши предпочтения и предлагает лучшие варианты.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="cart"]',
      popover: {
        title: '🛒 Единая корзина',
        description: 'Собирайте услуги из разных категорий и оплачивайте в одном чекауте.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="profile"]',
      popover: {
        title: '👤 Ваш профиль',
        description: 'Бронирования, избранное, кэшбэк, документы — всё в одном месте.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

interface GuidedTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

export const GuidedTour = ({ autoStart = false, onComplete }: GuidedTourProps) => {
  const [tourStarted, setTourStarted] = useState(false);
  const { language } = useLanguage();
  const { trackDemoAction } = useDemoMode();

  const startTour = () => {
    const steps = tourSteps[language] || tourSteps.en;
    
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: language === 'ru' ? 'Далее' : 'Next',
      prevBtnText: language === 'ru' ? 'Назад' : 'Previous',
      doneBtnText: language === 'ru' ? 'Готово' : 'Done',
      progressText: language === 'ru' ? '{{current}} из {{total}}' : '{{current}} of {{total}}',
      steps,
      onDestroyStarted: () => {
        trackDemoAction('tour_completed', { stepsViewed: driverObj.getActiveIndex() });
        onComplete?.();
        driverObj.destroy();
      },
    });

    setTourStarted(true);
    trackDemoAction('tour_started');
    driverObj.drive();
  };

  useEffect(() => {
    if (autoStart && !tourStarted) {
      // Small delay to ensure DOM elements are mounted
      const timer = setTimeout(startTour, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, tourStarted]);

  return null; // Tour is controlled via driver.js overlay
};

export const useTour = () => {
  const { language } = useLanguage();
  const { trackDemoAction } = useDemoMode();

  const startTour = () => {
    const steps = tourSteps[language] || tourSteps.en;
    
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: language === 'ru' ? 'Далее' : 'Next',
      prevBtnText: language === 'ru' ? 'Назад' : 'Previous',
      doneBtnText: language === 'ru' ? 'Готово' : 'Done',
      progressText: language === 'ru' ? '{{current}} из {{total}}' : '{{current}} of {{total}}',
      steps,
      onDestroyStarted: () => {
        trackDemoAction('tour_completed');
        driverObj.destroy();
      },
    });

    trackDemoAction('tour_started');
    driverObj.drive();
  };

  return { startTour };
};
