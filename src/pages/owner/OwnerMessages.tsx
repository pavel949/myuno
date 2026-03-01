import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, Building2, Headphones, ArrowRight, FileText, Search, Calendar, Phone } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerChats, OwnerChatItem } from '@/hooks/usePropertyChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function OwnerMessages() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { chats, isLoading, totalUnread } = useOwnerChats();
  const [activeTab, setActiveTab] = useState<'all' | 'guests' | 'support'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter chats based on tab and search
  const filteredChats = useMemo(() => {
    if (!chats) return [];
    
    let filtered = chats;
    
    // Filter by tab
    if (activeTab === 'guests') {
      filtered = filtered.filter(c => c.type === 'booking');
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.guestName?.toLowerCase().includes(query) ||
        c.propertyTitle?.toLowerCase().includes(query) ||
        c.lastMessage?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [chats, activeTab, searchQuery]);

  // Count guests with active chats
  const guestChatsCount = chats?.filter(c => c.type === 'booking').length || 0;

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
            onClick={() => navigate('/mc/message-templates')}
          >
            <FileText className="h-4 w-4 mr-2" />
            {isRu ? 'Шаблоны' : 'Templates'}
          </Button>
        }
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск по имени гостя или объекту...' : 'Search by guest name or property...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="all" className="gap-1">
            <MessageCircle className="h-4 w-4" />
            {isRu ? 'Все' : 'All'}
            {chats && chats.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{chats.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="guests" className="gap-1">
            <User className="h-4 w-4" />
            {isRu ? 'Гости' : 'Guests'}
            {guestChatsCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{guestChatsCount}</Badge>
            )}
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
            <Button onClick={() => navigate('/mc/support-chat')}>
              {isRu ? 'Открыть чат' : 'Open Chat'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : !filteredChats.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">
              {searchQuery 
                ? (isRu ? 'Ничего не найдено' : 'No results found')
                : (isRu ? 'Нет сообщений' : 'No messages')
              }
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? (isRu ? 'Попробуйте изменить запрос' : 'Try changing your search query')
                : (isRu 
                    ? 'Здесь будут отображаться чаты с гостями'
                    : 'Chats with guests will appear here')
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat) => (
            <ChatCard 
              key={`${chat.type}-${chat.id}`}
              chat={chat}
              isRu={isRu}
              onClick={() => navigate(
                chat.type === 'booking' 
                  ? `/mc/chat/booking/${chat.bookingId}`
                  : `/mc/chat/property/${chat.propertyId}`
              )}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

interface ChatCardProps {
  chat: OwnerChatItem;
  isRu: boolean;
  onClick: () => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ chat, isRu, onClick }) => {
  const formatBookingDates = () => {
    if (!chat.checkIn || !chat.checkOut) return null;
    try {
      const checkIn = new Date(chat.checkIn);
      const checkOut = new Date(chat.checkOut);
      return `${format(checkIn, 'dd.MM')} - ${format(checkOut, 'dd.MM')}`;
    } catch {
      return null;
    }
  };

  const getStatusBadge = () => {
    if (!chat.bookingStatus) return null;
    const statusMap: Record<string, { label: string; labelRu: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      confirmed: { label: 'Confirmed', labelRu: 'Подтверждено', variant: 'default' },
      pending: { label: 'Pending', labelRu: 'Ожидает', variant: 'secondary' },
      cancelled: { label: 'Cancelled', labelRu: 'Отменено', variant: 'destructive' },
      completed: { label: 'Completed', labelRu: 'Завершено', variant: 'outline' },
    };
    const status = statusMap[chat.bookingStatus];
    if (!status) return null;
    return (
      <Badge variant={status.variant} className="text-xs">
        {isRu ? status.labelRu : status.label}
      </Badge>
    );
  };

  const bookingDates = formatBookingDates();

  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            {chat.coverImage ? (
              <AvatarImage src={chat.coverImage} />
            ) : null}
            <AvatarFallback className={cn(
              chat.type === 'booking' ? 'bg-primary/80' : 'bg-primary',
              'text-primary-foreground'
            )}>
              {chat.type === 'booking' ? (
                <User className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Guest name / title */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">
                {chat.guestName || (isRu && chat.titleRu ? chat.titleRu : chat.title)}
              </p>
              {chat.unreadCount > 0 && (
                <Badge variant="default" className="text-xs px-1.5 py-0">
                  {chat.unreadCount}
                </Badge>
              )}
              {getStatusBadge()}
            </div>
            
            {/* Property name for booking chats */}
            {chat.type === 'booking' && chat.propertyTitle && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3" />
                {isRu && chat.propertyTitleRu ? chat.propertyTitleRu : chat.propertyTitle}
              </p>
            )}

            {/* Booking dates */}
            {bookingDates && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {bookingDates}
              </p>
            )}

            {/* Last message */}
            <p className="text-sm text-muted-foreground truncate mt-1">
              {chat.lastMessage || (isRu ? 'Нет сообщений' : 'No messages yet')}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {chat.lastMessageTime && (
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(chat.lastMessageTime), {
                  addSuffix: true,
                  locale: isRu ? ru : undefined,
                })}
              </p>
            )}
            {/* Quick call button for guests with phone */}
            {chat.guestPhone && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${chat.guestPhone}`);
                }}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
