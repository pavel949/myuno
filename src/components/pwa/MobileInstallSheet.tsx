import { useState, useEffect } from 'react';
import { Download, Zap, Bell, Wifi, Share, Plus, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerOverlay } from '@/components/ui/drawer';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePWATracking } from '@/hooks/usePWATracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';

const SHEET_SHOWN_KEY = 'pwa_install_sheet_shown';
const PAGE_VIEW_KEY = 'pwa_install_page_views';
const SHEET_COOLDOWN = 30 * 24 * 60 * 60 * 1000; // 30 days
const MIN_PAGE_VIEWS = 3; // Show only after user has explored at least 3 pages

/**
 * Full-screen bottom sheet that appears once for engaged mobile visitors.
 * Triggered after the user has navigated through at least MIN_PAGE_VIEWS
 * pages — never on landing, never on a timer (less interruptive).
 */
export function MobileInstallSheet() {
  const [open, setOpen] = useState(false);
  const { isInstalled, canInstall, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  const { trackInstall } = usePWATracking();
  const isMobileViewport = useIsMobile();
  const { language } = useLanguage();

  useEffect(() => {
    if (isInstalled) return;

    const shouldShow = isMobile || isIOS || isAndroid || isMobileViewport;
    if (!shouldShow) return;

    const shownAt = localStorage.getItem(SHEET_SHOWN_KEY);
    if (shownAt && Date.now() - parseInt(shownAt, 10) < SHEET_COOLDOWN) return;

    // Increment page-view counter on each mount (route change)
    const views = parseInt(localStorage.getItem(PAGE_VIEW_KEY) || '0', 10) + 1;
    localStorage.setItem(PAGE_VIEW_KEY, String(views));

    // Show only after the user has shown engagement (3+ page views)
    if (views >= MIN_PAGE_VIEWS) {
      // Tiny delay so the prompt feels triggered by the page settling, not the route change
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isMobile, isIOS, isAndroid, isMobileViewport]);

  const handleDismiss = () => {
    localStorage.setItem(SHEET_SHOWN_KEY, Date.now().toString());
    setOpen(false);
  };

  const handleInstall = async () => {
    if (canInstall) {
      const success = await install();
      if (success) {
        await trackInstall({ platform: isAndroid ? 'android' : 'desktop', source: 'install_sheet' });
        toast.success(
          language === 'ru'
            ? 'Готово — иконка на главном экране'
            : 'Done — icon added to your home screen'
        );
        handleDismiss();
        return;
      }
    }
    // Fallback: dismiss and redirect to /install for inline instructions
    handleDismiss();
    window.location.href = '/install';
  };

  const t = language === 'ru' ? {
    title: 'myUNO доступен как приложение',
    subtitle: 'Установите для быстрого доступа прямо с главного экрана',
    installBtn: canInstall ? 'Установить' : 'Как установить',
    skipBtn: 'Не сейчас',
    benefits: [
      { icon: Zap, text: 'Мгновенный запуск без браузера' },
      { icon: Bell, text: 'Push-уведомления о заказах' },
      { icon: Wifi, text: 'Работает без интернета' },
    ],
    iosHint: 'Нажмите "Поделиться" → "На экран Домой"',
    androidHint: 'Нажмите ⋮ → "Установить приложение"',
    free: 'Бесплатно · ~2 МБ',
  } : {
    title: 'myUNO is available as an app',
    subtitle: 'Install for quick access right from your home screen',
    installBtn: canInstall ? 'Install App' : 'How to Install',
    skipBtn: 'Not now',
    benefits: [
      { icon: Zap, text: 'Instant launch without a browser' },
      { icon: Bell, text: 'Push notifications for orders' },
      { icon: Wifi, text: 'Works offline' },
    ],
    iosHint: 'Tap Share → "Add to Home Screen"',
    androidHint: 'Tap ⋮ → "Install app"',
    free: 'Free · ~2 MB',
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DrawerOverlay />
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-4 mt-2" />

        <div className="px-6 pb-8 space-y-5">
          {/* App icon + title */}
          <div className="flex items-center gap-4">
            <img
              src="/icons/icon-192x192.png"
              alt="myUNO"
              className="w-16 h-16 rounded-none shadow-lg"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground">{t.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t.subtitle}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t.free}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {t.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-sm text-foreground">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Quick hint for manual install */}
          {!canInstall && (
            <div className="rounded-none bg-muted/50 border border-border/50 p-3 flex items-center gap-3">
              {isIOS ? (
                <>
                  <Share className="w-5 h-5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">{t.iosHint}</p>
                </>
              ) : (
                <>
                  <MoreVertical className="w-5 h-5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">{t.androidHint}</p>
                </>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 pt-1">
            <Button
              onClick={handleInstall}
              className="w-full h-13 text-base gap-2 shadow-lg shadow-primary/20"
              size="lg"
            >
              <Download className="w-5 h-5" />
              {t.installBtn}
            </Button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.skipBtn}
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
