import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWATracking } from '@/hooks/usePWATracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FLOATING, FLOATING_OFFSET } from '@/lib/nav/floatingStack';

const FAB_DISMISSED_KEY = 'pwa_fab_dismissed';
const FAB_DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Small floating action button (above the bottom nav) that reminds
 * mobile users they can install the app. Only shows after scrolling
 * a bit, so it doesn't interfere with the initial InstallBanner.
 */
export function FloatingInstallButton() {
  const [visible, setVisible] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const { isInstalled, canInstall, isAndroid, isIOS, isMobile, install } = usePWAInstall();
  const { trackInstall } = usePWATracking();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();

  useEffect(() => {
    if (isInstalled) return;
    const shouldShow = isMobile || isIOS || isAndroid || isMobileViewport;
    if (!shouldShow) return;

    const dismissedAt = localStorage.getItem(FAB_DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < FAB_DISMISS_DURATION) return;

    setVisible(true);
  }, [isInstalled, isMobile, isIOS, isAndroid, isMobileViewport]);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => setScrolledPast(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [visible]);

  const handleClick = async () => {
    if (canInstall) {
      const success = await install();
      if (success) {
        await trackInstall({ platform: isAndroid ? 'android' : 'desktop', source: 'fab' });
        setVisible(false);
        return;
      }
    }
    // Fallback to install page
    window.location.href = '/install';
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(FAB_DISMISSED_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  const label = language === 'ru' ? 'Установить' : 'Install';

  return (
    <AnimatePresence>
      {scrolledPast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`fixed ${FLOATING_OFFSET.aboveBottomNav} right-4 ${FLOATING.pwaInstall} md:hidden`}
        >
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium font-sans transition-colors',
              'bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-1 ring-primary/20',
              'hover:bg-primary/90 active:scale-[0.98]',
            )}
          >
            <Download className="w-4 h-4" />
            {label}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
