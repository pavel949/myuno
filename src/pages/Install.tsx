import { useState, useEffect } from "react";
import { Download, Smartphone, Share, Plus, MoreVertical, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const t = {
    title: language === "ru" ? "Установить приложение" : "Install App",
    subtitle: language === "ru" 
      ? "Добавьте myUNO на главный экран для быстрого доступа" 
      : "Add myUNO to your home screen for quick access",
    installed: language === "ru" ? "Приложение установлено!" : "App installed!",
    installedDesc: language === "ru" 
      ? "myUNO уже добавлено на ваш главный экран" 
      : "myUNO is already on your home screen",
    installButton: language === "ru" ? "Установить" : "Install",
    benefits: {
      title: language === "ru" ? "Преимущества" : "Benefits",
      items: language === "ru" ? [
        "Быстрый запуск с главного экрана",
        "Работает без интернета",
        "Не занимает много места",
        "Мгновенные уведомления"
      ] : [
        "Quick launch from home screen",
        "Works offline",
        "Lightweight installation",
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

  if (isInstalled) {
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
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </motion.div>

        {/* Install Button (for supported browsers) */}
        {deferredPrompt && (
          <motion.div variants={itemVariants}>
            <Button 
              onClick={handleInstallClick} 
              className="w-full h-14 text-lg gap-3"
              size="lg"
            >
              <Download className="w-6 h-6" />
              {t.installButton}
            </Button>
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
