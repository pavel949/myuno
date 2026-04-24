import { useState, useEffect, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Share, Plus, Loader2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWATracking } from '@/hooks/usePWATracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

const texts = {
  en: { install: 'Install app for quick access', download: 'Install', close: 'Close', iosTitle: 'Add to Home Screen', androidTitle: 'Install app', toScreen: 'Home Screen', successToast: 'Done — icon added to your home screen' },
  ru: { install: 'Установите для быстрого доступа', download: 'Установить', close: 'Закрыть', iosTitle: 'Добавить на экран', androidTitle: 'Установить', toScreen: 'На экран', successToast: 'Готово — иконка на главном экране' },
};

const BANNER_DISMISSED_KEY = 'pwa_banner_dismissed';
const BANNER_DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

export const InstallBanner = forwardRef<HTMLDivElement>(function InstallBanner(_, ref) {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isInstalled, canInstall, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  const { trackInstall } = usePWATracking();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();
  const t = texts[language] || texts.en;

  useEffect(() => {
    if (isInstalled) { setIsVisible(false); return; }
    const dismissedAt = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < BANNER_DISMISS_DURATION) {
      setIsVisible(false); return;
    }
    if (dismissedAt) localStorage.removeItem(BANNER_DISMISSED_KEY);
    // Show on any mobile device: PWA context detection OR viewport < 768px
    const shouldShow = isMobile || isIOS || isAndroid || isMobileViewport;
    setIsVisible(shouldShow);
  }, [isMobileViewport, isInstalled, isIOS, isAndroid, isMobile]);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
    setShowInstructions(false);
  };

  const handleInstall = async () => {
    setIsLoading(true);
    try {
      if (canInstall) {
        const success = await install();
        if (success) {
          await trackInstall({ platform: isAndroid ? 'android' : 'desktop', source: 'banner' });
          toast.success(t.successToast);
          setIsVisible(false);
          localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
        } else {
          // User declined the native prompt — show inline hint
          setShowInstructions(true);
        }
      } else {
        // No native prompt available — open the dedicated /install page
        // with full inline instructions (no extra modal layer)
        await trackInstall({ platform: isIOS ? 'ios' : 'android', source: 'banner' });
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
          ref={ref}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden w-full max-w-[1536px] mx-auto px-4 md:px-6 lg:px-8 xl:px-10 pt-2"
        >
          <div className="rounded-none border border-border/60 bg-card p-3">
            {!showInstructions ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-none bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <p className="flex-1 text-xs text-muted-foreground">{t.install}</p>
                <Button onClick={handleInstall} size="sm" variant="outline" disabled={isLoading} className="shrink-0 h-8 px-3 text-xs">
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t.download}
                </Button>
                <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none" aria-label={t.close}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-foreground">{isIOS ? t.iosTitle : t.androidTitle}</p>
                  <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-none" aria-label={t.close}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs">
                  {isIOS ? (
                    <>
                      <div className="flex items-center gap-1"><span className="font-medium">1.</span><Share className="h-3.5 w-3.5" /></div>
                      <span>→</span>
                      <div className="flex items-center gap-1"><span className="font-medium">2.</span><Plus className="h-3.5 w-3.5" /><span>{t.toScreen}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1"><span className="font-medium">1.</span><MoreVertical className="h-3.5 w-3.5" /></div>
                      <span>→</span>
                      <div className="flex items-center gap-1"><span className="font-medium">2.</span><Download className="h-3.5 w-3.5" /><span>{t.download}</span></div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
