import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';

const CONSENT_KEY = 'myuno-cookie-consent';

interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  timestamp: string;
}

function getStoredConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const CookieConsentBanner = forwardRef<HTMLDivElement>(function CookieConsentBanner(_props, ref) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functional: true,
    marketing: false,
    timestamp: '',
  });

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      let intervalId: ReturnType<typeof setInterval> | null = null;
      const timer = setTimeout(() => {
        const hasBlockingModal = document.querySelector('[data-radix-dialog-overlay]');
        if (hasBlockingModal) {
          const pollStart = Date.now();
          intervalId = setInterval(() => {
            if (!document.querySelector('[data-radix-dialog-overlay]') || Date.now() - pollStart > 10000) {
              setVisible(true);
              if (intervalId) clearInterval(intervalId);
              intervalId = null;
            }
          }, 1000);
          return;
        }
        setVisible(true);
      }, 5000);
      return () => {
        clearTimeout(timer);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, []);

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    const final = { ...prefs, essential: true, timestamp: new Date().toISOString() };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(final));
    } catch (error) {
      logger.warn('Failed to persist cookie consent, applying for current session only', error);
    } finally {
      setVisible(false);
    }
  }, []);

  const acceptAll = () => {
    saveConsent({ essential: true, analytics: true, functional: true, marketing: true, timestamp: '' });
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectOptional = () => {
    saveConsent({ essential: true, analytics: false, functional: false, marketing: false, timestamp: '' });
  };

  if (!visible) return <div ref={ref} />;

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe pointer-events-none"
      >
        <div
          className="max-w-lg mx-auto bg-card border border-border rounded-none shadow-2xl overflow-hidden pointer-events-auto isolate"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 pb-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10 shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">
                  {isRu ? 'Мы используем cookie' : 'We use cookies'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {isRu
                    ? 'Мы используем cookie для улучшения работы сервиса. Вы можете настроить предпочтения.'
                    : 'We use cookies to improve our service. You can customize your preferences.'}
                  {' '}
                  <Link to="/cookies" className="text-primary hover:underline">
                    {isRu ? 'Подробнее' : 'Learn more'}
                  </Link>
                </p>
              </div>
              <button onClick={rejectOptional} className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3 space-y-2.5 border-t border-border pt-3">
                  {[
                    { key: 'essential' as const, label: isRu ? 'Необходимые' : 'Essential', desc: isRu ? 'Обязательные для работы' : 'Required for functionality', locked: true },
                    { key: 'functional' as const, label: isRu ? 'Функциональные' : 'Functional', desc: isRu ? 'Язык, валюта, тема' : 'Language, currency, theme', locked: false },
                    { key: 'analytics' as const, label: isRu ? 'Аналитика' : 'Analytics', desc: isRu ? 'Анонимная статистика' : 'Anonymous statistics', locked: false },
                    { key: 'marketing' as const, label: isRu ? 'Маркетинг' : 'Marketing', desc: isRu ? 'Персонализированная реклама' : 'Personalized ads', locked: false },
                  ].map((cat) => (
                    <div key={cat.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.desc}</p>
                      </div>
                      <Switch
                        checked={preferences[cat.key]}
                        onCheckedChange={(v) => !cat.locked && setPreferences(p => ({ ...p, [cat.key]: v }))}
                        disabled={cat.locked}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="p-4 pt-2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {isRu ? 'Настроить' : 'Customize'}
            </Button>
            <div className="flex-1" />
            {showSettings ? (
              <Button size="sm" onClick={acceptSelected} className="text-xs">
                {isRu ? 'Сохранить выбор' : 'Save preferences'}
              </Button>
            ) : (
              <Button size="sm" onClick={acceptAll} className="text-xs">
                {isRu ? 'Принять все' : 'Accept all'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

/** Utility to check if user consented to a specific category */
export function hasCookieConsent(category: 'analytics' | 'functional' | 'marketing'): boolean {
  const consent = getStoredConsent();
  if (!consent) return false;
  return consent[category] === true;
}
