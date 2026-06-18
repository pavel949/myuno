/**
 * ConciergeRequestButton — кнопка «Запросить через myUNO» для замены
 * прямых телефон/email/whatsapp ссылок на карточках поставщиков.
 *
 * Контакты вендора всегда остаются внутри платформы — пользователь
 * пишет менеджеру myUNO, который соединяет стороны.
 */
import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConciergeHelpSheet, type HelpTopic } from './ConciergeHelpSheet';
import { trackEvent } from '@/lib/analytics/track';
import { cn } from '@/lib/utils';

export interface ConciergeRequestButtonProps {
  topic?: HelpTopic;
  vendorId?: string | null;
  vendorName?: string | null;
  listingId?: string | null;
  listingTitle?: string | null;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  fullWidth?: boolean;
  className?: string;
  label?: string;
}

export function ConciergeRequestButton({
  topic = 'general',
  vendorId,
  vendorName,
  listingId,
  listingTitle,
  size = 'default',
  variant = 'default',
  fullWidth,
  className,
  label,
}: ConciergeRequestButtonProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [open, setOpen] = useState(false);

  const finalLabel = label ?? (isRu ? 'Запросить через myUNO' : 'Request via myUNO');

  const initialSubject = listingTitle
    ? (isRu ? 'Запрос по: ' : 'Inquiry: ') + listingTitle
    : vendorName
      ? (isRu ? 'Запрос исполнителя: ' : 'Provider inquiry: ') + vendorName
      : undefined;

  const handleClick = () => {
    trackEvent('concierge_request_click', { topic, vendor_id: vendorId, listing_id: listingId });
    setOpen(true);
  };

  return (
    <>
      <Button
        size={size}
        variant={variant}
        onClick={handleClick}
        className={cn(fullWidth && 'w-full', className)}
      >
        <Send className="w-4 h-4 mr-2" />
        {finalLabel}
      </Button>
      <ConciergeHelpSheet
        open={open}
        onOpenChange={setOpen}
        topic={topic}
        initialSubject={initialSubject}
        vendorId={vendorId}
        listingId={listingId}
        sourceData={{ vendor_name: vendorName, listing_title: listingTitle }}
      />
    </>
  );
}
