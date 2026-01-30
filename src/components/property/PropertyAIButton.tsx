import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PropertyAIAssistant } from './PropertyAIAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PropertyAIButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export function PropertyAIButton({ className, variant = 'floating' }: PropertyAIButtonProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isRu = language === 'ru';

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className={cn(
            "fixed bottom-20 right-4 z-50 rounded-full shadow-lg gap-2 pr-4",
            "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
            className
          )}
        >
          <Bot className="h-5 w-5" />
          <span className="text-sm font-medium">
            {isRu ? 'Найти жильё' : 'Find a place'}
          </span>
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
