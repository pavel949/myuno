import { useState, useEffect } from "react";
import { 
  Download, 
  Smartphone, 
  Share, 
  Plus, 
  MoreVertical, 
  Check, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Bell,
  Wifi,
  Shield,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { IOSInstallGuide } from "@/components/pwa/IOSInstallGuide";
import { AndroidInstallGuide } from "@/components/pwa/AndroidInstallGuide";
import { usePWATracking } from "@/hooks/usePWATracking";
import { usePWAInstall } from "@/hooks/usePWAInstall";

type InstallState = 'idle' | 'installing' | 'success' | 'already-installed';

const Install = () => {
  const { language } = useLanguage();
  const { trackInstall } = usePWATracking();
  const { canInstall, isInstalled, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [progress, setProgress] = useState(0);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  // Sync installed state from context
  useEffect(() => {
    if (isInstalled && !window.location.search.includes('force')) {
      setInstallState('already-installed');
    }
  }, [isInstalled]);

  // Auto-show install guide on mobile devices when no native prompt
  useEffect(() => {
    if (!canInstall && !isInstalled && installState === 'idle') {
      // Small delay for better UX
      const timer = setTimeout(() => {
        if (isIOS) {
          setShowIOSGuide(true);
        } else if (isAndroid) {
          setShowAndroidGuide(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isIOS, isAndroid, canInstall, isInstalled, installState]);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    return interval;
  };

  const handleInstallClick = async () => {
    // If we have the native prompt (via context), use it
    if (canInstall) {
      setInstallState('installing');
      const progressInterval = simulateProgress();

      try {
        const success = await install();

        clearInterval(progressInterval);

        if (success) {
          setProgress(100);
          setInstallState('success');
          
          // Track the install
          const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
          trackInstall({ platform, source: 'install_page' });
        } else {
          setInstallState('idle');
          setProgress(0);
        }
      } catch (error) {
        clearInterval(progressInterval);
        setInstallState('idle');
        setProgress(0);
      }
    } else if (isIOS) {
      // Show iOS interactive guide
      setShowIOSGuide(true);
    } else if (isAndroid) {
      // Show Android interactive guide
      setShowAndroidGuide(true);
    }
  };

  const t = language === 'ru' ? {
    title: 'Установить myUNO',
    subtitle: 'Быстрый доступ с главного экрана',
    installButton: 'Установить приложение',
    showGuide: 'Показать инструкцию',
    installing: 'Установка...',
    successTitle: 'Приложение установлено!',
    successDesc: 'Иконка myUNO добавлена на главный экран',
    openApp: 'Открыть приложение',
    alreadyTitle: 'Уже установлено',
    alreadyDesc: 'myUNO уже на вашем главном экране',
    appSize: '~2 МБ • Бесплатно',
    benefits: {
      title: 'Преимущества приложения',
      items: [
        { icon: Zap, text: 'Быстрый запуск без браузера' },
        { icon: Bell, text: 'Push-уведомления о заказах' },
        { icon: Wifi, text: 'Работает офлайн' },
        { icon: Shield, text: 'Безопасное хранение данных' },
      ]
    },
    iosTitle: 'Установка на iPhone/iPad (Safari)',
    iosSteps: [
      { icon: Share, text: 'Нажмите кнопку "Поделиться" (□↑) внизу экрана' },
      { icon: Plus, text: 'Прокрутите вниз и выберите "На экран Домой"' },
      { icon: CheckCircle2, text: 'Нажмите "Добавить" в правом верхнем углу' },
    ],
    iosNote: '⚠️ Важно: Используйте Safari. В Chrome/Firefox эта опция недоступна.',
    androidTitle: 'Установка на Android (Chrome)',
    androidSteps: [
      { icon: MoreVertical, text: 'Нажмите меню (⋮) в правом верхнем углу Chrome' },
      { icon: Download, text: 'Выберите "Установить приложение" или "Добавить на главный экран"' },
      { icon: CheckCircle2, text: 'Подтвердите установку' },
    ],
  } : {
    title: 'Install myUNO',
    subtitle: 'Quick access from your home screen',
    installButton: 'Install App',
    showGuide: 'Show Instructions',
    installing: 'Installing...',
    successTitle: 'App Installed!',
    successDesc: 'myUNO icon added to your home screen',
    openApp: 'Open App',
    alreadyTitle: 'Already Installed',
    alreadyDesc: 'myUNO is already on your home screen',
    appSize: '~2 MB • Free',
    benefits: {
      title: 'App Benefits',
      items: [
        { icon: Zap, text: 'Fast launch without browser' },
        { icon: Bell, text: 'Push notifications for orders' },
        { icon: Wifi, text: 'Works offline' },
        { icon: Shield, text: 'Secure data storage' },
      ]
    },
    iosTitle: 'Install on iPhone/iPad (Safari)',
    iosSteps: [
      { icon: Share, text: 'Tap the Share button (□↑) at the bottom' },
      { icon: Plus, text: 'Scroll down and tap "Add to Home Screen"' },
      { icon: CheckCircle2, text: 'Tap "Add" in the top right corner' },
    ],
    iosNote: '⚠️ Important: Use Safari. This option is not available in Chrome/Firefox.',
    androidTitle: 'Install on Android (Chrome)',
    androidSteps: [
      { icon: MoreVertical, text: 'Tap the menu (⋮) in the top right of Chrome' },
      { icon: Download, text: 'Select "Install app" or "Add to Home screen"' },
      { icon: CheckCircle2, text: 'Confirm installation' },
    ],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Success screen
  if (installState === 'success') {
    return (
      <PageContainer>
        <PageHeader title={t.title} showBack />
        <motion.div 
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
            className="relative mb-6"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold mb-2"
          >
            {t.successTitle}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            {t.successDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3 w-full max-w-xs"
          >
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full gap-2"
              size="lg"
            >
              <Smartphone className="w-5 h-5" />
              {t.openApp}
            </Button>
          </motion.div>
        </motion.div>
      </PageContainer>
    );
  }

  // Already installed screen
  if (installState === 'already-installed') {
    const handleClearCache = async () => {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          await caches.delete(name);
        }
      }
      // Reload with force flag
      window.location.href = '/install?force=1';
    };

    return (
      <PageContainer>
        <PageHeader title={t.title} showBack />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
          >
            <Check className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">{t.alreadyTitle}</h2>
          <p className="text-muted-foreground">{t.alreadyDesc}</p>
          <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
            <Button 
              onClick={() => window.location.href = '/'}
              className="gap-2"
              size="lg"
            >
              <ArrowRight className="w-5 h-5" />
              {t.openApp}
            </Button>
            <Button 
              onClick={handleClearCache}
              variant="outline"
              size="sm"
              className="text-muted-foreground"
            >
              {language === 'ru' ? 'Не вижу иконку? Сбросить кэш' : "Don't see the icon? Clear cache"}
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Determine which steps to show
  const showNativeInstall = canInstall;
  const currentSteps = isIOS ? t.iosSteps : t.androidSteps;
  const stepsTitle = isIOS ? t.iosTitle : t.androidTitle;

  return (
    <>
      {/* iOS Interactive Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />
        )}
      </AnimatePresence>

      {/* Android Interactive Guide Modal */}
      <AnimatePresence>
        {showAndroidGuide && (
          <AndroidInstallGuide onClose={() => setShowAndroidGuide(false)} />
        )}
      </AnimatePresence>

      <PageContainer>
        <PageHeader title={t.title} showBack />
        
        <motion.div 
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center py-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t.appSize}</p>
          </motion.div>

          {/* Install Button - ALWAYS visible */}
          <motion.div variants={itemVariants} className="space-y-3">
            <AnimatePresence mode="wait">
              {installState === 'installing' ? (
                <motion.div
                  key="installing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="font-medium">{t.installing}</span>
                  </div>
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}%</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Button 
                    onClick={handleInstallClick} 
                    className="w-full h-14 text-lg gap-3 shadow-lg shadow-primary/20"
                    size="lg"
                  >
                    {isIOS ? (
                      <>
                        <Share className="w-6 h-6" />
                        {showNativeInstall ? t.installButton : t.showGuide}
                      </>
                    ) : (
                      <>
                        <Download className="w-6 h-6" />
                        {showNativeInstall ? t.installButton : t.showGuide}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{t.benefits.title}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {t.benefits.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground leading-tight pt-1">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Manual Installation Steps (shown when no native prompt) */}
          {!showNativeInstall && (
            <motion.div variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    {isIOS ? (
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">iOS</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                    )}
                    {stepsTitle}
                  </h3>
                  <div className="space-y-4">
                    {currentSteps.map((step, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-4"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <step.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-muted-foreground">
                            {language === "ru" ? "Шаг" : "Step"} {index + 1}
                          </span>
                          <p className="text-sm font-medium">{step.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Safari warning for iOS */}
                  {isIOS && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                        <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{(t as any).iosNote || "⚠️ Important: Use Safari. This option is not available in Chrome/Firefox."}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </PageContainer>
    </>
  );
};

export default Install;
