import { Download, ArrowRight, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export function DownloadAppButton() {
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      // Android/Chrome - trigger native install prompt
      const success = await install();
      if (success) {
        // Installation successful - button will hide automatically
        return;
      }
    }
    // iOS or fallback - go to install page with instructions
    window.location.href = '/install';
  };

  const texts = {
    en: {
      title: "Download App",
      subtitle: "Quick access without browser",
      iosHint: "Add to Home Screen"
    },
    ru: {
      title: "Скачать приложение",
      subtitle: "Быстрый доступ без браузера",
      iosHint: "Добавить на главный экран"
    }
  };

  const t = texts[language] || texts.en;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border hover:bg-muted/80 hover:border-primary/20 transition-all duration-200 active:scale-[0.98] group"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {isIOS ? (
          <Smartphone className="w-5 h-5 text-primary" />
        ) : (
          <Download className="w-5 h-5 text-primary" />
        )}
      </div>
      
      <div className="flex-1 text-left min-w-0">
        <h3 className="font-medium text-foreground text-sm">
          {isIOS ? t.iosHint : t.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {t.subtitle}
        </p>
      </div>
      
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </motion.button>
  );
}
