import React from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Handshake, Shield, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ITEMS = [
  {
    icon: Headphones,
    titleRu: 'Срочная поддержка',
    titleEn: 'Urgent support',
    shortRu: 'Линия myUNO для срочных вопросов по бронированию и заезду.',
    shortEn: 'myUNO line for urgent booking and check-in questions.',
    detailRu:
      'Если что-то пошло не так с доступом, временем заезда или связью с менеджером — напишите в поддержку myUNO. Мы помогаем связаться с хозяином и согласовать следующий шаг.',
    detailEn:
      'If something goes wrong with access, check-in timing, or reaching the manager — contact myUNO support. We help you reach the host and agree on the next step.',
  },
  {
    icon: Handshake,
    titleRu: 'Координация с УК и хозяином',
    titleEn: 'Coordination with MC & host',
    shortRu: 'Помогаем выстроить диалог между гостём, хозяином и управляющей компанией.',
    shortEn: 'We help coordinate communication between guest, host, and building management.',
    detailRu:
      'ЖК и управляющие компании задают правила комплекса — это нормально. Мы не вмешиваемся в договор с УК, но можем подсказать, как согласовать вопросы через хозяина и офис комплекса без конфликта.',
    detailEn:
      'Projects and management companies set estate rules — that is normal. We do not replace your contract with the MC, but we can suggest how to resolve questions through the host and the juristic office constructively.',
  },
  {
    icon: Shield,
    titleRu: 'Споры и разногласия',
    titleEn: 'Disputes',
    shortRu: 'Подключаем поддержку, чтобы найти решение справедливо и спокойно.',
    shortEn: 'We involve support to find a fair, calm resolution.',
    detailRu:
      'При разногласиях по состоянию жилья, депозиту или условиям мы фиксируем обращение и помогаем сторонам договориться. Цель — решение в рамках правил объявления и добросовестной практики, а не «победа» одной стороны.',
    detailEn:
      'If you disagree about the unit condition, deposit, or terms, we log the case and help both sides work it out. The goal is a solution within the listing rules and good-faith practice — not taking sides against the host or the building.',
  },
] as const;

interface GuestAssuranceCardProps {
  /** Shorter copy for mobile / article column */
  compact?: boolean;
  className?: string;
}

export function GuestAssuranceCard({ compact, className }: GuestAssuranceCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (compact) {
    return (
      <div
        className={cn(
          'rounded-none border border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground leading-snug',
          className
        )}
      >
        <p>
          {isRu
            ? 'myUNO на связи по срочным вопросам и помогает согласовать общение с хозяином и комплексом.'
            : 'myUNO is here for urgent issues and helps coordinate with the host and the estate.'}
        </p>
        <Link to={APP_ROUTES.SUPPORT} className="mt-1.5 inline-flex font-medium text-primary hover:underline">
          {isRu ? 'Поддержка' : 'Support'}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-none border border-border/60 bg-muted/15 px-3 py-3 space-y-2.5',
        className
      )}
    >
      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
        {isRu ? 'Надёжность myUNO' : 'myUNO guest care'}
      </p>
      <ul className="space-y-2">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const title = isRu ? item.titleRu : item.titleEn;
          const short = isRu ? item.shortRu : item.shortEn;
          const detail = isRu ? item.detailRu : item.detailEn;
          return (
            <li key={item.titleEn} className="flex gap-2 items-start">
              <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-medium text-foreground leading-snug">{title}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                        aria-label={isRu ? 'Подробнее' : 'More info'}
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(100vw-2rem,320px)] text-sm" align="start">
                      <p className="text-muted-foreground leading-relaxed">{detail}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{short}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Link
        to={APP_ROUTES.SUPPORT}
        className="inline-flex text-xs font-medium text-primary hover:underline pt-0.5"
      >
        {isRu ? 'Связаться с поддержкой' : 'Contact myUNO support'}
      </Link>
    </div>
  );
}
