import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWATracking } from '@/hooks/usePWATracking';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isInstalled, canInstall, isIOS, isAndroid, install } = usePWAInstall();
  const { trackInstall } = usePWATracking();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isInstalled) {
      setIsVisible(false);
      return;
    }

    // Check if banner was dismissed recently
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < BANNER_DISMISS_DURATION) {
        setIsVisible(false);
        return;
      }
    }

    // Show banner on mobile viewport immediately
    setIsVisible(isMobileViewport);
  }, [isMobileViewport, isInstalled]);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
    setShowIOSInstructions(false);
  };

  const handleInstall = async () => {
    setIsLoading(true);
    
    try {
      if (canInstall) {
        // Android/Chrome - trigger native install prompt
        const success = await install();
        if (success) {
          // Track successful installation
          const platform = isAndroid ? 'android' : 'desktop';
          await trackInstall({ platform, source: 'banner' });
          setIsVisible(false);
        }
      } else if (isIOS) {
        // iOS - show inline instructions (track as intent)
        await trackInstall({ platform: 'ios', source: 'banner' });
        setShowIOSInstructions(true);
      } else {
        // Fallback - go to install page with detailed instructions
        window.location.href = '/install';
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
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/20" />
            <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white/20" />
          </div>

          <div className="relative">
            {!showIOSInstructions ? (
              /* Main Install CTA */
              <div className="flex items-center gap-3">
                {/* App icon */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  {isIOS ? (
                    <Smartphone className="h-5 w-5 text-primary-foreground" />
                  ) : (
                    <Download className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 mr-1">
                  <h3 className="font-semibold text-primary-foreground text-sm leading-tight">
                    {isRu ? 'Установить myUNO' : 'Install myUNO'}
                  </h3>
                  <p className="text-xs text-primary-foreground/80 leading-tight">
                    {isRu 
                      ? 'Быстрый доступ без браузера' 
                      : 'Quick access without browser'}
                  </p>
                </div>

                {/* Install button */}
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
                    {isLoading 
                      ? (isRu ? 'Загрузка...' : 'Loading...') 
                      : (isRu ? 'Скачать' : 'Install')}
                  </span>
                </Button>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="shrink-0 p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  aria-label={isRu ? 'Закрыть' : 'Close'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              /* iOS Instructions Inline */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-primary-foreground text-sm">
                    {isRu ? 'Как установить на iPhone:' : 'How to install on iPhone:'}
                  </h3>
                  <button
                    onClick={handleDismiss}
                    className="p-1 rounded-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-primary-foreground">
                  {/* Step 1 */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                    <Share className="h-4 w-4" />
                  </div>
                  
                  {/* Arrow */}
                  <span className="text-primary-foreground/60">→</span>
                  
                  {/* Step 2 */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">
                      {isRu ? 'На экран' : 'Home Screen'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-primary-foreground/70">
                  {isRu 
                    ? 'Нажмите "Поделиться" внизу Safari, затем "На экран Домой"'
                    : 'Tap Share at the bottom of Safari, then "Add to Home Screen"'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
