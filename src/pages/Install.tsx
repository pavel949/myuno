import { useState, useEffect } from "react";
import { Download, Smartphone, Share, Plus, MoreVertical, Check, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = 'idle' | 'installing' | 'success' | 'already-installed';

const Install = () => {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [progress, setProgress] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setInstallState('already-installed');
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setInstallState('success');
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const simulateProgress = () => {
    setProgress(0);
    const steps = [15, 35, 55, 75, 90, 100];
    let stepIndex = 0;
    
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 300);
    
    return () => clearInterval(interval);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstallState('installing');
    const cleanup = simulateProgress();

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        // Wait for progress animation to complete
        setTimeout(() => {
          setInstallState('success');
        }, 2000);
      } else {
        setInstallState('idle');
        setProgress(0);
      }
    } catch (error) {
      console.error('Install error:', error);
      setInstallState('idle');
      setProgress(0);
    }
    
    setDeferredPrompt(null);
  };

  const t = {
    title: language === "ru" ? "Установить приложение" : "Install App",
    subtitle: language === "ru" 
      ? "Добавьте UNO на главный экран для быстрого доступа" 
      : "Add UNO to your home screen for quick access",
    installed: language === "ru" ? "Приложение установлено!" : "App installed!",
    installedDesc: language === "ru" 
      ? "UNO уже добавлено на ваш главный экран" 
      : "UNO is already on your home screen",
    installing: language === "ru" ? "Установка..." : "Installing...",
    installButton: language === "ru" ? "Установить" : "Install",
    successTitle: language === "ru" ? "Готово!" : "Done!",
    successDesc: language === "ru" 
      ? "UNO успешно установлено на ваше устройство" 
      : "UNO has been installed on your device",
    openApp: language === "ru" ? "Открыть приложение" : "Open App",
    appSize: language === "ru" ? "Размер: ~2 МБ" : "Size: ~2 MB",
    benefits: {
      title: language === "ru" ? "Преимущества" : "Benefits",
      items: language === "ru" ? [
        "Быстрый запуск с главного экрана",
        "Работает без интернета",
        "Не занимает много места (~2 МБ)",
        "Мгновенные уведомления"
      ] : [
        "Quick launch from home screen",
        "Works offline",
        "Lightweight installation (~2 MB)",
        "Instant notifications"
      ]
    },
    iosTitle: language === "ru" ? "Инструкция для iPhone" : "Instructions for iPhone",
    iosSteps: language === "ru" ? [
      { icon: Share, text: "Нажмите кнопку «Поделиться»" },
      { icon: Plus, text: "Выберите «На экран Домой»" },
      { icon: Check, text: "Нажмите «Добавить»" }
    ] : [
      { icon: Share, text: "Tap the Share button" },
      { icon: Plus, text: "Select 'Add to Home Screen'" },
      { icon: Check, text: "Tap 'Add'" }
    ],
    androidTitle: language === "ru" ? "Инструкция для Android" : "Instructions for Android",
    androidSteps: language === "ru" ? [
      { icon: MoreVertical, text: "Нажмите меню (⋮) в браузере" },
      { icon: Download, text: "Выберите «Добавить на главный экран»" },
      { icon: Check, text: "Подтвердите установку" }
    ] : [
      { icon: MoreVertical, text: "Tap browser menu (⋮)" },
      { icon: Download, text: "Select 'Add to Home Screen'" },
      { icon: Check, text: "Confirm installation" }
    ]
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
          <h2 className="text-2xl font-bold mb-2">{t.installed}</h2>
          <p className="text-muted-foreground">{t.installedDesc}</p>
        </div>
      </PageContainer>
    );
  }

  return (
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

        {/* Install Button with Progress */}
        {deferredPrompt && (
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
                    <p className="text-xs text-center text-muted-foreground">{progress}%</p>
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
                    <Download className="w-6 h-6" />
                    {t.installButton}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">{t.benefits.title}</h3>
              <ul className="space-y-2">
                {t.benefits.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* iOS Instructions */}
        {(isIOS || !isAndroid) && (
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">iOS</span>
                  </div>
                  {t.iosTitle}
                </h3>
                <div className="space-y-4">
                  {t.iosSteps.map((step, index) => (
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Android Instructions */}
        {(isAndroid || !isIOS) && (
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  {t.androidTitle}
                </h3>
                <div className="space-y-4">
                  {t.androidSteps.map((step, index) => (
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default Install;
