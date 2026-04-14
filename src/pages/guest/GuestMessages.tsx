import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronRight, Inbox, LogIn } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestChatList } from '@/hooks/useGuestPropertyChat';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';

export default function GuestMessages() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, isLoading, totalUnread } = useGuestChatList();
  const isRu = language === 'ru';

  // Not authenticated
  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {isRu ? 'Войдите, чтобы видеть сообщения' : 'Log in to see messages'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRu 
                ? 'Авторизуйтесь, чтобы общаться с владельцами недвижимости' 
                : 'Log in to chat with property owners'}
            </p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {isRu ? 'Войти' : 'Log in'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <BackButton fallbackPath="/" variant="default" size="md" />
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {isRu ? 'Сообщения' : 'Messages'}
              </h1>
              {totalUnread > 0 && (
                <p className="text-xs text-muted-foreground">
                  {totalUnread} {isRu ? 'непрочитанных' : 'unread'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
              <LoadingSpinner size="lg" />
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState isRu={isRu} onExplore={() => navigate('/property')} />
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  isRu={isRu}
                  onClick={() => navigate(`${APP_ROUTES.PROPERTY_DETAIL(conv.propertyId)}?openChat=true`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface EmptyStateProps {
  isRu: boolean;
  onExplore: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isRu, onExplore }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
      <Inbox className="w-10 h-10 text-muted-foreground" />
    </div>
    <div>
      <h2 className="text-lg font-semibold">
        {isRu ? 'Нет сообщений' : 'No messages yet'}
      </h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        {isRu 
          ? 'Когда вы напишете владельцу недвижимости, ваши чаты появятся здесь' 
          : 'When you message a property host, your chats will appear here'}
      </p>
    </div>
    <Button variant="outline" onClick={onExplore}>
      {isRu ? 'Искать жильё' : 'Explore properties'}
    </Button>
  </div>
);

interface ConversationCardProps {
  conversation: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyTitleRu?: string;
    propertyImage?: string;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount: number;
  };
  isRu: boolean;
  onClick: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({ 
  conversation, 
  isRu, 
  onClick 
}) => {
  const locale = isRu ? ru : enUS;
  const title = isRu ? conversation.propertyTitleRu || conversation.propertyTitle : conversation.propertyTitle;
  
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(date, 'HH:mm', { locale });
    } else if (diffDays < 7) {
      return format(date, 'EEE', { locale });
    } else {
      return format(date, 'dd MMM', { locale });
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
        "hover:bg-muted/50 active:bg-muted",
        conversation.unreadCount > 0 && "bg-primary/5"
      )}
    >
      {/* Property Image */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {conversation.propertyImage ? (
          <img 
            src={conversation.propertyImage} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cn(
            "font-medium text-sm truncate",
            conversation.unreadCount > 0 && "font-semibold"
          )}>
            {title}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            "text-sm truncate",
            conversation.unreadCount > 0 
              ? "text-foreground font-medium" 
              : "text-muted-foreground"
          )}>
            {conversation.lastMessage || (isRu ? 'Начните диалог' : 'Start a conversation')}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};
