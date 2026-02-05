/**
 * GuidedFallback - Never show "No results found"
 * Per UX Contract §4.1: Always provide guided fallback
 * - Human support / concierge option
 * - Explanation, not error
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GuidedFallbackProps {
  situationTitle?: string;
  className?: string;
}

export const GuidedFallback = memo(function GuidedFallback({
  situationTitle,
  className,
}: GuidedFallbackProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className={cn("text-center py-8 px-4", className)}>
      {/* Friendly illustration */}
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>

      {/* Explanation, not error */}
      <h3 className="text-lg font-semibold mb-2">
        {isRussian 
          ? 'Мы готовим для вас рекомендации' 
          : 'We\'re preparing recommendations for you'}
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
        {isRussian
          ? `Для "${situationTitle || 'этой ситуации'}" мы подбираем лучшие варианты. Пока можете связаться с нашим консьержем.`
          : `For "${situationTitle || 'this situation'}" we're selecting the best options. Meanwhile, you can contact our concierge.`}
      </p>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {/* Primary: Concierge chat */}
        <Button
          className="w-full gap-2"
          onClick={() => {
            // Open chat FAB or navigate to concierge
            const chatButton = document.querySelector('[data-chat-fab]') as HTMLButtonElement;
            chatButton?.click();
          }}
        >
          <MessageCircle className="w-4 h-4" />
          {isRussian ? 'Написать консьержу' : 'Chat with Concierge'}
        </Button>

        {/* Secondary: Call */}
        <Button
          variant="outline"
          className="w-full gap-2"
          asChild
        >
          <a href="tel:+66123456789">
            <Phone className="w-4 h-4" />
            {isRussian ? 'Позвонить' : 'Call Us'}
          </a>
        </Button>

        {/* Tertiary: Explore catalog */}
        <Button
          variant="ghost"
          className="w-full gap-2 text-muted-foreground"
          onClick={() => navigate('/discover')}
        >
          {isRussian ? 'Исследовать каталог' : 'Explore Catalog'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});
