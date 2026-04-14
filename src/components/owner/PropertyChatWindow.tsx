import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Building2, Check, CheckCheck, ShieldAlert, Bot } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePropertyChat, PropertyChatMessage } from '@/hooks/usePropertyChat';
import { useChatModeration } from '@/hooks/useChatModeration';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { ChatTransactionWarning } from '@/components/chat/ChatTransactionWarning';
import { ChatDelegationBanner } from '@/components/chat/ChatDelegationBanner';
import { ChatModerationWarning } from '@/components/chat/ChatModerationWarning';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatMessageTranslation } from '@/components/chat/ChatMessageTranslation';
import { cn } from '@/lib/utils';
import { ModerationResult } from '@/lib/chatModerationPatterns';

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

  const { 
    analyzeBeforeSend, 
    isDelegated, 
    toggleDelegation, 
    isTogglingDelegation 
  } = useChatModeration(propertyId);

  const [newMessage, setNewMessage] = useState('');
  const [preSendWarning, setPreSendWarning] = useState<ModerationResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    // Analyze message for policy violations
    const moderationResult = analyzeBeforeSend(newMessage.trim());
    if (moderationResult.isViolation && moderationResult.severity === 'critical') {
      setPreSendWarning(moderationResult);
      return; // Block critical violations
    }

    try {
      await sendMessage({
        message: newMessage.trim(),
        senderType: 'owner',
        senderName: user?.email || 'Owner',
      });
      setNewMessage('');
      setPreSendWarning(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    // Clear warning when user edits message
    if (preSendWarning) {
      setPreSendWarning(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
            <div className="w-2 h-2 rounded-full bg-info" />
            <span>{isRu ? 'Гость' : 'Guest'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <div className="w-2 h-2 rounded-full bg-accent-purple" />
            <span>{isRu ? 'Менеджер' : 'Manager'}</span>
          </div>
        </div>
      </div>

      {/* Delegation Banner - only show if owner is viewing */}
      <div className="px-3 pt-3">
        <ChatDelegationBanner
          isDelegated={isDelegated}
          onToggleDelegation={toggleDelegation}
          isLoading={isTogglingDelegation}
          variant="compact"
        />
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

      {/* Pre-send moderation warning */}
      {preSendWarning && (
        <div className="px-4">
          <ChatModerationWarning
            moderationResult={preSendWarning}
            isPreSend
            onDismiss={() => setPreSendWarning(null)}
          />
        </div>
      )}

      {/* Quick Reply Templates */}
      {!newMessage.trim() && (
        <div className="px-4 pt-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {(isRu
            ? ['Добро пожаловать!', 'Wi-Fi пароль отправлю позже', 'Заезд с 14:00', 'Нужна помощь?', 'Приятного отдыха!']
            : ['Welcome!', 'Will send WiFi password soon', 'Check-in from 2pm', 'Need any help?', 'Enjoy your stay!']
          ).map((tpl) => (
            <button
              key={tpl}
              onClick={() => setNewMessage(tpl)}
              className="flex-shrink-0 px-3 py-1 rounded-full border text-xs hover:bg-muted transition-colors"
            >
              {tpl}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder={isRu ? 'Введите сообщение...' : 'Type a message...'}
            value={newMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
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
  const isAiGenerated = (message.attachments as Record<string, unknown> | null)?.ai_generated === true;

  const getSenderLabel = (senderType: string) => {
    if (isAiGenerated) return isRu ? 'AI Ассистент' : 'AI Assistant';
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
        return 'bg-info/10';
      case 'manager':
        return 'bg-accent-purple/10';
      case 'support':
        return 'bg-success/10';
      default:
        return 'bg-muted';
    }
  };

  // Message status indicators
  const renderMessageStatus = () => {
    if (!isOwn) return null;
    
    if (message.is_read) {
      return <CheckCheck className="w-3 h-3 text-primary-foreground/70" />;
    }
    return <Check className="w-3 h-3 text-primary-foreground/50" />;
  };

  return (
    <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={cn(
            isAiGenerated ? 'bg-gradient-to-br from-accent-purple to-primary' :
            message.sender_type === 'guest' ? 'bg-info' :
            message.sender_type === 'manager' ? 'bg-accent-purple' :
            'bg-success',
            'text-white text-xs'
          )}>
            {isAiGenerated ? <Bot className="h-4 w-4" /> : (message.sender_name?.charAt(0).toUpperCase() || 'U')}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('max-w-[70%]', isOwn ? 'text-right' : 'text-left')}>
        {!isOwn && (
          <p className={cn(
            'text-xs font-medium mb-1',
            message.sender_type === 'guest' ? 'text-info' :
            message.sender_type === 'manager' ? 'text-accent-purple' :
            'text-success'
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
          <div className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}>
            <span className={cn(
              'text-[10px]',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}>
              {format(new Date(message.created_at), 'HH:mm', { locale: isRu ? ru : undefined })}
            </span>
            {renderMessageStatus()}
          </div>
        </div>
        
        {/* Translation button - only for messages from others */}
        {!isOwn && (
          <ChatMessageTranslation 
            messageId={message.id}
            originalText={message.message}
          />
        )}
      </div>
    </div>
  );
};

export default PropertyChatWindow;
