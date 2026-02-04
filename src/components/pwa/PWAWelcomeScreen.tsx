import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWA_WELCOME_SHOWN_KEY = 'pwa_welcome_shown';

export function PWAWelcomeScreen() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    // Check if welcome was already shown
    const wasShown = localStorage.getItem(PWA_WELCOME_SHOWN_KEY);
    
    if (isStandalone && !wasShown) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(PWA_WELCOME_SHOWN_KEY, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="mx-auto mb-5 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                <Check className="w-6 h-6 text-primary" strokeWidth={3} />
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              <div className="flex items-center justify-center gap-2 mb-2 w-full">
                <Sparkles className="w-4 h-4 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wide">
                  Установлено
                </span>
                <Sparkles className="w-4 h-4 text-primary-foreground/80" />
              </div>
              
              <h1 className="text-3xl font-bold text-primary-foreground mb-1 text-center w-full">
                myUNO
              </h1>
              
              <p className="text-primary-foreground/90 text-base mb-6 text-center w-full">
                Добро пожаловать!
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleClose}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-5 text-base rounded-xl shadow-lg w-full"
              >
                Начать
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
