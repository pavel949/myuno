import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Inbox, User, ChevronRight, MessageSquare, 
  Mail, MessageCircle, Phone, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const CHANNEL_CONFIG = {
  whatsapp: { icon: Phone, label: 'WhatsApp', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  email: { icon: Mail, label: 'Email', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
  chat: { icon: MessageCircle, label: 'Chat', color: 'text-primary bg-primary/10' },
} as const;

/** AI-generated quick-reply suggestions */
const QUICK_REPLIES = {
  en: [
    'Check-in is at 14:00. I\'ll send you the instructions.',
    'Thank you for booking! Looking forward to hosting you.',
    'The WiFi password is in the welcome guide.',
  ],
  ru: [
    'Заезд в 14:00. Отправлю вам инструкции.',
    'Спасибо за бронирование! Буду рад видеть вас.',
    'Пароль от WiFi в приветственном гиде.',
  ],
};

export function UnifiedInboxWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { chats, isLoading, totalUnread } = useOwnerChats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="h-20 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const recentChats = (chats || []).slice(0, 4);
  const hasUnread = totalUnread > 0;

  if (recentChats.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? 'Нет сообщений от гостей' : 'No guest messages'}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/owner/messages')}>
            {isRu ? 'Открыть Inbox' : 'Open Inbox'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasUnread && "border-primary/30")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            {isRu ? 'Входящие' : 'Inbox'}
            {hasUnread && (
              <Badge className="text-[10px] px-1.5 py-0 bg-primary">
                {totalUnread}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sparkles className="h-3 w-3" />
              AI
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate('/owner/messages')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {recentChats.map(chat => {
            const channel = chat.guestPhone ? 'whatsapp' : 'chat';
            const channelCfg = CHANNEL_CONFIG[channel];
            const ChannelIcon = channelCfg.icon;

            return (
              <button
                key={`${chat.type}-${chat.id}`}
                onClick={() => navigate(
                  chat.type === 'booking'
                    ? `/owner/chat/booking/${chat.bookingId}`
                    : `/owner/chat/property/${chat.propertyId}`
                )}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "text-sm truncate",
                      chat.unreadCount > 0 ? "font-semibold" : "font-medium"
                    )}>
                      {chat.guestName || chat.title}
                    </span>
                    {chat.unreadCount > 0 && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage || (isRu ? 'Нет сообщений' : 'No messages')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn("p-1 rounded", channelCfg.color)}>
                    <ChannelIcon className="h-3 w-3" />
                  </span>
                  {chat.lastMessageTime && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(chat.lastMessageTime), {
                        addSuffix: false,
                        locale: isRu ? ru : undefined,
                      })}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick AI Replies */}
        {hasUnread && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {isRu ? 'Быстрые ответы (AI)' : 'Quick replies (AI)'}
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(isRu ? QUICK_REPLIES.ru : QUICK_REPLIES.en).slice(0, 2).map((reply, i) => (
                <button
                  key={i}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground whitespace-nowrap flex-shrink-0 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to most recent unread chat
                    const unreadChat = recentChats.find(c => c.unreadCount > 0);
                    if (unreadChat) {
                      navigate(
                        unreadChat.type === 'booking'
                          ? `/owner/chat/booking/${unreadChat.bookingId}`
                          : `/owner/chat/property/${unreadChat.propertyId}`
                      );
                    }
                  }}
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        )}

        {(chats?.length || 0) > 4 && (
          <button
            onClick={() => navigate('/owner/messages')}
            className="text-xs text-primary hover:underline w-full text-center py-2 mt-1"
          >
            {isRu ? `Все сообщения (${chats?.length})` : `All messages (${chats?.length})`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
