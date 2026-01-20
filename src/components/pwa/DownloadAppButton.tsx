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
      await install();
    } else {
      // iOS or fallback - go to install page with instructions
      window.location.href = '/install';
    }
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      onClick={handleClick}
      className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98] group"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/20" />
        <div className="absolute -left-2 -bottom-2 w-16 h-16 rounded-full bg-white/10" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          {isIOS ? (
            <Smartphone className="w-7 h-7 text-primary-foreground" />
          ) : (
            <Download className="w-7 h-7 text-primary-foreground" />
          )}
        </div>
        
        <div className="flex-1 text-left">
          <h3 className="font-bold text-primary-foreground text-lg">
            {isIOS ? t.iosHint : t.title}
          </h3>
          <p className="text-sm text-primary-foreground/80">
            {t.subtitle}
          </p>
        </div>
        
        <ArrowRight className="w-6 h-6 text-primary-foreground group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.button>
  );
}
