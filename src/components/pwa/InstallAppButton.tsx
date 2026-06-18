import { useEffect, useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'myuno:install-cta:dismissed-at';
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

/**
 * Single "Download app" button.
 * - Android/Chrome: triggers native install prompt
 * - iOS Safari: opens a sheet with Add-to-Home-Screen instructions
 * - Hidden when app is already installed, in Lovable preview iframe, or on desktop
 */
export function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [iosOpen, setIosOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [inIframe, setInIframe] = useState(true);

  useEffect(() => {
    setInIframe(window.self !== window.top);
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (at && Date.now() - at < DISMISS_TTL_MS) setDismissed(true);
    } catch {
      /* noop */
    }
  }, []);

  if (inIframe || isInstalled || !isMobile || dismissed) return null;
  // On Android we need a deferred prompt to show real install
  if (!isIOS && !canInstall) return null;

  const handleClick = async () => {
    if (isIOS) {
      setIosOpen(true);
      return;
    }
    await install();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  return (
    <>
      <div
        className={cn(
          'fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-none',
          // Sit above mobile bottom nav (~80px) + safe area
          'bottom-[calc(env(safe-area-inset-bottom,0px)+88px)]',
        )}
      >
        <div className="pointer-events-auto flex items-center gap-2 bg-primary text-primary-foreground shadow-lg border border-primary/40 pl-4 pr-2 py-2 rounded-full">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClick}
            className="h-9 px-2 text-primary-foreground hover:bg-transparent hover:text-primary-foreground gap-2 font-semibold"
            aria-label={isRu ? 'Установить приложение myUNO' : 'Install myUNO app'}
          >
            <Download className="w-4 h-4" />
            {isRu ? 'Скачать приложение' : 'Download app'}
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={isRu ? 'Скрыть' : 'Dismiss'}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-primary-foreground/15 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Sheet open={iosOpen} onOpenChange={setIosOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{isRu ? 'Установить myUNO на iPhone' : 'Install myUNO on iPhone'}</SheetTitle>
            <SheetDescription>
              {isRu
                ? 'Safari не показывает кнопку установки автоматически. Добавьте приложение на домашний экран в 2 шага:'
                : 'Safari does not show an install button automatically. Add the app to your Home Screen in 2 steps:'}
            </SheetDescription>
          </SheetHeader>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                <Share className="w-4 h-4" />
              </span>
              <span>
                {isRu ? (
                  <>Нажмите кнопку <strong>Поделиться</strong> в нижней панели Safari.</>
                ) : (
                  <>Tap the <strong>Share</strong> button in the Safari toolbar.</>
                )}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted shrink-0">
                <Plus className="w-4 h-4" />
              </span>
              <span>
                {isRu ? (
                  <>Выберите <strong>«На экран Домой»</strong> → <strong>Добавить</strong>.</>
                ) : (
                  <>Choose <strong>Add to Home Screen</strong> → <strong>Add</strong>.</>
                )}
              </span>
            </li>
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            {isRu
              ? 'Приложение появится на домашнем экране как обычное мобильное приложение.'
              : 'The app will appear on your Home Screen like a regular mobile app.'}
          </p>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default InstallAppButton;
