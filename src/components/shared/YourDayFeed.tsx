/**
 * @module YourDayFeed
 * Universal "Your Day" feed — Pipedrive Pulse + Notion Today Page pattern.
 * Shared across all role dashboards: Owner, Vendor, Staff, Investor, Tourist, Resident.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDayBriefing, type DayItem, type DayItemType } from '@/hooks/useDayBriefing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Cake, LogIn, LogOut, Phone, Mail, Users,
  Eye, ClipboardCheck, Bell, FileWarning, CalendarClock,
  ChevronRight, Sparkles, Clock, MessageSquare, Handshake,
  CreditCard, Calendar, Newspaper, PartyPopper, Lightbulb,
  ExternalLink, MapPin, ShoppingBag, Star, Briefcase, TrendingUp,
  CalendarCheck,
} from 'lucide-react';
import { type AppRole } from '@/types/auth';

/* ─── Section config ─── */
interface SectionConfig {
  icon: React.ElementType;
  titleRu: string;
  titleEn: string;
  color: string;
  bg: string;
  border: string;
}

const SECTIONS: Record<string, SectionConfig> = {
  overdue: {
    icon: AlertTriangle, titleRu: 'Требует внимания', titleEn: 'Needs Attention',
    color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-l-destructive',
  },
  birthday: {
    icon: Cake, titleRu: 'Дни рождения', titleEn: 'Birthdays',
    color: 'text-accent-foreground', bg: 'bg-accent', border: 'border-l-accent',
  },
  schedule: {
    icon: Calendar, titleRu: 'Расписание дня', titleEn: "Today's Schedule",
    color: 'text-primary', bg: 'bg-primary/5', border: 'border-l-primary',
  },
  tasks: {
    icon: ClipboardCheck, titleRu: 'Задачи на сегодня', titleEn: "Today's Tasks",
    color: 'text-info', bg: 'bg-info/5', border: 'border-l-info',
  },
  reminders: {
    icon: Bell, titleRu: 'Напоминания', titleEn: 'Reminders',
    color: 'text-warning', bg: 'bg-warning/5', border: 'border-l-warning',
  },
  tomorrow: {
    icon: CalendarClock, titleRu: 'Завтра', titleEn: 'Tomorrow',
    color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-l-muted-foreground/40',
  },
  recommendations: {
    icon: Lightbulb, titleRu: 'Рекомендации myUNO', titleEn: 'myUNO Recommendations',
    color: 'text-primary', bg: 'bg-primary/5', border: 'border-l-primary',
  },
  news: {
    icon: Newspaper, titleRu: 'Новости Пхукета', titleEn: 'Phuket News',
    color: 'text-info', bg: 'bg-info/5', border: 'border-l-info',
  },
  events: {
    icon: PartyPopper, titleRu: 'События и мероприятия', titleEn: 'Events',
    color: 'text-accent-foreground', bg: 'bg-accent', border: 'border-l-accent',
  },
};

/* ─── Item icon mapping ─── */
function getItemIcon(type: DayItemType, meta?: DayItem['meta']): React.ElementType {
  switch (type) {
    case 'overdue_task': return AlertTriangle;
    case 'birthday': return Cake;
    case 'check_in': case 'check_in_tomorrow': return LogIn;
    case 'check_out': case 'check_out_tomorrow': return LogOut;
    case 'crm_activity': return Users;
    case 'crm_task': return ClipboardCheck;
    case 'personal_reminder': return getReminderIcon(meta);
    case 'document_expiry': return FileWarning;
    case 'deadline': return Clock;
    case 'recommendation': return Lightbulb;
    case 'news': return Newspaper;
    case 'event': return PartyPopper;
    case 'vendor_order': return ShoppingBag;
    case 'vendor_review': return Star;
    case 'staff_task': return Briefcase;
    case 'investment_update': return TrendingUp;
    case 'my_booking': return CalendarCheck;
    case 'myuno_service': return Sparkles;
    default: return Bell;
  }
}

function getReminderIcon(meta?: DayItem['meta']): React.ElementType {
  const type = meta?.reminderType;
  if (type === 'visa' || type === 'passport') return FileWarning;
  if (type === 'insurance') return FileWarning;
  if (type === 'rent' || type === 'payment') return CreditCard;
  return Bell;
}

