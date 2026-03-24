import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_VERSION } from '@/lib/appVersion';

export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const DISMISSED_KEY = `pwa_prompt_dismissed_v${APP_VERSION}`;
  const [dismissed, setDismissed] = React.useState(
    () => sessionStorage.getItem(DISMISSED_KEY) === 'true'
  );

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      console.log(`[PWA] SW registered: ${swUrl} | App v${APP_VERSION}`);
      if (r) {
        // Immediate check on registration
        r.update();
        // Check for updates when tab regains focus (instead of polling every 2min)
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            console.log('[PWA] Tab visible — checking for SW updates...');
            r.update();
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
      }
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error:', error);
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
    // Force hard reload to clear old JS from memory
    setTimeout(() => window.location.reload(), 300);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
    setNeedRefresh(false);
  };

  // Show prompt only as fallback if auto-update didn't trigger reload
  const showPrompt = needRefresh && !dismissed;

  const texts = {
    ru: {
      title: 'Доступно обновление',
      description: 'Новая версия приложения готова к установке',
      update: 'Обновить',
      later: 'Позже',
    },
    en: {
      title: 'Update Available',
      description: 'A new version of the app is ready',
      update: 'Update Now',
      later: 'Later',
    },
  };

  const t = texts[language] || texts.en;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-6 md:bottom-6 md:w-96"
        >
          <div className="bg-background/95 backdrop-blur-xl border-2 border-primary/50 rounded-2xl p-4 shadow-2xl shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl gradient-gold flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button onClick={handleUpdate} size="sm" className="gap-2 flex-1">
                    <RefreshCw className="w-4 h-4" />
                    {t.update}
                  </Button>
                  <Button onClick={handleDismiss} size="sm" variant="ghost" className="text-muted-foreground">
                    {t.later}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
