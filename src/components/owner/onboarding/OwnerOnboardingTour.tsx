import { useEffect, useState, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'uno_owner_tour_completed';

const dashboardSteps: Record<string, DriveStep[]> = {
  en: [
    {
      element: '[data-tour="active-stays"]',
      popover: {
        title: 'Current Guests',
        description: 'See who is currently staying at your properties and upcoming check-ins.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="properties"]',
      popover: {
        title: 'Your Properties',
        description: 'All your properties in one place. Tap to see details, bookings, and settings.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="operations"]',
      popover: {
        title: "Today's Tasks",
        description: 'Cleanings, maintenance, check-ins and check-outs for today.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="menu"]',
      popover: {
        title: 'Menu',
        description: 'Access channels, reports, support, and account settings.',
        side: 'top',
        align: 'center',
      },
    },
  ],
  ru: [
    {
      element: '[data-tour="active-stays"]',
      popover: {
        title: 'Текущие гости',
        description: 'Кто сейчас проживает в ваших объектах и ближайшие заезды.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="properties"]',
      popover: {
        title: 'Ваши объекты',
        description: 'Все объекты в одном месте. Нажмите для просмотра деталей и настроек.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="operations"]',
      popover: {
        title: 'Задачи на сегодня',
        description: 'Уборки, обслуживание, заезды и выезды на сегодня.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="menu"]',
      popover: {
        title: 'Меню',
        description: 'Каналы, отчёты, поддержка и настройки аккаунта.',
        side: 'top',
        align: 'center',
      },
    },
  ],
};

interface OwnerOnboardingTourProps {
  autoStart?: boolean;
  forceStart?: boolean;
  onComplete?: () => void;
}

export function OwnerOnboardingTour({ 
  autoStart = true, 
  forceStart = false,
  onComplete 
}: OwnerOnboardingTourProps) {
  const { language } = useLanguage();
  const location = useLocation();
  const [hasStarted, setHasStarted] = useState(false);

  const startTour = useCallback(() => {
    const steps = dashboardSteps[language] || dashboardSteps.en;
    
    const availableSteps = steps.filter(step => {
      if (!step.element) return true;
      return document.querySelector(step.element as string);
    });

    if (availableSteps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: language === 'ru' ? 'Далее' : 'Next',
      prevBtnText: language === 'ru' ? 'Назад' : 'Previous',
      doneBtnText: language === 'ru' ? 'Готово' : 'Done',
      progressText: language === 'ru' ? '{{current}} из {{total}}' : '{{current}} of {{total}}',
      steps: availableSteps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        onComplete?.();
        driverObj.destroy();
      },
    });

    setHasStarted(true);
    driverObj.drive();
  }, [language, onComplete]);

  useEffect(() => {
    if (!location.pathname.match(/^\/owner\/?$/)) return;
    
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (tourCompleted && !forceStart) return;

    if ((autoStart || forceStart) && !hasStarted) {
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, forceStart, hasStarted, location.pathname, startTour]);

  return null;
}

export function useOwnerTour() {
  const { language } = useLanguage();

  const startTour = useCallback(() => {
    const steps = dashboardSteps[language] || dashboardSteps.en;
    
    const availableSteps = steps.filter(step => {
      if (!step.element) return true;
      return document.querySelector(step.element as string);
    });

    if (availableSteps.length === 0) return;

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: language === 'ru' ? 'Далее' : 'Next',
      prevBtnText: language === 'ru' ? 'Назад' : 'Previous',
      doneBtnText: language === 'ru' ? 'Готово' : 'Done',
      progressText: language === 'ru' ? '{{current}} из {{total}}' : '{{current}} of {{total}}',
      steps: availableSteps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, [language]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  return { startTour, resetTour };
}
