import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Building2, Headphones } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyChat, PropertyChatMessage } from '@/hooks/usePropertyChat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { ChatTransactionWarning } from '@/components/chat/ChatTransactionWarning';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { cn } from '@/lib/utils';

interface PropertyChatWindowProps {
  propertyId?: string;
  bookingId?: string;
  guestName?: string;
  propertyTitle?: string;
  className?: string;
}

export const PropertyChatWindow: React.FC<PropertyChatWindowProps> = ({
  propertyId,
  bookingId,
  guestName,
  propertyTitle,
  className,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const { messages, isLoading, sendMessage, isSending } = usePropertyChat({
    propertyId,
    bookingId,
  });

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      await sendMessage({
        message: newMessage.trim(),
        senderType: 'owner',
        senderName: user?.email || 'Owner',
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'owner':
        return <Building2 className="h-4 w-4" />;
      case 'guest':
        return <User className="h-4 w-4" />;
      case 'manager':
      case 'support':
        return <Headphones className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'owner':
        return 'bg-primary text-primary-foreground';
      case 'guest':
        return 'bg-blue-500 text-white';
      case 'manager':
        return 'bg-purple-500 text-white';
      case 'support':
        return 'bg-green-500 text-white';
      default:
        return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10">
            {bookingId ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">
            {bookingId ? guestName || (isRu ? 'Гость' : 'Guest') : propertyTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {bookingId 
              ? (isRu ? 'Чат по бронированию' : 'Booking chat')
              : (isRu ? 'Общий чат по объекту' : 'Property chat')
            }
          </p>
        </div>
        <div className="flex gap-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{isRu ? 'Гость' : 'Guest'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>{isRu ? 'Менеджер' : 'Manager'}</span>
          </div>
        </div>
      </div>

      {/* Transaction Warning */}
      <ChatTransactionWarning variant="compact" />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {isRu 
                ? 'Начните диалог. Здесь вы можете общаться с гостем и менеджером UNO.'
                : 'Start a conversation. Chat with your guest and UNO manager here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.sender_id === user?.id}
                isRu={isRu}
              />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Quick Replies */}
      <div className="px-4 py-2 border-t bg-muted/30">
        <QuickReplies 
          onSelect={(message) => setNewMessage(message)} 
          disabled={isSending}
        />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={isRu ? 'Введите сообщение...' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: PropertyChatMessage;
  isOwn: boolean;
  isRu: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, isRu }) => {
  const getSenderLabel = (senderType: string) => {
    switch (senderType) {
      case 'owner':
        return isRu ? 'Вы' : 'You';
      case 'guest':
        return message.sender_name || (isRu ? 'Гость' : 'Guest');
      case 'manager':
        return isRu ? 'Менеджер UNO' : 'UNO Manager';
      case 'support':
        return isRu ? 'Поддержка' : 'Support';
      default:
        return message.sender_name || 'Unknown';
    }
  };

  const getBubbleColor = (senderType: string) => {
    if (isOwn) return 'bg-primary text-primary-foreground';
    switch (senderType) {
      case 'guest':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'manager':
        return 'bg-purple-100 dark:bg-purple-900/30';
      case 'support':
        return 'bg-green-100 dark:bg-green-900/30';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={cn(
            message.sender_type === 'guest' ? 'bg-blue-500' :
            message.sender_type === 'manager' ? 'bg-purple-500' :
            'bg-green-500',
            'text-white text-xs'
          )}>
            {message.sender_name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('max-w-[70%]', isOwn ? 'text-right' : 'text-left')}>
        {!isOwn && (
          <p className={cn(
            'text-xs font-medium mb-1',
            message.sender_type === 'guest' ? 'text-blue-600 dark:text-blue-400' :
            message.sender_type === 'manager' ? 'text-purple-600 dark:text-purple-400' :
            'text-green-600 dark:text-green-400'
          )}>
            {getSenderLabel(message.sender_type)}
          </p>
        )}
        
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            getBubbleColor(message.sender_type),
            isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-1">
          {format(new Date(message.created_at), 'HH:mm', { locale: isRu ? ru : undefined })}
        </p>
      </div>
    </div>
  );
};

export default PropertyChatWindow;
