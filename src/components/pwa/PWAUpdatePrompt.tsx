import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_VERSION, forceCleanAllCaches } from '@/lib/appVersion';
import { UPDATE_AVAILABLE_EVENT } from './VersionWatcher';
import { logger } from '@/lib/logger';

/**
 * Non-blocking "Update available" prompt. Listens for the
 * `myuno:update-available` CustomEvent dispatched by {@link VersionWatcher}.
 *
 * UX:
 *  - Bottom-right toast card on desktop, bottom strip on mobile.
 *  - "Update now" → unregister SW + clear caches + cache-busting reload.
 *  - "Later" → hidden for the current session (per new version key).
 */
export function PWAUpdatePrompt() {
  const { language } = useLanguage();
  const [pendingVersion, setPendingVersion] = React.useState<string | null>(null);
  const [reloading, setReloading] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ version?: string }>).detail;
      const v = detail?.version;
      if (!v || v === APP_VERSION) return;

      const dismissKey = `pwa_update_dismissed_v${v}`;
      if (sessionStorage.getItem(dismissKey) === 'true') return;

      setPendingVersion(v);
    };

    window.addEventListener(UPDATE_AVAILABLE_EVENT, handler as EventListener);
    return () => window.removeEventListener(UPDATE_AVAILABLE_EVENT, handler as EventListener);
  }, []);

  const handleUpdate = async () => {
    if (!pendingVersion || reloading) return;
    setReloading(true);
    try {
      await forceCleanAllCaches();
    } catch (err) {
      logger.warn('[PWAUpdatePrompt] cache cleanup failed', err);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('_v', pendingVersion);
    window.location.replace(url.toString());
  };

  const handleDismiss = () => {
    if (!pendingVersion) return;
    sessionStorage.setItem(`pwa_update_dismissed_v${pendingVersion}`, 'true');
    setPendingVersion(null);
  };

  const texts = {
    ru: {
      title: 'Доступно обновление',
      description: 'Новая версия приложения готова. Обновитесь, чтобы получить последние правки.',
      update: 'Обновить',
      later: 'Позже',
      reloading: 'Обновляем…',
    },
    en: {
      title: 'Update available',
      description: 'A new version of the app is ready. Reload to get the latest fixes.',
      update: 'Update now',
      later: 'Later',
      reloading: 'Updating…',
    },
  } as const;

  const t = texts[language] ?? texts.en;
  const visible = !!pendingVersion;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-6 md:bottom-6 md:w-96"
          role="status"
          aria-live="polite"
        >
          <div className="bg-background/95 backdrop-blur border-2 border-primary/50 rounded-none p-4 shadow-2xl shadow-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-none bg-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label={language === 'ru' ? 'Закрыть' : 'Dismiss'}
                    disabled={reloading}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={handleUpdate}
                    size="sm"
                    className="gap-2 flex-1"
                    disabled={reloading}
                  >
                    <RefreshCw className={`w-4 h-4 ${reloading ? 'animate-spin' : ''}`} />
                    {reloading ? t.reloading : t.update}
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    disabled={reloading}
                  >
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
