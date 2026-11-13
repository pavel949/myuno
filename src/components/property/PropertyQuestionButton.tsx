import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import type { PropertyGuestContext } from '@/lib/real-estate/propertyGuestContext';
import { civilDateKey } from '@/lib/hotelDates';

export function PropertyQuestionButton({ propertyId, title, context, className }: {
  propertyId: string; title?: string | null; context?: PropertyGuestContext; className?: string;
}) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dates = context?.dateRange;
  const message = [
    isRu ? `Здравствуйте! У меня вопрос по объекту ${title ?? ''}.` : `Hello! I have a question about ${title ?? ''}.`,
    `https://myuno.app/property/${encodeURIComponent(propertyId)}?mode=rent`,
    dates?.from && dates.to ? `${civilDateKey(dates.from)} → ${civilDateKey(dates.to)}` : '',
    context ? `${isRu ? 'Гостей' : 'Guests'}: ${context.guests}` : '',
  ].filter(Boolean).join('\n');
  return <Button asChild variant="outline" className={className}>
    <a href={getWhatsAppUrl(message)} target="_blank" rel="noopener noreferrer">
      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{isRu ? 'Задать вопрос' : 'Ask a question'}<span className="text-muted-foreground"> · WhatsApp</span></span>
    </a>
  </Button>;
}