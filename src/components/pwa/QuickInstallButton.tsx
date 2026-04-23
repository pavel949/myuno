import { useState } from 'react';
import { Download, Share, Plus, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

type InstallState = 'idle' | 'installing' | 'success';

export function QuickInstallButton() {
  const { isInstalled, canInstall, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const isRu = language === 'ru';

  // Show success state if installed
  if (isInstalled || installState === 'success') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2 rounded-none bg-success/10 border border-success/30"
      >
        <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
          <Check className="h-5 w-5 text-success-foreground" />
        </div>
        <span className="font-medium text-success">
          {isRu ? 'Приложение установлено' : 'App Installed'}
        </span>
      </motion.div>
    );
  }

  const handleInstall = async () => {
    if (canInstall) {
      setInstallState('installing');
      const success = await install();
      if (success) {
        setInstallState('success');
        return;
      }
      setInstallState('idle');
    }
    
    if (isIOS) {
      setShowIOSModal(true);
    } else if (!canInstall) {
      window.location.href = '/install';
    }
  };

  return (
    <>
      <Button
        onClick={handleInstall}
        disabled={installState === 'installing'}
        className="gap-2 bg-primary hover:bg-primary/90 min-w-[200px]"
        size="lg"
      >
        {installState === 'installing' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isRu ? 'Установка...' : 'Installing...'}
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            {isRu ? 'Установить приложение' : 'Install App'}
          </>
        )}
      </Button>

      {/* iOS Quick Install Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-background rounded-none p-5 shadow-xl relative"
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
