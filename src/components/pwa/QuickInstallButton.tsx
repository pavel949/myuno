import { useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickInstallButton() {
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const isRu = language === 'ru';

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (canInstall) {
      // Android/Chrome - trigger native install prompt
      await install();
    } else if (isIOS) {
      // iOS - show quick instruction modal
      setShowIOSModal(true);
    } else {
      // Other browsers - go to install page
      window.location.href = '/install';
    }
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        className="gap-2 bg-primary hover:bg-primary/90"
        size="lg"
      >
        <Download className="h-5 w-5" />
        {isRu ? 'Установить приложение' : 'Install App'}
      </Button>

      {/* iOS Quick Install Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-background rounded-2xl p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>

              <h3 className="text-lg font-semibold text-center mb-4">
                {isRu ? 'Установка на iPhone' : 'Install on iPhone'}
              </h3>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Share className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isRu ? 'Шаг 1' : 'Step 1'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Нажмите кнопку "Поделиться" внизу Safari' 
                        : 'Tap the "Share" button at the bottom of Safari'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isRu ? 'Шаг 2' : 'Step 2'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Выберите "На экран Домой"' 
                        : 'Select "Add to Home Screen"'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isRu ? 'Шаг 3' : 'Step 3'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRu 
                        ? 'Нажмите "Добавить"' 
                        : 'Tap "Add"'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-5"
                variant="outline"
              >
                {isRu ? 'Понятно' : 'Got it'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
