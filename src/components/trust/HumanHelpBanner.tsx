/**
 * HumanHelpBanner — P2.5 Human Fallback & Assistance
 * 
 * At moments of uncertainty, offers human help explicitly.
 * Not hidden behind menus. Framed as normal, not exceptional.
 * 
 * Variants:
 * - inline: subtle, within content flow
 * - floating: fixed bottom banner for complex pages
 * - card: standalone card for decision-heavy sections
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { MessageCircle, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

interface HumanHelpBannerProps {
  /** Display variant */
  variant?: 'inline' | 'floating' | 'card';
  /** Custom message context for WhatsApp */
  context?: string;
  /** Custom heading */
  heading?: string;
  /** Custom subtext */
  subtext?: string;
  className?: string;
}

export function HumanHelpBanner({
  variant = 'inline',
  context,
  heading,
  subtext,
  className,
}: HumanHelpBannerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const defaultHeading = isRu ? 'Не уверены?' : 'Not sure?';
  const defaultSubtext = isRu
    ? 'Мы поможем выбрать — напишите, и живой человек ответит'
    : 'We can help — message us and a real person will reply';

  const waMessage = context
    || (isRu ? 'Здравствуйте, помогите выбрать' : 'Hi, I need help choosing');
  const whatsappUrl = `https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(waMessage)}`;

  // ── Inline variant ──
  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-3 py-2.5 px-3 rounded-none',
        'bg-success/5 border border-success/10',
        className
      )}>
        <MessageCircle className="w-4 h-4 text-success shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          {heading || defaultHeading}{' '}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-success font-medium hover:underline"
          >
            {isRu ? 'Напишите нам' : 'Message us'}
          </a>
        </p>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          ~15 {isRu ? 'мин' : 'min'}
        </div>
      </div>
    );
  }

  // ── Card variant ──
  if (variant === 'card') {
    return (
      <div className={cn(
        'rounded-none border bg-card p-4 space-y-3',
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-none flex items-center justify-center shrink-0 bg-success/10">
            <MessageCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">{heading || defaultHeading}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {subtext || defaultSubtext}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </Button>
          {COMPANY_CONTACTS.phone && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `tel:${COMPANY_CONTACTS.phone}`}
            >
              <Phone className="w-3.5 h-3.5" />
              {isRu ? 'Позвонить' : 'Call'}
            </Button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {isRu ? 'Обычно отвечаем за 15 минут' : 'Usually reply within 15 minutes'}
        </p>
      </div>
    );
  }

  // ── Floating variant ──
  return (
    <div className={cn(
      'fixed bottom-[calc(var(--bottom-nav-h)+1rem)] left-4 right-4 z-40',
      'rounded-none border shadow-lg bg-card/95 p-3',
      'flex items-center gap-3',
      className
    )}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-success/15">
        <MessageCircle className="w-4 h-4 text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{heading || defaultHeading}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          {subtext || defaultSubtext}
        </p>
      </div>
      <Button
        size="sm"
        className="shrink-0 bg-success hover:bg-success/90 text-success-foreground"
        onClick={() => window.open(whatsappUrl, '_blank')}
      >
        <MessageCircle className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
