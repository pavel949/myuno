import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, BarChart3, CalendarPlus, Receipt, Building2, 
  Brush, TrendingUp, Sparkles, X 
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerAIChat, AIMessage } from '@/hooks/useOwnerAIChat';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OwnerContext {
  propertiesCount?: number;
  activeBookings?: number;
  pendingTasks?: number;
}

interface OwnerAIAssistantProps {
  context?: OwnerContext;
  className?: string;
}

const QUICK_TOPICS = {
  ru: [
    { icon: BarChart3, label: 'Статистика', prompt: 'Как посмотреть статистику моего объекта?' },
    { icon: CalendarPlus, label: 'Добавить бронь', prompt: 'Как добавить бронирование вручную?' },
    { icon: Receipt, label: 'Налоги', prompt: 'Какие налоги я должен платить с аренды в Таиланде?' },
    { icon: Building2, label: 'Полное управление', prompt: 'Расскажи подробнее о полном управлении от UNO' },
    { icon: Brush, label: 'Заказать уборку', prompt: 'Как заказать уборку через UNO?' },
    { icon: TrendingUp, label: 'Цены на рынке', prompt: 'Какие сейчас цены на аренду на Пхукете?' },
  ],
  en: [
    { icon: BarChart3, label: 'Statistics', prompt: 'How do I view my property statistics?' },
    { icon: CalendarPlus, label: 'Add Booking', prompt: 'How do I add a booking manually?' },
    { icon: Receipt, label: 'Taxes', prompt: 'What taxes do I need to pay on rental income in Thailand?' },
    { icon: Building2, label: 'Full Management', prompt: 'Tell me more about UNO full management' },
    { icon: Brush, label: 'Order Cleaning', prompt: 'How do I order cleaning through UNO?' },
    { icon: TrendingUp, label: 'Market Prices', prompt: 'What are current rental prices in Phuket?' },
  ],
};

export const OwnerAIAssistant: React.FC<OwnerAIAssistantProps> = ({ 
  context,
  className 
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { messages, isLoading, sendMessage, clearMessages } = useOwnerAIChat(context);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const topics = QUICK_TOPICS[isRu ? 'ru' : 'en'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickTopic = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">
              {isRu ? 'AI-Ассистент UNO' : 'UNO AI Assistant'}
            </p>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu ? 'Помогу с управлением и ответлю на вопросы' : 'Here to help with property management'}
          </p>
        </div>
        {messages.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearMessages}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-6">
            {/* Welcome message */}
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-none rounded-none px-4 py-3 max-w-[85%]">
                <p className="text-sm">
                  {isRu 
                    ? 'Здравствуйте! 👋 Я ваш персональный ассистент UNO. Могу помочь с управлением объектами, ответить на вопросы о системе, рынке недвижимости Пхукета или законах Таиланда. Чем могу помочь?'
                    : 'Hello! 👋 I\'m your personal UNO assistant. I can help with property management, answer questions about the system, Phuket real estate market, or Thai regulations. How can I help you today?'}
                </p>
              </div>
            </div>

            {/* Quick topics */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-medium px-1">
                {isRu ? 'Популярные темы:' : 'Popular topics:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {topics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickTopic(topic.prompt)}
                    className="flex items-center gap-2 p-3 rounded-none bg-muted/50 hover:bg-muted transition-colors text-left text-sm"
                  >
                    <topic.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="truncate">{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isRu={isRu} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-none rounded-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={isRu ? 'Задайте вопрос...' : 'Ask a question...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
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
  message: AIMessage;
  isRu: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isRu }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[85%]', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'rounded-none px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground rounded-none'
              : 'bg-muted rounded-none'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content || '...'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground mt-1 px-1">
          {format(message.timestamp, 'HH:mm', { locale: isRu ? ru : undefined })}
        </p>
      </div>
    </div>
  );
};
