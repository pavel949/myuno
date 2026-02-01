import { useEffect, useState, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'uno_owner_tour_completed';

const dashboardSteps: Record<string, DriveStep[]> = {
  en: [
    {
      element: '[data-tour="quick-actions"]',
      popover: {
        title: '⚡ Quick Actions',
        description: 'Fast access to common tasks: import bookings, add expenses, request cleaning, and more.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="portfolio"]',
      popover: {
        title: '🏠 Your Portfolio',
        description: 'All your properties at a glance. Tap to see details, bookings, and performance.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="add-property"]',
      popover: {
        title: '➕ Add Property',
        description: 'Register your first property. Our wizard guides you through each step.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="finances"]',
      popover: {
        title: '💰 Financial Overview',
        description: 'Track income, expenses, and net profit. Export reports anytime.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="team"]',
      popover: {
        title: '👥 Team Management',
        description: 'Invite managers, agents, or management companies to help manage your properties.',
        side: 'top',
        align: 'center',
      },
    },
  ],
  ru: [
    {
      element: '[data-tour="quick-actions"]',
      popover: {
        title: '⚡ Быстрые действия',
        description: 'Быстрый доступ к частым задачам: импорт бронирований, добавление расходов, заказ уборки.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="portfolio"]',
      popover: {
        title: '🏠 Ваш портфель',
        description: 'Все объекты на одном экране. Нажмите для просмотра деталей и статистики.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="add-property"]',
      popover: {
        title: '➕ Добавить объект',
        description: 'Зарегистрируйте первый объект. Мастер проведёт через все шаги.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="finances"]',
      popover: {
        title: '💰 Финансовый обзор',
        description: 'Отслеживайте доходы, расходы и чистую прибыль. Экспортируйте отчёты.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="team"]',
      popover: {
        title: '👥 Управление командой',
        description: 'Приглашайте менеджеров, агентов или управляющие компании для помощи.',
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
    
    // Filter steps to only include elements that exist on the page
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
    // Only auto-start on dashboard
    if (!location.pathname.match(/^\/owner\/?$/)) return;
    
    // Check if tour was already completed
    const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
    if (tourCompleted && !forceStart) return;

    if ((autoStart || forceStart) && !hasStarted) {
      // Delay to ensure DOM elements are mounted
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
