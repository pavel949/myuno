import { useState, useEffect, useCallback, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cookie, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredConsent, saveCookieConsent, type CookiePreferences } from '@/lib/cookieConsent';

export const CookieConsentBanner = forwardRef<HTMLDivElement>(function CookieConsentBanner(_props, ref) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;
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
    if (getStoredConsent()) return; // already consented — never show again
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timer = setTimeout(() => {
      if (getStoredConsent()) return; // re-check just before showing
      const hasBlockingModal = document.querySelector('[data-radix-dialog-overlay]');
      if (hasBlockingModal) {
        const pollStart = Date.now();
        intervalId = setInterval(() => {
          if (getStoredConsent()) {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
            return;
          }
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
  }, []);

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    saveCookieConsent(prefs);
    setVisible(false);
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
        data-cookie-consent-banner
        className="fixed bottom-0 left-0 right-0 z-[110] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div
          className="max-w-lg mx-auto bg-card border border-border rounded-none shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain pointer-events-auto isolate"
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
                  {t('Мы используем cookie', 'We use cookies', "เราใช้คุกกี้")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t('Мы используем cookie для улучшения работы сервиса. Вы можете настроить предпочтения.', 'We use cookies to improve our service. You can customize your preferences.', "เราใช้คุกกี้เพื่อปรับปรุงบริการของเรา คุณสามารถปรับแต่งการตั้งค่าได้")}
                  {' '}
                  <Link to="/cookies" className="text-primary hover:underline">
                    {t('Подробнее', 'Learn more', "อ่านเพิ่มเติม")}
                  </Link>
                </p>
              </div>
              <button
                type="button"
                onClick={rejectOptional}
                aria-label={t('Закрыть баннер согласия на cookie', 'Dismiss cookie consent banner', "ปิดแบนเนอร์ความยินยอมใช้คุกกี้")}
                title={t('Закрыть', 'Dismiss', "ปิด")}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" aria-hidden="true" />
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
                    { key: 'essential' as const, label: t('Необходимые', 'Essential', "คุกกี้ที่จำเป็น"), desc: t('Обязательные для работы', 'Required for functionality', "จำเป็นต่อการทำงาน"), locked: true },
                    { key: 'functional' as const, label: t('Функциональные', 'Functional', "คุกกี้เพื่อการทำงาน"), desc: t('Язык, валюта, тема', 'Language, currency, theme', "ภาษา สกุลเงิน และธีม"), locked: false },
                    { key: 'analytics' as const, label: t('Аналитика', 'Analytics', "การวิเคราะห์"), desc: t('Анонимная статистика', 'Anonymous statistics', "สถิติที่ไม่ระบุตัวตน"), locked: false },
                    { key: 'marketing' as const, label: t('Маркетинг', 'Marketing', "การตลาด"), desc: t('Персонализированная реклама', 'Personalized ads', "โฆษณาที่ปรับให้เหมาะกับคุณ"), locked: false },
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
              {t('Настроить', 'Customize', "ตั้งค่า")}
            </Button>
            <div className="flex-1" />
            {showSettings ? (
              <Button size="sm" onClick={acceptSelected} className="text-xs">
                {t('Сохранить выбор', 'Save preferences', "บันทึกการตั้งค่า")}
              </Button>
            ) : (
              <Button size="sm" onClick={acceptAll} className="text-xs">
                {t('Принять все', 'Accept all', "ยอมรับทั้งหมด")}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

