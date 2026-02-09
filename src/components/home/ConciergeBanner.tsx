import React, { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const ConciergeBanner = memo(function ConciergeBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const whatsappUrl = getWhatsAppUrl(
    isRu ? 'Здравствуйте! Мне нужна помощь' : 'Hello! I need help'
  );

  return (
    <Card variant="surface" className="p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {isRu ? 'Нужна помощь?' : 'Need help?'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Менеджер ответит за 15 минут' : 'Our manager will reply in 15 min'}
        </p>
      </div>
      <Button size="sm" className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white" asChild>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          {isRu ? 'Написать' : 'Message'}
        </a>
      </Button>
    </Card>
  );
});
