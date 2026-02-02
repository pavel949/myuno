import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MessageCircle, X, Sparkles, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;
const HIDDEN_ROUTES = ['/auth'];

type ActiveView = 'menu' | 'ai';

export const UnifiedChatFAB: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('menu');
  
  // AI Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeView === 'ai' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeView]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to get response');
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: isRu 
            ? 'Извините, произошла ошибка. Попробуйте позже.' 
            : 'Sorry, an error occurred. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWhatsApp = () => {
    window.open(COMPANY_CONTACTS.whatsapp.link, '_blank');
    setIsOpen(false);
  };

  const handleTelegram = () => {
    window.open(COMPANY_CONTACTS.telegram.number, '_blank');
    setIsOpen(false);
  };

  const handleOpenAI = () => {
    setActiveView('ai');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset to menu after close animation
    setTimeout(() => setActiveView('menu'), 300);
  };

  const quickQuestions = isRu 
    ? ['Как забронировать тур?', 'Где найти рестораны?', 'Аренда транспорта']
    : ['How to book a tour?', 'Where to find restaurants?', 'Transport rental'];

  // Hide on auth page
  if (HIDDEN_ROUTES.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Drawer for chat options */}
      <Drawer open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
        else setIsOpen(true);
      }}>
        <DrawerContent className="max-h-[85vh]">
          {activeView === 'menu' ? (
            <>
              <DrawerHeader className="text-center pb-2">
                <DrawerTitle>{isRu ? 'Связаться с нами' : 'Contact Us'}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 pt-0 space-y-3">
                {/* AI Assistant */}
                <button
                  onClick={handleOpenAI}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-foreground">UNO AI Assistant</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Мгновенные ответы 24/7' : 'Instant answers 24/7'}
                    </p>
                  </div>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center">
                    <WhatsAppIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-foreground">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Напишите нам в WhatsApp' : 'Chat with us on WhatsApp'}
                    </p>
                  </div>
                </button>

                {/* Telegram */}
                <button
                  onClick={handleTelegram}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 hover:border-[#0088cc]/40 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center">
                    <TelegramIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-foreground">Telegram</h3>
                    <p className="text-sm text-muted-foreground">
                      {isRu ? 'Напишите нам в Telegram' : 'Chat with us on Telegram'}
                    </p>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* AI Chat View */}
              <DrawerHeader className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveView('menu')}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <DrawerTitle className="text-base">UNO Assistant</DrawerTitle>
                      <p className="text-xs text-muted-foreground">
                        {isRu ? 'AI-помощник' : 'AI Support'}
                      </p>
                    </div>
                  </div>
                </div>
              </DrawerHeader>

              {/* Messages */}
              <div className="h-[50vh] overflow-y-auto p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {isRu 
                          ? 'Привет! Чем могу помочь?' 
                          : 'Hi! How can I help you?'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        {isRu ? 'Популярные вопросы:' : 'Quick questions:'}
                      </p>
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(q);
                            inputRef.current?.focus();
                          }}
                          className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex gap-2',
                          msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                          msg.role === 'user' ? 'bg-primary' : 'bg-primary/10'
                        )}>
                          {msg.role === 'user' 
                            ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                            : <Bot className="w-3.5 h-3.5 text-primary" />
                          }
                        </div>
                        <div className={cn(
                          'rounded-2xl px-3 py-2 max-w-[80%]',
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-muted rounded-bl-md'
                        )}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === 'user' && (
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRu ? 'Введите сообщение...' : 'Type a message...'}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSend} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg',
          'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          'md:bottom-6',
          className
        )}
        aria-label={isRu ? 'Открыть чат' : 'Open chat'}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
      </button>
    </>
  );
};

export default UnifiedChatFAB;
