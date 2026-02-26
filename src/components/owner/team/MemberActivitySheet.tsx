import { useLanguage } from '@/contexts/LanguageContext';
import { useMemberActivityLog, type ActivityEntry } from '@/hooks/useTeamActivityLog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Eye,
  Plus,
  CheckCircle2,
  Pencil,
  ShieldCheck,
  Upload,
  UserCog,
  FileText,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const ACTION_ICONS: Record<string, React.ElementType> = {
  'page.view': Eye,
  'task.create': Plus,
  'task.complete': CheckCircle2,
  'property.edit': Pencil,
  'contact.view': Eye,
  'permission.change': ShieldCheck,
  'staff.edit': UserCog,
  'document.upload': Upload,
};

const ACTION_LABELS: Record<string, { en: string; ru: string }> = {
  'page.view': { en: 'Viewed page', ru: 'Просмотр страницы' },
  'task.create': { en: 'Created task', ru: 'Создал задачу' },
  'task.complete': { en: 'Completed task', ru: 'Завершил задачу' },
  'property.edit': { en: 'Edited property', ru: 'Редактировал объект' },
  'contact.view': { en: 'Viewed contact', ru: 'Просмотрел контакт' },
  'permission.change': { en: 'Changed permissions', ru: 'Изменил права' },
  'staff.edit': { en: 'Edited staff', ru: 'Редактировал сотрудника' },
  'document.upload': { en: 'Uploaded document', ru: 'Загрузил документ' },
};

function ActivityItem({ item, isRu }: { item: ActivityEntry; isRu: boolean }) {
  const Icon = ACTION_ICONS[item.action_type] || FileText;
  const label = ACTION_LABELS[item.action_type] || { en: item.action_type, ru: item.action_type };

  const timeAgo = item.created_at
    ? formatDistanceToNow(new Date(item.created_at), {
        addSuffix: true,
        locale: isRu ? ru : undefined,
      })
    : '';

  const entityLabel = item.entity_type
    ? `${item.entity_type}${item.entity_id ? ` #${item.entity_id.slice(0, 8)}` : ''}`
    : null;

  return (
    <div className="flex gap-3 py-2.5">
      <div className="mt-0.5 p-1.5 rounded-lg bg-muted/60 shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isRu ? label.ru : label.en}
        </p>
        {entityLabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{entityLabel}</p>
        )}
        {timeAgo && (
          <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
        )}
      </div>
    </div>
  );
}

interface MemberActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  memberName?: string;
}

export function MemberActivitySheet({ open, onOpenChange, userId, memberName }: MemberActivitySheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: activities, isLoading } = useMemberActivityLog(open ? userId : undefined);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {isRu ? 'Лог активности' : 'Activity Log'}
          </SheetTitle>
          <SheetDescription>
            {memberName || (isRu ? 'Сотрудник' : 'Team member')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : !activities?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Активность пока не записана' : 'No activity recorded yet'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="divide-y">
                {activities.map(item => (
                  <ActivityItem key={item.id} item={item} isRu={isRu} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
