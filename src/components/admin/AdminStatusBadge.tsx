/**
 * AdminStatusBadge — unified status colour palette for the admin panel.
 *
 * Replaces ad-hoc Badge usage in AdminTickets, AdminProviders,
 * AdminOperations etc., where every page had its own colour mapping
 * (some used bg-warning, some bg-amber-100, some bg-yellow-500/10…).
 *
 * Canonical palette (matches design tokens in src/styles/tokens.css):
 *   pending      → warning  (amber)
 *   in_progress  → info     (blue)
 *   approved     → success  (green)
 *   active       → success  (green)
 *   completed    → success  (green)
 *   confirmed    → primary  (navy)
 *   rejected     → destructive (red)
 *   suspended    → destructive (red)
 *   cancelled    → muted-fg (grey)
 *   inactive     → muted-fg (grey)
 *   draft        → muted-fg (grey)
 *   unknown      → muted-fg (grey)
 *
 * If a domain needs a colour we don't have, add the status key here —
 * don't fork the component.
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Tone = 'pending' | 'progress' | 'success' | 'primary' | 'destructive' | 'muted';

const TONE_CLASSES: Record<Tone, string> = {
  pending:     'bg-warning/10 text-warning border-warning/30',
  progress:    'bg-info/10 text-info border-info/30',
  success:     'bg-success/10 text-success border-success/30',
  primary:     'bg-primary/10 text-primary border-primary/30',
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  muted:       'bg-muted/40 text-muted-foreground border-border/60',
};

const STATUS_TO_TONE: Record<string, Tone> = {
  pending:           'pending',
  pending_review:    'pending',
  pending_admin:     'pending',
  awaiting_review:   'pending',
  awaiting_payment:  'pending',
  in_progress:       'progress',
  in_review:         'progress',
  reviewing:         'progress',
  approved:          'success',
  active:            'success',
  completed:         'success',
  succeeded:         'success',
  paid:              'success',
  verified:          'success',
  resolved:          'success',
  closed:            'muted',
  confirmed:         'primary',
  submitted:         'primary',
  rejected:          'destructive',
  suspended:         'destructive',
  failed:            'destructive',
  refunded:          'destructive',
  cancelled:         'muted',
  canceled:          'muted',
  inactive:          'muted',
  draft:             'muted',
  archived:          'muted',
  expired:           'muted',
  open:              'progress',
};

const STATUS_LABELS_RU: Record<string, string> = {
  pending: 'Ожидает',
  pending_review: 'Ожидает проверки',
  pending_admin: 'Требует админа',
  awaiting_review: 'На проверке',
  awaiting_payment: 'Ожидает оплаты',
  in_progress: 'В работе',
  in_review: 'На проверке',
  reviewing: 'Рассматривается',
  approved: 'Одобрено',
  active: 'Активно',
  completed: 'Завершено',
  succeeded: 'Успешно',
  paid: 'Оплачено',
  verified: 'Верифицировано',
  resolved: 'Решено',
  closed: 'Закрыто',
  confirmed: 'Подтверждено',
  submitted: 'Подано',
  rejected: 'Отклонено',
  suspended: 'Приостановлено',
  failed: 'Ошибка',
  refunded: 'Возврат',
  cancelled: 'Отменено',
  canceled: 'Отменено',
  inactive: 'Неактивно',
  draft: 'Черновик',
  archived: 'В архиве',
  expired: 'Истекло',
  open: 'Открыто',
};

interface Props {
  status: string;
  /** Force a specific tone instead of looking up from STATUS_TO_TONE. */
  tone?: Tone;
  /** Render the Russian label instead of raw status string. */
  isRu?: boolean;
  /** Custom display label (overrides ru/en lookup). */
  label?: string;
  className?: string;
}

export function AdminStatusBadge({ status, tone, isRu, label, className }: Props) {
  const resolvedTone: Tone = tone ?? STATUS_TO_TONE[status?.toLowerCase()] ?? 'muted';
  const display =
    label ?? (isRu ? STATUS_LABELS_RU[status?.toLowerCase()] ?? status : status);
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap font-medium', TONE_CLASSES[resolvedTone], className)}
    >
      {display}
    </Badge>
  );
}
