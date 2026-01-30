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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
            className="text-center max-w-sm"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
              className="mx-auto mb-6 w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                <Check className="w-8 h-8 text-primary" strokeWidth={3} />
              </div>
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 text-sm font-medium">
                  Установлено
                </span>
                <Sparkles className="w-5 h-5 text-primary-foreground/80" />
              </div>
              
              <h1 className="text-4xl font-bold text-primary-foreground mb-2">
                myUNO
              </h1>
              
              <p className="text-primary-foreground/80 text-lg mb-8">
                Добро пожаловать!
              </p>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleClose}
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg"
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
