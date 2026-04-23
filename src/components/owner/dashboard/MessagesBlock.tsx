import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function MessagesBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { chats, isLoading, totalUnread } = useOwnerChats();

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </Card>
    );
  }

  const recentChats = chats?.slice(0, 3) || [];

  if (recentChats.length === 0) {
    return (
      <Card 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/mc/messages')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-none bg-muted">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Сообщения' : 'Messages'}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isRu ? 'Нет сообщений' : language === 'th' ? 'ไม่มีข้อความ' : 'No messages'}
        </p>
      </Card>
    );
  }

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/mc/messages')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-none",
            totalUnread > 0 ? "bg-primary/10" : "bg-muted"
          )}>
            <MessageCircle className={cn(
              "h-4 w-4",
              totalUnread > 0 ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Сообщения' : 'Messages'}
          </span>
          {totalUnread > 0 && (
            <span className="text-xs font-semibold text-primary">
              {totalUnread} {isRu ? 'новых' : 'unread'}
            </span>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Recent chats preview */}
      <div className="space-y-2">
        {recentChats.map((chat) => (
          <div 
            key={chat.id}
            className={cn(
              "p-2 rounded-none border",
              chat.unreadCount > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {chat.type === 'booking' ? chat.guestName || chat.title : (isRu ? chat.titleRu : chat.title) || chat.title}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                )}
              </div>
              {chat.lastMessageTime && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(chat.lastMessageTime), {
                    addSuffix: false,
                    locale: isRu ? ru : undefined,
                  })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
