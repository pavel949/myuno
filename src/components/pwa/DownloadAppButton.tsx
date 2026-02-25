import { useState } from "react";
import { Download, ArrowRight, Smartphone, Check, Loader2 } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

type InstallState = 'idle' | 'installing' | 'success';

export function DownloadAppButton() {
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [installState, setInstallState] = useState<InstallState>('idle');

  const texts = {
    en: {
      title: "Download App",
      subtitle: "Quick access without browser",
      iosHint: "Add to Home Screen",
      installing: "Installing...",
      installed: "App Installed",
      installedHint: "Open from your home screen"
    },
    ru: {
      title: "Скачать приложение",
      subtitle: "Быстрый доступ без браузера",
      iosHint: "Добавить на главный экран",
      installing: "Установка...",
      installed: "Приложение установлено",
      installedHint: "Откройте с главного экрана"
    }
  };

  const t = texts[language] || texts.en;

  // Show success state if installed
  if (isInstalled || installState === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-success/10 border border-success/30"
      >
        <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-success-foreground" />
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-medium text-success text-sm">
            {t.installed}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {t.installedHint}
          </p>
        </div>
      </motion.div>
    );
  }

  const handleClick = async () => {
    // If prompt is already available, use it immediately
    if (canInstall) {
      setInstallState('installing');
      const success = await install();
      if (success) {
        setInstallState('success');
        return;
      }
      setInstallState('idle');
      return;
    }

    // On Android: wait up to 3s for the beforeinstallprompt event
    if (!isIOS) {
      setInstallState('installing');
      const installed = await new Promise<boolean>((resolve) => {
        const handler = async (e: Event) => {
          e.preventDefault();
          window.removeEventListener('beforeinstallprompt', handler);
          // Trigger install via the context (it picks up the global prompt)
          const success = await install();
          resolve(success);
        };
        window.addEventListener('beforeinstallprompt', handler);
        setTimeout(() => {
          window.removeEventListener('beforeinstallprompt', handler);
          resolve(false);
        }, 3000);
      });
      if (installed) {
        setInstallState('success');
        return;
      }
      setInstallState('idle');
    }

    // iOS or prompt never fired — fallback to instructions
    window.location.href = '/install';
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      onClick={handleClick}
      disabled={installState === 'installing'}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/80 hover:border-primary/20 transition-all duration-200 active:scale-[0.98] group disabled:opacity-70 disabled:cursor-wait"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {installState === 'installing' ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : isIOS ? (
          <Smartphone className="w-5 h-5 text-primary" />
        ) : (
          <Download className="w-5 h-5 text-primary" />
        )}
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <h3 className="font-medium text-foreground text-sm">
          {installState === 'installing' 
            ? t.installing 
            : isIOS ? t.iosHint : t.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {t.subtitle}
        </p>
      </div>
      
      {installState !== 'installing' && (
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      )}
    </motion.button>
  );
}
