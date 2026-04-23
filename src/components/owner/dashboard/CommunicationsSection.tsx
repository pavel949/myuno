import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, ChevronRight, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function CommunicationsSection() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { chats, isLoading, totalUnread } = useOwnerChats();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-none" />
          <Skeleton className="h-16 rounded-none" />
        </div>
      </div>
    );
  }

  const recentChats = chats?.slice(0, 3) || [];

  if (recentChats.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">
            {isRu ? 'Сообщения' : isTh ? 'ข้อความ' : 'Messages'}
          </h2>
        </div>
        
        <Card className="p-4 text-center">
          <div className="p-3 rounded-full bg-muted w-fit mx-auto mb-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Нет сообщений' : isTh ? 'ยังไม่มีข้อความ' : 'No messages yet'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div data-tour="team" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base">
            {isRu ? 'Сообщения' : isTh ? 'ข้อความ' : 'Messages'}
          </h2>
          {totalUnread > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
              {totalUnread}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/mc/messages')}>
          {isRu ? 'Все' : isTh ? 'ทั้งหมด' : 'View all'}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* Chat list */}
      <div className="space-y-2">
        {recentChats.map((chat) => (
          <Card 
            key={chat.id}
            className={cn(
              "p-3 cursor-pointer hover:shadow-md transition-all",
              chat.unreadCount > 0 && "border-primary/30 bg-primary/5"
            )}
            onClick={() => navigate(`/mc/messages/${chat.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {chat.guestName || (isRu ? chat.titleRu : chat.title) || chat.title}
                  </span>
                  {chat.lastMessageTime && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(chat.lastMessageTime), {
                        addSuffix: false,
                        locale: isRu ? ru : undefined,
                      })}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                )}
              </div>

              {chat.unreadCount > 0 && (
                <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
