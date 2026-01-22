import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestMessagesBlockProps {
  unreadCount?: number;
  loading?: boolean;
}

export function GuestMessagesBlock({ unreadCount = 0, loading }: GuestMessagesBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (loading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-10 w-16" />
      </Card>
    );
  }

  const hasUnread = unreadCount > 0;

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        hasUnread && "border-primary/30"
      )}
      onClick={() => navigate('/guest/chat')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <MessageCircle className={cn(
            "h-4 w-4",
            hasUnread ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Сообщения' : 'Messages'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Count or empty state */}
      {hasUnread ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-primary">{unreadCount}</span>
          <span className="text-sm text-muted-foreground">
            {isRu ? 'новых' : 'unread'}
          </span>
        </div>
      ) : (
        <div className="py-1">
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет новых сообщений' : 'No new messages'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu ? 'Чат с хостом и поддержкой' : 'Chat with host & support'}
          </p>
        </div>
      )}
    </Card>
  );
}
