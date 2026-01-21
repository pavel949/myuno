import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Building2, Headphones, ArrowRight, FileText } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerChats } from '@/hooks/usePropertyChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function OwnerMessages() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { chats, isLoading, totalUnread } = useOwnerChats();
  const [activeTab, setActiveTab] = useState<'all' | 'bookings' | 'support'>('all');

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Сообщения' : 'Messages'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите, чтобы просмотреть сообщения' : 'Sign in to view messages'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  const bookingChats = chats?.filter(c => c.type === 'booking') || [];

  const displayChats = activeTab === 'bookings' 
    ? bookingChats 
    : activeTab === 'support'
      ? []
      : chats;

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Сообщения' : 'Messages'}
        subtitle={totalUnread > 0 
          ? (isRu ? `${totalUnread} непрочитанных` : `${totalUnread} unread`)
          : undefined
        }
        showBack
        fallbackPath="/owner"
        actions={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/owner/message-templates')}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isRu ? 'Шаблоны' : 'Templates'}
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all" className="gap-1">
            <MessageCircle className="h-4 w-4" />
            {isRu ? 'Все' : 'All'}
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1">
            <User className="h-4 w-4" />
            {isRu ? 'Гости' : 'Guests'}
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-1">
            <Headphones className="h-4 w-4" />
            {isRu ? 'Поддержка' : 'Support'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'support' ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Headphones className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="font-semibold mb-2">
              {isRu ? 'Связь с менеджером UNO' : 'Contact UNO Manager'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRu 
                ? 'Напишите нам, если у вас есть вопросы по управлению недвижимостью'
                : 'Contact us if you have questions about property management'}
            </p>
            <Button onClick={() => navigate('/owner/support-chat')}>
              {isRu ? 'Открыть чат' : 'Open Chat'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : !displayChats?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {isRu ? 'Нет сообщений' : 'No messages'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Здесь будут отображаться чаты с гостями и менеджерами'
                : 'Chats with guests and managers will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayChats?.map((chat) => (
            <Card 
              key={`${chat.type}-${chat.id}`}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(
                chat.type === 'booking' 
                  ? `/owner/chat/booking/${chat.bookingId}`
                  : `/owner/chat/property/${chat.propertyId}`
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {chat.coverImage ? (
                      <AvatarImage src={chat.coverImage} />
                    ) : null}
                    <AvatarFallback className={cn(
                      chat.type === 'booking' ? 'bg-blue-500' : 'bg-primary',
                      'text-white'
                    )}>
                      {chat.type === 'booking' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Building2 className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {isRu && chat.titleRu ? chat.titleRu : chat.title}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge variant="default" className="text-xs px-1.5 py-0">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                  
                  {chat.lastMessageTime && (
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(chat.lastMessageTime), {
                        addSuffix: true,
                        locale: isRu ? ru : undefined,
                      })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