/* ─── Item color by type ─── */
function getItemStyle(item: DayItem) {
  switch (item.type) {
    case 'overdue_task':
      return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive' };
    case 'birthday':
      return { color: 'text-accent-foreground', bg: 'bg-accent', border: 'border-l-accent' };
    case 'check_in': case 'check_in_tomorrow':
      return { color: 'text-success', bg: 'bg-success/10', border: 'border-l-success' };
    case 'check_out': case 'check_out_tomorrow':
      return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' };
    case 'crm_activity':
      return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' };
    case 'crm_task':
      return { color: 'text-info', bg: 'bg-info/10', border: 'border-l-info' };
    case 'personal_reminder':
      return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' };
    case 'document_expiry':
      return { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-l-destructive' };
    case 'recommendation':
      return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' };
    case 'news':
      return { color: 'text-info', bg: 'bg-info/10', border: 'border-l-info' };
    case 'event':
      return { color: 'text-accent-foreground', bg: 'bg-accent', border: 'border-l-accent' };
    case 'vendor_order':
      return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning' };
    case 'vendor_review':
      return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' };
    case 'staff_task':
      return { color: 'text-info', bg: 'bg-info/10', border: 'border-l-info' };
    case 'investment_update':
      return { color: 'text-success', bg: 'bg-success/10', border: 'border-l-success' };
    case 'my_booking':
      return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' };
    case 'myuno_service':
      return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-l-primary' };
    default:
      return { color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-l-muted-foreground' };
  }
}

/* ─── Section grouping ─── */
function getSectionKey(order: number): string {
  if (order === 0) return 'overdue';
  if (order === 1) return 'birthday';
  if (order === 2) return 'schedule';
  if (order === 3) return 'tasks';
  if (order === 4) return 'reminders';
  if (order === 5) return 'reminders';
  if (order === 6) return 'tomorrow';
  if (order === 7) return 'recommendations';
  if (order === 8) return 'news';
  if (order === 9) return 'events';
  return 'tomorrow';
}

/* ─── Props ─── */
interface YourDayFeedProps {
  /** Override automatic role detection */
  role?: AppRole;
  /** Compact mode for embedding in existing dashboards */
  compact?: boolean;
}

/* ─── Main component ─── */
export function YourDayFeed({ role, compact }: YourDayFeedProps = {}) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { data: items, isLoading } = useDayBriefing(role ? { role } : undefined);

  const sections = useMemo(() => {
    if (!items?.length) return [];
    const grouped = new Map<string, DayItem[]>();
    for (const item of items) {
      const key = getSectionKey(item.sectionOrder);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }
    const order = ['overdue', 'birthday', 'schedule', 'tasks', 'reminders', 'tomorrow', 'recommendations', 'news', 'events'];
    return order
      .filter(k => grouped.has(k))
      .map(k => ({ key: k, config: SECTIONS[k], items: grouped.get(k)! }));
  }, [items]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (!items?.length) {
    return (
      <section className="space-y-2">
        <h3 className="font-semibold text-[15px] flex items-center gap-2 px-1">
          <Sparkles className="h-4 w-4 text-primary" />
          {isRu ? 'Ваш день' : 'Your Day'}
        </h3>
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {isRu ? '✨ Отличный день — ничего срочного!' : '✨ Great day — nothing urgent!'}
          </CardContent>
        </Card>
      </section>
    );
  }

  const totalCount = items.length;
  const birthdayCount = items.filter(i => i.type === 'birthday').length;

  return (
    <section className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className={cn('font-semibold flex items-center gap-2', compact ? 'text-sm' : 'text-[15px]')}>
          <Sparkles className="h-4 w-4 text-primary" />
          {isRu ? 'Ваш день' : 'Your Day'}
          <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
          {birthdayCount > 0 && (
            <span className="text-sm">🎂 {birthdayCount}</span>
          )}
        </h3>
      </div>

      {/* Sections */}
      {sections.map(({ key, config, items: sectionItems }) => {
        const SectionIcon = config.icon;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <SectionIcon className={cn('h-3.5 w-3.5', config.color)} />
              <h4 className="text-sm font-medium text-muted-foreground">
                {isRu ? config.titleRu : config.titleEn}
              </h4>
              <Badge variant="outline" className="text-[10px]">{sectionItems.length}</Badge>
            </div>

            {key === 'birthday' ? (
              <BirthdayCards items={sectionItems} isRu={isRu} onNavigate={(href) => href && navigate(href)} />
            ) : (
              <div className="space-y-1.5">
                {sectionItems.map(item => (
                  <DayItemCard
                    key={item.id}
                    item={item}
                    isRu={isRu}
                    onClick={() => item.href && navigate(item.href)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}

/* ─── Birthday Cards (horizontal scroll) ─── */
function BirthdayCards({ items, isRu, onNavigate }: { items: DayItem[]; isRu: boolean; onNavigate: (href?: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {items.map(item => {
        const isToday = (item.meta?.daysUntil || 0) === 0;
        const initials = item.title.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <Card
            key={item.id}
            className={cn(
              'shrink-0 cursor-pointer hover:shadow-md transition-shadow min-w-[140px] max-w-[180px]',
              isToday ? 'border-accent bg-accent/30' : ''
            )}
            onClick={() => onNavigate(item.href)}
          >
            <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.meta?.avatarUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 w-full">
                <p className="text-sm font-medium truncate">{item.title}</p>
                {isToday ? (
                  <p className="text-xs text-accent-foreground font-medium">🎂 {isRu ? 'Сегодня!' : 'Today!'}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                )}
                {item.meta?.contactType && (
                  <Badge variant="outline" className="text-[9px] mt-1">
                    {item.meta.contactType === 'staff' ? (isRu ? 'Сотрудник' : 'Staff') : item.meta.contactType}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Generic Day Item Card ─── */
function DayItemCard({ item, isRu, onClick }: { item: DayItem; isRu: boolean; onClick: () => void }) {
  const Icon = getItemIcon(item.type, item.meta);
  const styles = getItemStyle(item);
  
  const typeLabel = getTypeLabel(item, isRu);
  const daysLabel = item.meta?.daysUntil != null
    ? item.meta.daysUntil <= 0
      ? (isRu ? 'просрочено' : 'overdue')
      : (isRu ? `${item.meta.daysUntil} дн.` : `${item.meta.daysUntil}d`)
    : null;

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow border-l-4',
        styles.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn('p-2 rounded-lg shrink-0', styles.bg)}>
          <Icon className={cn('h-4 w-4', styles.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {item.subtitle && (
              <span className="text-xs text-muted-foreground truncate">{item.subtitle}</span>
            )}
            {item.meta?.dueTime && (
              <Badge variant="outline" className="text-[9px] shrink-0">
                {item.meta.dueTime.slice(0, 5)}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {daysLabel && (
            <Badge
              variant={item.meta?.daysUntil != null && item.meta.daysUntil <= 0 ? 'destructive' : 'outline'}
              className="text-[10px]"
            >
              {daysLabel}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {typeLabel}
          </Badge>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  );
}

function getTypeLabel(item: DayItem, isRu: boolean): string {
  const labels: Partial<Record<DayItemType, [string, string]>> = {
    overdue_task: ['Просрочено', 'Overdue'],
    birthday: ['ДР', 'Birthday'],
    check_in: ['Заезд', 'Check-in'],
    check_out: ['Выезд', 'Check-out'],
    check_in_tomorrow: ['Заезд', 'Check-in'],
    check_out_tomorrow: ['Выезд', 'Check-out'],
    crm_activity: ['CRM', 'CRM'],
    crm_task: ['Задача', 'Task'],
    personal_reminder: ['Личное', 'Personal'],
    document_expiry: ['Документ', 'Document'],
    deadline: ['Дедлайн', 'Deadline'],
    recommendation: ['myUNO', 'myUNO'],
    news: ['Новости', 'News'],
    event: ['Событие', 'Event'],
    vendor_order: ['Заказ', 'Order'],
    vendor_review: ['Отзыв', 'Review'],
    staff_task: ['Задание', 'Task'],
    investment_update: ['Инвестиции', 'Investment'],
    my_booking: ['Бронь', 'Booking'],
    myuno_service: ['Сервис', 'Service'],
  };
  const [ru, en] = labels[item.type] || ['', ''];
  return isRu ? ru : en;
}
