import React, { useState, useEffect } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PropertyAIAssistant } from './PropertyAIAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface PropertyAIButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function PropertyAIButton({ className, variant = 'floating' }: PropertyAIButtonProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isRu = language === 'ru';

  // Show hint tooltip after 3 seconds for first-time visitors
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('propertyAIHintSeen');
    if (!hasSeenHint && variant === 'floating') {
      const timer = setTimeout(() => setShowHint(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [variant]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem('propertyAIHintSeen', 'true');
  };

  if (variant === 'inline') {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className={cn("gap-2", className)}>
            <Bot className="h-4 w-4" />
            {isRu ? 'AI-помощник' : 'AI Assistant'}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <PropertyAIAssistant 
            showCloseButton 
            onClose={() => setIsOpen(false)} 
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) dismissHint();
    }}>
      <div className="fixed bottom-20 right-4 z-50">
        {/* Hint tooltip */}
        <AnimatePresence>
          {showHint && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="absolute bottom-full right-0 mb-3 w-56"
            >
              <div className="bg-primary text-primary-foreground rounded-xl p-3 shadow-lg relative">
                <button 
                  onClick={dismissHint}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-background border border-border rounded-full flex items-center justify-center text-xs hover:bg-muted"
                >
                  ✕
                </button>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {isRu ? 'Нужна помощь?' : 'Need help?'}
                    </p>
                    <p className="text-xs opacity-90 mt-0.5">
                      {isRu 
                        ? 'AI поможет найти идеальное жильё' 
                        : 'AI will help find your perfect place'}
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-2 right-6 w-4 h-4 bg-primary rotate-45" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <SheetTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "rounded-full shadow-lg gap-2 pr-5 pl-4 h-12",
              "bg-primary",
              "hover:shadow-xl transition-all duration-200",
              className
            )}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {isRu ? 'AI-помощник' : 'AI Assistant'}
              </span>
            </div>
          </Button>
        </SheetTrigger>
      </div>
      
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <PropertyAIAssistant 
          showCloseButton 
          onClose={() => setIsOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
}
