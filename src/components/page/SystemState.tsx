/**
 * SystemState — Design Bible Round 4A · S1 "System states".
 *
 * Every list, page and form uses one of these eight states:
 *  - empty        first use; always offers the next action
 *  - no_results   filters matched nothing; suggest the cheapest relaxation
 *  - loading      skeleton rows, never a whole-page spinner
 *  - error        recoverable; says what happened and what to do
 *  - payment_error nothing charged; offers another method
 *  - success      confirms and says what happens next
 *  - not_found    404; offers similar content
 *  - offline      staff app; work is saved and will sync
 *
 * Copy defaults follow 03-tone-of-voice (plain words, concrete next step).
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CloudOff, CreditCard, FileQuestion, Inbox, SearchX, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export type SystemStateVariant =
  | 'empty' | 'no_results' | 'loading' | 'error' | 'payment_error' | 'success' | 'not_found' | 'offline';

type Tone = 'neutral' | 'warning' | 'danger' | 'success' | 'info' | 'brand';

interface VariantSpec {
  icon: LucideIcon;
  tone: Tone;
  role: 'status' | 'alert';
  primary: boolean;
  en: { title: string; description: string; action?: string };
  ru: { title: string; description: string; action?: string };
}

// eslint-disable-next-line react-refresh/only-export-components -- copy table is part of the S1 contract (tests, docs)
export const SYSTEM_STATE_SPECS: Record<Exclude<SystemStateVariant, 'loading'>, VariantSpec> = {
  empty: {
    icon: Inbox, tone: 'neutral', role: 'status', primary: true,
    en: { title: 'Nothing here yet', description: 'When you add something, it will appear here.' },
    ru: { title: 'Здесь пока пусто', description: 'Когда вы что-то добавите, оно появится здесь.' },
  },
  no_results: {
    icon: SearchX, tone: 'neutral', role: 'status', primary: false,
    en: { title: 'Nothing matches all filters', description: 'Remove a filter or widen the dates to see more.', action: 'Remove a filter' },
    ru: { title: 'Ничего не подходит под все фильтры', description: 'Уберите фильтр или расширьте даты, чтобы увидеть больше.', action: 'Убрать фильтр' },
  },
  error: {
    icon: AlertTriangle, tone: 'warning', role: 'alert', primary: true,
    en: { title: 'We couldn’t load this', description: 'The connection dropped. Your input is saved; try again.', action: 'Try again' },
    ru: { title: 'Не удалось загрузить', description: 'Соединение прервалось. Введённые данные сохранены — попробуйте ещё раз.', action: 'Повторить' },
  },
  payment_error: {
    icon: CreditCard, tone: 'danger', role: 'alert', primary: true,
    en: { title: 'Your card was declined', description: 'Nothing was charged. Use another card or pay by bank transfer.', action: 'Use another method' },
    ru: { title: 'Карта отклонена', description: 'Деньги не списаны. Используйте другую карту или банковский перевод.', action: 'Другой способ оплаты' },
  },
  success: {
    icon: CheckCircle2, tone: 'success', role: 'status', primary: false,
    en: { title: 'Request sent', description: 'We’ll message you when it is confirmed.' },
    ru: { title: 'Запрос отправлен', description: 'Мы напишем вам, когда он будет подтверждён.' },
  },
  not_found: {
    icon: FileQuestion, tone: 'brand', role: 'status', primary: true,
    en: { title: 'This page has moved', description: 'It may no longer be available. Start again from the main page.', action: 'Go to main page' },
    ru: { title: 'Страница переехала', description: 'Возможно, она больше недоступна. Начните с главной страницы.', action: 'На главную' },
  },
  offline: {
    icon: CloudOff, tone: 'info', role: 'status', primary: false,
    en: { title: 'You’re offline', description: 'Your changes are saved on this device and will sync when you’re back online.' },
    ru: { title: 'Нет соединения', description: 'Изменения сохранены на устройстве и синхронизируются, когда связь вернётся.' },
  },
};

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
  success: 'bg-success/15 text-success',
  info: 'bg-info/15 text-info',
  brand: 'bg-primary text-primary-foreground',
};

export interface SystemStateProps {
  variant: SystemStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Extra content under the action (e.g. "3 items waiting to sync"). */
  children?: ReactNode;
  /** Skeleton rows for the loading variant. */
  rows?: number;
  compact?: boolean;
  className?: string;
}

export function SystemState({
  variant, title, description, icon, actionLabel, actionHref, onAction, children, rows = 4, compact = false, className,
}: SystemStateProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (variant === 'loading') {
    return (
      <div role="status" aria-busy="true" aria-label={isRu ? 'Загрузка' : 'Loading'} className={cn('space-y-2', className)}>
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const spec = SYSTEM_STATE_SPECS[variant];
  const copy = isRu ? spec.ru : spec.en;
  const Icon = icon ?? spec.icon;
  const label = actionLabel ?? copy.action;
  const resolvedHref = actionHref ?? (variant === 'not_found' && !onAction ? '/' : undefined);
  const btnVariant = spec.primary ? 'default' : 'outline';

  return (
    <div
      role={spec.role}
      className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8' : 'py-16', className)}
    >
      <div className={cn('mb-5 flex items-center justify-center', compact ? 'h-14 w-14' : 'h-20 w-20', TONE_CLASS[spec.tone])}>
        <Icon className={compact ? 'h-7 w-7' : 'h-9 w-9'} aria-hidden="true" />
      </div>
      <h3 className={cn('mb-2 font-semibold text-foreground', compact ? 'text-base' : 'text-xl')}>{title ?? copy.title}</h3>
      <p className="mb-6 max-w-[var(--measure-state)] text-sm text-muted-foreground">{description ?? copy.description}</p>
      {label && resolvedHref && (
        <Button asChild variant={btnVariant} className="min-h-11"><Link to={resolvedHref}>{label}</Link></Button>
      )}
      {label && !resolvedHref && onAction && (
        <Button variant={btnVariant} className="min-h-11" onClick={onAction}>{label}</Button>
      )}
      {children}
    </div>
  );
}
