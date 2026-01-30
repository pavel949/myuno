import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, LogIn } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestPropertyChat, GuestChatMessage } from '@/hooks/useGuestPropertyChat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { ChatTransactionWarning } from '@/components/chat/ChatTransactionWarning';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface GuestPropertyChatProps {
  propertyId: string;
  bookingId?: string;
  propertyTitle?: string;
  ownerName?: string;
  compact?: boolean;
  onClose?: () => void;
}

export const GuestPropertyChat: React.FC<GuestPropertyChatProps> = ({
  propertyId,
  bookingId,
  propertyTitle,
  ownerName,
  compact = false,
  onClose,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, isSending } = useGuestPropertyChat({ 
    propertyId, 
    bookingId 
  });
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRu = language === 'ru';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    try {
      await sendMessage({ message: newMessage.trim() });
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

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-muted/30 rounded-xl">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg">
            {isRu ? 'Войдите, чтобы написать' : 'Log in to message'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu 
              ? 'Для общения с хозяином необходимо авторизоваться' 
              : 'You need to be logged in to message the host'}
          </p>
        </div>
        <Button onClick={() => navigate('/auth')} className="gap-2">
          <LogIn className="w-4 h-4" />
          {isRu ? 'Войти' : 'Log in'}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-background rounded-xl border border-border",
      compact ? "h-[400px]" : "h-[500px]"
    )}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm line-clamp-1">
              {ownerName || (isRu ? 'Хозяин' : 'Host')}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {propertyTitle || (isRu ? 'Чат по объекту' : 'Property chat')}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Transaction Warning */}
      <ChatTransactionWarning variant="compact" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">
              {isRu 
                ? 'Задайте вопрос или обсудите детали бронирования' 
                : 'Ask a question or discuss booking details'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRu 
                ? 'Обычно отвечают в течение часа' 
                : 'Usually responds within an hour'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
              locale={isRu ? ru : enUS}
              isRu={isRu}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/20 rounded-b-xl">
        <div className="flex gap-2">
          <Textarea
            placeholder={isRu ? 'Напишите сообщение...' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            className="flex-1 min-h-[40px] max-h-[100px] resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="flex-shrink-0 self-end"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: GuestChatMessage;
  isOwn: boolean;
  locale: Locale;
  isRu: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, locale, isRu }) => {
  const getSenderLabel = () => {
    if (isOwn) return isRu ? 'Вы' : 'You';
    switch (message.sender_type) {
      case 'owner': return isRu ? 'Хозяин' : 'Host';
      case 'manager': return isRu ? 'Менеджер' : 'Manager';
      case 'support': return 'myUNO';
      default: return message.sender_name || (isRu ? 'Гость' : 'Guest');
    }
  };

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2',
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-secondary rounded-bl-sm'
        )}
      >
        {!isOwn && (
          <p className={cn(
            'text-[10px] font-medium mb-0.5',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {getSenderLabel()}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
        <p className={cn(
          'text-[10px] mt-1',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {format(new Date(message.created_at), 'HH:mm', { locale })}
        </p>
      </div>
    </div>
  );
};

export default GuestPropertyChat;
