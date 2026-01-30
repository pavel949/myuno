import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { isInstalled, install } = usePWAInstall();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  useEffect(() => {
    // Check if already installed
    if (isInstalled) return;

    // Check if banner was dismissed recently
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < BANNER_DISMISS_DURATION) {
        return;
      }
    }

    // Show banner on mobile viewport - instant show for quick UX
    if (isMobileViewport) {
      // Minimal delay just for animation to feel smooth
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isMobileViewport, isInstalled]);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
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
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
            <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white/20" />
          </div>

          <div className="relative flex items-center gap-3">
            {/* App icon */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 mr-1">
              <h3 className="font-semibold text-primary-foreground text-sm leading-tight">
                {isRussian ? 'Установить' : 'Install'}
              </h3>
              <p className="text-xs text-primary-foreground/80 leading-tight">
                {isRussian 
                  ? 'Быстрый доступ' 
                  : 'Quick access'}
              </p>
            </div>

            {/* Install button */}
            <Button
              onClick={handleInstall}
              size="sm"
              variant="secondary"
              className="shrink-0 gap-1.5 bg-white text-primary hover:bg-white/90 h-9 px-3"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isRussian ? 'Скачать' : 'Install'}
              </span>
            </Button>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 transition-colors"
              aria-label={isRussian ? 'Закрыть' : 'Close'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
