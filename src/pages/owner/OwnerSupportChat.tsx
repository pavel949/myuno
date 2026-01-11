import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Headphones, Phone, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportChat, PropertyChatMessage } from '@/hooks/usePropertyChat';
import { openWhatsApp, UNO_WHATSAPP } from '@/hooks/useChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function OwnerSupportChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  const { messages, isLoading, sendMessage, isSending } = useSupportChat();
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
      await sendMessage(newMessage.trim());
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

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Headphones className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'Поддержка' : 'Support'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для связи с менеджером' : 'Sign in to contact support'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title={isRu ? 'Связь с менеджером' : 'Contact Manager'}
        subtitle={isRu ? 'Ваш персональный менеджер UNO' : 'Your personal UNO manager'}
        showBack
        fallbackPath="/owner/messages"
      />

      {/* Quick Actions */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openWhatsApp(isRu ? 'Здравствуйте! Мне нужна помощь.' : 'Hello! I need help.')}
            >
              <Phone className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`tel:${UNO_WHATSAPP}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              {isRu ? 'Позвонить' : 'Call'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat */}
      <div className="flex-1 flex flex-col bg-background rounded-lg border min-h-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Headphones className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{isRu ? 'Менеджер UNO' : 'UNO Manager'}</p>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Обычно отвечаем в течение часа' : 'Usually replies within an hour'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {isRu ? 'Онлайн' : 'Online'}
            </span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm mb-4">
                {isRu 
                  ? 'Напишите нам, если у вас есть вопросы по управлению недвижимостью'
                  : 'Contact us if you have questions about property management'}
              </p>
              <div className="space-y-2 text-sm">
                <QuickMessage 
                  text={isRu ? 'Вопрос по бронированию' : 'Question about booking'}
                  onClick={() => setNewMessage(isRu ? 'Здравствуйте! У меня вопрос по бронированию.' : 'Hello! I have a question about a booking.')}
                />
                <QuickMessage 
                  text={isRu ? 'Заказать уборку' : 'Order cleaning'}
                  onClick={() => setNewMessage(isRu ? 'Здравствуйте! Хочу заказать уборку.' : 'Hello! I want to order cleaning.')}
                />
                <QuickMessage 
                  text={isRu ? 'Проблема с объектом' : 'Property issue'}
                  onClick={() => setNewMessage(isRu ? 'Здравствуйте! Есть проблема с объектом.' : 'Hello! There is an issue with my property.')}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages?.map((msg) => (
                <SupportMessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_type === 'owner'}
                  isRu={isRu}
                />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>

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
    </PageContainer>
  );
}

const QuickMessage: React.FC<{ text: string; onClick: () => void }> = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="block w-full text-left px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
  >
    {text}
  </button>
);

interface SupportMessageBubbleProps {
  message: PropertyChatMessage;
  isOwn: boolean;
  isRu: boolean;
}

const SupportMessageBubble: React.FC<SupportMessageBubbleProps> = ({ message, isOwn, isRu }) => {
  return (
    <div className={cn('flex gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            <Headphones className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn('max-w-[70%]', isOwn ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwn 
              ? 'bg-primary text-primary-foreground rounded-br-sm' 
              : 'bg-muted rounded-bl-sm'
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
