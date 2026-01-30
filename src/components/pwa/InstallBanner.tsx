import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus, Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWATracking } from '@/hooks/usePWATracking';
import { useIsMobile } from '@/hooks/use-mobile';

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isInstalled, canInstall, isIOS, isAndroid, install } = usePWAInstall();
  const { trackInstall } = usePWATracking();
  const isMobileViewport = useIsMobile();

  useEffect(() => {
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < BANNER_DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    setIsVisible(isMobileViewport);
  }, [isMobileViewport, isInstalled]);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
    setShowInstructions(false);
  };

  const handleInstall = async () => {
    setIsLoading(true);
    
    try {
      if (canInstall) {
        // Native install prompt available (Chrome/Edge on Android, Desktop)
        const success = await install();
        if (success) {
          const platform = isAndroid ? 'android' : 'desktop';
          await trackInstall({ platform, source: 'banner' });
          setIsVisible(false);
        } else {
          // User dismissed prompt, show manual instructions
          setShowInstructions(true);
        }
      } else {
        // No native prompt - show manual instructions
        await trackInstall({ platform: isIOS ? 'ios' : 'android', source: 'banner' });
        setShowInstructions(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-3 shadow-lg"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
            <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white/20" />
          </div>

          <div className="relative">
            {!showInstructions ? (
              /* Main Install CTA */
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Download className="h-5 w-5 text-primary-foreground" />
                </div>

                <div className="flex-1 min-w-0 mr-1">
                  <h3 className="font-semibold text-primary-foreground text-sm leading-tight">
                    myUNO
                  </h3>
                  <p className="text-xs text-primary-foreground/80 leading-tight">
                    Установить приложение
                  </p>
                </div>

                <Button
                  onClick={handleInstall}
                  size="sm"
                  variant="secondary"
                  disabled={isLoading}
                  className="shrink-0 gap-1.5 bg-white text-primary hover:bg-white/90 h-9 px-3 disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoading ? '...' : 'Скачать'}
                  </span>
                </Button>

                <button
                  onClick={handleDismiss}
                  className="shrink-0 p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* Manual Install Instructions */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary-foreground text-sm">
                    {isIOS ? 'Установка на iPhone' : 'Установка на Android'}
                  </h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isIOS ? (
                  /* iOS Instructions */
                  <div className="flex items-center gap-4 text-primary-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                      <Share className="h-4 w-4" />
                    </div>
                    <span className="text-primary-foreground/60">→</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                      <Plus className="h-4 w-4" />
                      <span className="text-xs">На экран</span>
                    </div>
                  </div>
                ) : (
                  /* Android Instructions */
                  <div className="flex items-center gap-4 text-primary-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                      <MoreVertical className="h-4 w-4" />
                    </div>
                    <span className="text-primary-foreground/60">→</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                      <Download className="h-4 w-4" />
                      <span className="text-xs">Установить</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}