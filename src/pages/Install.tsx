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
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { usePWATracking } from "@/hooks/usePWATracking";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { logger } from "@/lib/logger";

type InstallState = "idle" | "installing" | "success" | "already-installed";

/**
 * Detect if user is on iOS but using Chrome/Firefox/Edge
 * (these browsers on iOS cannot install PWAs — Safari only).
 */
function detectIOSNonSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isNonSafari = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isNonSafari;
}

const Install = () => {
  const { language } = useLanguage();
  const { trackInstall } = usePWATracking();
  const { canInstall, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  const [installState, setInstallState] = useState<InstallState>("idle");
  const [progress, setProgress] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  const [isIOSNonSafari] = useState(detectIOSNonSafari);

  useEffect(() => {
    if (isInstalled && !window.location.search.includes("force")) {
      setInstallState("already-installed");
    }
  }, [isInstalled]);

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
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
    // Native prompt available — trigger it directly, no extra screens
    if (canInstall) {
      setInstallState("installing");
      const progressInterval = simulateProgress();

      try {
        const success = await install();
        clearInterval(progressInterval);

        if (success) {
          setProgress(100);
          setInstallState("success");
          const platform = isIOS ? "ios" : isAndroid ? "android" : "desktop";
          trackInstall({ platform, source: "install_page" });
          toast.success(
            language === "ru"
              ? "Готово — иконка на главном экране"
              : "Done — icon added to your home screen"
          );
        } else {
          setInstallState("idle");
          setProgress(0);
        }
      } catch (error) {
        clearInterval(progressInterval);
        setInstallState("idle");
        setProgress(0);
      }
      return;
    }

    // No native prompt — scroll user to inline instructions below
    const el = document.getElementById("manual-install-steps");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Cache clearing function for "already installed" state
  const handleClearCache = async () => {
    setIsClearing(true);
    logger.log("[myUNO] Starting aggressive cache clear...");

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      ["app_version", "manifest_version", "last_cache_cleanup", "pwa_installed"].forEach(
        (key) => localStorage.removeItem(key)
      );
      sessionStorage.clear();
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.replace(window.location.origin + "/?cache_bust=" + Date.now());
    } catch (error) {
      console.error("[myUNO] Cache clear error:", error);
      window.location.reload();
    }
  };

  const t =
    language === "ru"
      ? {
          title: "Установить myUNO",
          subtitle: "Иконка появится на главном экране за 2 шага",
          installButton: "Установить",
          showSteps: "Показать как",
          installing: "Установка…",
          successTitle: "Готово!",
          successDesc:
            "Закройте браузер и проверьте главный экран — иконка myUNO уже там",
          openApp: "Открыть приложение",
          alreadyTitle: "Уже установлено",
          alreadyDesc: "myUNO уже на вашем главном экране",
          appSize: "~2 МБ · бесплатно",
          benefitsTitle: "Что вы получите",
          benefits: [
            { icon: Zap, text: "Быстрый запуск без браузера" },
            { icon: Bell, text: "Уведомления о заказах" },
            { icon: Wifi, text: "Работает офлайн" },
            { icon: Shield, text: "Безопасное хранение" },
          ],
          iosChromeWarning: {
            title: "Откройте сайт в Safari",
            body: "В Chrome на iPhone нет функции установки. Скопируйте адрес и откройте в Safari — там появится «На экран Домой».",
            cta: "Скопировать адрес",
            copied: "Адрес скопирован",
          },
          stepsTitle: "Если кнопка не открыла системное окно",
          iosLabel: "На iPhone (Safari)",
          iosSteps: [
            { icon: Share, text: "Нажмите кнопку «Поделиться» внизу экрана" },
            { icon: Plus, text: "Выберите «На экран Домой»" },
            { icon: CheckCircle2, text: "Нажмите «Добавить»" },
          ],
          androidLabel: "На Android (Chrome)",
          androidSteps: [
            { icon: MoreVertical, text: "Нажмите ⋮ в правом верхнем углу" },
            { icon: Download, text: "Выберите «Установить приложение»" },
            { icon: CheckCircle2, text: "Подтвердите установку" },
          ],
          whereIcon:
            "После установки выйдите из браузера — иконка myUNO появится на главном экране телефона.",
        }
      : {
          title: "Install myUNO",
          subtitle: "Add to home screen in 2 steps",
          installButton: "Install",
          showSteps: "Show me how",
          installing: "Installing…",
          successTitle: "Done!",
          successDesc:
            "Close your browser and check your home screen — the myUNO icon is there",
          openApp: "Open App",
          alreadyTitle: "Already Installed",
          alreadyDesc: "myUNO is already on your home screen",
          appSize: "~2 MB · free",
          benefitsTitle: "What you get",
          benefits: [
            { icon: Zap, text: "Launches without the browser" },
            { icon: Bell, text: "Order notifications" },
            { icon: Wifi, text: "Works offline" },
            { icon: Shield, text: "Secure storage" },
          ],
          iosChromeWarning: {
            title: "Open this page in Safari",
            body: "Chrome on iPhone can't install web apps. Copy the address and open it in Safari — you'll see «Add to Home Screen» there.",
            cta: "Copy address",
            copied: "Address copied",
          },
          stepsTitle: "If the button didn't open the system dialog",
          iosLabel: "On iPhone (Safari)",
          iosSteps: [
            { icon: Share, text: "Tap the Share button at the bottom" },
            { icon: Plus, text: "Choose «Add to Home Screen»" },
            { icon: CheckCircle2, text: "Tap «Add»" },
          ],
          androidLabel: "On Android (Chrome)",
          androidSteps: [
            { icon: MoreVertical, text: "Tap ⋮ in the top right" },
            { icon: Download, text: "Choose «Install app»" },
            { icon: CheckCircle2, text: "Confirm installation" },
          ],
          whereIcon:
            "After installing, leave the browser — the myUNO icon will appear on your phone's home screen.",
        };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  // ── Success screen ────────────────────────────────────────────────
  if (installState === "success") {
    return (
      <AppLayout showHeader={false}>
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg shadow-success/30">
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

            <h2 className="text-2xl font-bold mb-2">{t.successTitle}</h2>
            <p className="text-muted-foreground mb-8 max-w-xs">{t.successDesc}</p>

            {/* Visual hint: phone home screen with myUNO icon highlighted */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8 mx-auto w-44 h-72 rounded-none border-4 border-foreground/10 bg-muted/30 p-3 relative overflow-hidden"
              aria-hidden
            >
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, i) => {
                  const isMyUno = i === 4;
                  return (
                    <div
                      key={i}
                      className={`aspect-square rounded-none ${
                        isMyUno
                          ? "bg-gradient-to-br from-primary to-primary/70 ring-4 ring-primary/40 shadow-lg shadow-primary/40 flex items-center justify-center"
                          : "bg-foreground/5"
                      }`}
                    >
                      {isMyUno && (
                        <span className="text-primary-foreground font-bold text-lg">
                          U
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute left-1/2 -translate-x-1/2 bottom-12 text-primary"
              >
                <ArrowRight className="w-6 h-6 -rotate-90" />
              </motion.div>
            </motion.div>

            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full max-w-xs gap-2"
              size="lg"
            >
              <Smartphone className="w-5 h-5" />
              {t.openApp}
            </Button>
          </motion.div>
        </PageContainer>
      </AppLayout>
    );
  }

  // ── Already installed screen ──────────────────────────────────────
  if (installState === "already-installed") {
    return (
      <AppLayout showHeader={false}>
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
                onClick={() => (window.location.href = "/")}
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
                className="text-muted-foreground gap-2"
                disabled={isClearing}
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === "ru" ? "Очистка…" : "Clearing…"}
                  </>
                ) : language === "ru" ? (
                  "Не вижу иконку? Сбросить кэш"
                ) : (
                  "Don't see the icon? Clear cache"
                )}
              </Button>
            </div>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // ── Main install screen ───────────────────────────────────────────
  return (
    <AppLayout showHeader={false}>
      <PageContainer>
        <PageHeader title={t.title} showBack />

        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero */}
          <motion.div variants={itemVariants} className="text-center py-4">
            <div className="w-20 h-20 rounded-none bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{t.appSize}</p>
          </motion.div>

          {/* iOS-Chrome warning — shown FIRST when relevant, replaces install button */}
          {isIOSNonSafari ? (
            <motion.div variants={itemVariants}>
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {t.iosChromeWarning.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t.iosChromeWarning.body}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(window.location.origin + "/install");
                        toast.success(t.iosChromeWarning.copied);
                      } catch {
                        toast.error("—");
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t.iosChromeWarning.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* Install button — single tap, opens native prompt or scrolls to manual */
            <motion.div variants={itemVariants}>
              <AnimatePresence mode="wait">
                {installState === "installing" ? (
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
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {Math.round(progress)}%
                    </p>
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
                        <Share className="w-6 h-6" />
                      ) : (
                        <Download className="w-6 h-6" />
                      )}
                      {canInstall ? t.installButton : t.showSteps}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Where is the icon hint */}
          <motion.div variants={itemVariants}>
            <p className="text-xs text-center text-muted-foreground/80 px-4">
              {t.whereIcon}
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">{t.benefitsTitle}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {t.benefits.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground leading-tight pt-1">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Inline manual steps — always visible, no separate modal */}
          <motion.div variants={itemVariants} id="manual-install-steps">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 space-y-5">
                <h3 className="font-semibold">{t.stepsTitle}</h3>

                {/* iOS steps — show first if iOS, else after Android */}
                {(isIOS || !isAndroid) && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/70 mb-2">
                      {t.iosLabel}
                    </p>
                    <ol className="space-y-2">
                      {t.iosSteps.map((step, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <step.icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm flex-1">
                            <span className="text-muted-foreground mr-1">
                              {index + 1}.
                            </span>
                            {step.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Android steps */}
                {(isAndroid || !isIOS) && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground/70 mb-2">
                      {t.androidLabel}
                    </p>
                    <ol className="space-y-2">
                      {t.androidSteps.map((step, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <step.icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm flex-1">
                            <span className="text-muted-foreground mr-1">
                              {index + 1}.
                            </span>
                            {step.text}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </PageContainer>
    </AppLayout>
  );
};

export default Install;
