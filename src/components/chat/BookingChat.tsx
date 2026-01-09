import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, MoreVertical } from 'lucide-react';
import { format, Locale } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat, ChatMessage, openWhatsApp } from '@/hooks/useChat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/uno/SectionCard';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

interface BookingChatProps {
  bookingId: string;
  providerName?: string;
  providerPhone?: string;
}

export const BookingChat: React.FC<BookingChatProps> = ({
  bookingId,
  providerName,
  providerPhone
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChat(bookingId);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
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
    
    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      {providerName && (
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div>
            <p className="font-medium">{providerName}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Чат по бронированию' : 'Booking chat'}
            </p>
          </div>
          {providerPhone && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`tel:${providerPhone}`)}
            >
              <Phone className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {isRu 
                ? 'Начните диалог с провайдером услуги' 
                : 'Start a conversation with the service provider'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
              locale={isRu ? ru : enUS}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
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
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  locale: Locale;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, locale }) => {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isOwn 
            ? 'bg-primary text-primary-foreground rounded-br-sm' 
            : 'bg-secondary rounded-bl-sm'
        )}
      >
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

export default BookingChat;
