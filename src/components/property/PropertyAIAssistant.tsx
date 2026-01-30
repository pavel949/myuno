import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X, Sparkles, MapPin, Wallet, Users, Calendar, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyAIChat, AIMessage } from '@/hooks/usePropertyAIChat';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface QuickTopic {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
}

const QUICK_TOPICS: Record<string, QuickTopic[]> = {
  ru: [
    { icon: MapPin, label: 'Районы Пхукета', prompt: 'Расскажи про разные районы Пхукета — где лучше жить?' },
    { icon: Wallet, label: 'Бюджет 50K', prompt: 'Что можно снять за 50,000 бат в месяц?' },
    { icon: Users, label: 'С детьми', prompt: 'Ищем жильё для семьи с детьми. Какие районы посоветуешь?' },
    { icon: Home, label: 'Вилла vs Кондо', prompt: 'Что лучше — вилла или кондо? В чём разница?' },
    { icon: Calendar, label: 'На полгода', prompt: 'Хотим снять на 6 месяцев. Какие есть скидки за длительную аренду?' },
    { icon: Sparkles, label: 'Первый раз', prompt: 'Первый раз еду на Пхукет надолго. С чего начать поиск жилья?' },
  ],
  en: [
    { icon: MapPin, label: 'Phuket Areas', prompt: 'Tell me about different areas in Phuket — where is best to live?' },
    { icon: Wallet, label: 'Budget 50K', prompt: 'What can I rent for 50,000 baht per month?' },
    { icon: Users, label: 'With Kids', prompt: 'Looking for a place for a family with children. Which areas do you recommend?' },
    { icon: Home, label: 'Villa vs Condo', prompt: 'What\'s better — villa or condo? What\'s the difference?' },
    { icon: Calendar, label: '6 Months', prompt: 'We want to rent for 6 months. What discounts are available for long-term?' },
    { icon: Sparkles, label: 'First Time', prompt: 'First time coming to Phuket for an extended stay. Where do I start looking?' },
  ],
};

const WELCOME_MESSAGE: Record<string, string> = {
  ru: `Привет! 👋 Я AI-консультант по аренде недвижимости на Пхукете.

Помогу найти идеальное жильё:
• 📍 Подберу район под ваш стиль жизни
• 💰 Подскажу реальные цены и что в них входит
• ⚠️ Предупрежу о подводных камнях

**Расскажите, что ищете?** Или выберите тему ниже 👇`,
  en: `Hi! 👋 I'm your AI rental property consultant for Phuket.

I'll help you find the perfect place:
• 📍 Match an area to your lifestyle
• 💰 Give you real prices and what's included
• ⚠️ Warn you about pitfalls

**What are you looking for?** Or choose a topic below 👇`,
};

interface PropertyAIAssistantProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function PropertyAIAssistant({ className, onClose, showCloseButton }: PropertyAIAssistantProps) {
  const { language } = useLanguage();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { messages, isLoading, sendMessage, clearMessages } = usePropertyAIChat();

  const isRu = language === 'ru';
  const topics = QUICK_TOPICS[isRu ? 'ru' : 'en'];
  const welcomeMessage = WELCOME_MESSAGE[isRu ? 'ru' : 'en'];

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTopicClick = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/20">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">
              {isRu ? 'AI-Консультант' : 'AI Consultant'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Эксперт по аренде на Пхукете' : 'Phuket Rental Expert'}
            </p>
          </div>
        </div>
        {showCloseButton && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="shrink-0 p-1.5 rounded-full bg-primary/20 h-fit">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-lg rounded-tl-none p-3 text-sm">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {welcomeMessage}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
              
              {/* Quick topics */}
              <div className="grid grid-cols-2 gap-2 pl-8">
                {topics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleTopicClick(topic.prompt)}
                    className="flex items-center gap-2 p-2 text-left text-xs rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                  >
                    <topic.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "shrink-0 p-1.5 rounded-full h-fit",
                message.role === 'assistant' ? "bg-primary/20" : "bg-secondary"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
              <div className={cn(
                "rounded-lg p-3 text-sm max-w-[85%]",
                message.role === 'assistant' 
                  ? "bg-muted/50 rounded-tl-none" 
                  : "bg-primary text-primary-foreground rounded-tr-none"
              )}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {message.content || '...'}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-2">
              <div className="shrink-0 p-1.5 rounded-full bg-primary/20 h-fit">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-lg rounded-tl-none p-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRu ? 'Задайте вопрос о жилье...' : 'Ask about rentals...'}
            disabled={isLoading}
            className="text-sm"
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-muted-foreground hover:text-foreground mt-2"
          >
            {isRu ? 'Очистить чат' : 'Clear chat'}
          </button>
        )}
      </div>
    </div>
  );
}
