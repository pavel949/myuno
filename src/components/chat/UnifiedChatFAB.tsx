import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FLOATING, FLOATING_OFFSET } from '@/lib/nav/floatingStack';
import { Sparkles, X, Send, Bot, User, Loader2, Download, Phone, Mail, Smartphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { COMPANY_CONTACTS, getWhatsAppUrl, getLineUrl, getTelLink, getMailtoLink } from '@/lib/config/contacts';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const LineIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.135-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;
const HISTORY_KEY = 'uno_chat_history_v1';
const HISTORY_LIMIT = 20;

/**
 * Routes where the global contact FAB must stay hidden.
 * Operational shells (admin/mc/operate/vendor) have their own help UX;
 * /auth is a focused flow we don't want to interrupt.
 */
const HIDDEN_ROUTE_PATTERNS: RegExp[] = [
  /^\/auth(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/mc(\/|$)/,
  /^\/operate(\/|$)/,
  /^\/vendor(\/|$)/,
  /^\/developer-portal(\/|$)/,
  /^\/owner(\/|$)/,
];

type ActiveView = 'menu' | 'ai';

export const UnifiedChatFAB: React.FC<{ className?: string }> = ({ className }) => {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();

  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('menu');

  // AI Chat state — restored from localStorage so the conversation persists across sessions.
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-HISTORY_LIMIT) as Message[];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist message history (last HISTORY_LIMIT entries) so users can resume conversations.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const trimmed = messages.slice(-HISTORY_LIMIT);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      /* quota or private-mode — silently ignore */
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (activeView === 'ai' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeView]);

  // Snapshot the current page so the AI knows where the user is asking from.
  const pageContext = useMemo(() => ({
    path: location.pathname + location.search,
    title: typeof document !== 'undefined' ? document.title : '',
    lang: language,
  }), [location.pathname, location.search, language]);

  const streamChat = useCallback(async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages, pageContext }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || 'Failed to get response');
    }
    if (!resp.body) throw new Error('No response body');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m,
                );
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  }, [pageContext]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isRu
            ? 'Извините, произошла ошибка. Попробуйте позже или напишите нам в WhatsApp.'
            : 'Sorry, an error occurred. Please try again or message us on WhatsApp.',
        },
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

  const handleClearHistory = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem(HISTORY_KEY); } catch { /* noop */ }
    }
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleInstallClick = async () => {
    if (canInstall) {
      const ok = await install();
      if (ok) { setIsOpen(false); return; }
    }
    // iOS: open instructions page; Android/desktop without prompt: same fallback.
    window.location.href = '/install';
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setActiveView('menu'), 300);
  };

  const quickQuestions = isRu
    ? ['Как забронировать тур?', 'Где найти рестораны?', 'Аренда транспорта']
    : ['How to book a tour?', 'Where to find restaurants?', 'Transport rental'];

  const showInstall = !isInstalled;
  const showLine = COMPANY_CONTACTS.line.enabled;

  // Hide on operational / auth routes.
  if (HIDDEN_ROUTE_PATTERNS.some((re) => re.test(location.pathname))) {
    return null;
  }

  return (
    <>
      <Drawer
        open={isOpen}
        onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}
      >
        <DrawerContent className="max-h-[90vh]">
          {activeView === 'menu' ? (
            <>
              <DrawerHeader className="text-center pb-2">
                <DrawerTitle>{isRu ? 'Чем помочь?' : 'How can we help?'}</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 pt-0 space-y-3 overflow-y-auto">
                {/* PRIMARY — AI assistant */}
                <button
                  onClick={() => setActiveView('ai')}
                  className="w-full flex items-center gap-4 p-4 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{isRu ? 'UNO AI Ассистент' : 'UNO AI Assistant'}</h3>
                    <p className="text-sm opacity-80">
                      {isRu ? 'Мгновенные ответы 24/7' : 'Instant answers 24/7'}
                    </p>
                  </div>
                </button>

                {/* Human channels */}
                <p className="text-xs text-muted-foreground pt-2 px-1">
                  {isRu ? 'Поговорить с человеком' : 'Talk to a human'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => openExternal(getWhatsAppUrl(isRu ? 'Здравствуйте, myUNO!' : 'Hello myUNO!'))}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => openExternal(COMPANY_CONTACTS.telegram.support)}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center">
                      <TelegramIcon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium">Telegram</span>
                  </button>
                  {showLine && (
                    <button
                      onClick={() => openExternal(getLineUrl())}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center">
                        <LineIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium">LINE</span>
                    </button>
                  )}
                </div>

                {/* Direct contacts strip */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={getTelLink()}
                    className="flex items-center gap-2 p-3 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{isRu ? 'Звонок' : 'Call'}</div>
                      <div className="text-sm font-medium truncate">{COMPANY_CONTACTS.phone.display}</div>
                    </div>
                  </a>
                  <a
                    href={getMailtoLink('support')}
                    className="flex items-center gap-2 p-3 rounded-none border border-border bg-card hover:border-foreground/40 transition-colors"
                  >
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="text-sm font-medium truncate">{COMPANY_CONTACTS.email.support}</div>
                    </div>
                  </a>
                </div>

                {/* PWA install */}
                {showInstall && (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center gap-3 p-3 rounded-none border border-dashed border-border hover:border-foreground/40 transition-colors"
                  >
                    {isIOS ? <Smartphone className="w-4 h-4 text-muted-foreground" /> : <Download className="w-4 h-4 text-muted-foreground" />}
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {isRu ? 'Установить приложение' : 'Install the app'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isIOS
                          ? (isRu ? 'Поделиться → На экран «Домой»' : 'Share → Add to Home Screen')
                          : (isRu ? 'Работает офлайн, без магазина' : 'Works offline, no app store')}
                      </div>
                    </div>
                  </button>
                )}

                <p className="text-[11px] text-center text-muted-foreground pt-2">
                  {isRu
                    ? `Поддержка ${COMPANY_CONTACTS.workingHours.support} · Офис ${COMPANY_CONTACTS.workingHours.office} ICT`
                    : `Support ${COMPANY_CONTACTS.workingHours.support} · Office ${COMPANY_CONTACTS.workingHours.office} ICT`}
                </p>
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
                    aria-label={isRu ? 'Назад' : 'Back'}
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
                        {isRu ? 'AI-помощник · 24/7' : 'AI Support · 24/7'}
                      </p>
                    </div>
                  </div>
                </div>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearHistory}
                    className="h-8 w-8"
                    aria-label={isRu ? 'Очистить историю' : 'Clear history'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </DrawerHeader>

              {/* Messages */}
              <div className="h-[55vh] overflow-y-auto p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {isRu ? 'Привет! Чем могу помочь?' : 'Hi! How can I help you?'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">
                        {isRu ? 'Популярные вопросы:' : 'Quick questions:'}
                      </p>
                      {quickQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setInput(q); inputRef.current?.focus(); }}
                          className="w-full text-left p-3 rounded-none bg-muted/50 hover:bg-muted text-sm transition-colors"
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
                        className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                          msg.role === 'user' ? 'bg-primary' : 'bg-primary/10',
                        )}>
                          {msg.role === 'user'
                            ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                            : <Bot className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <div className={cn(
                          'rounded-none px-3 py-2 max-w-[80%]',
                          msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
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
                        <div className="rounded-none bg-muted px-3 py-2">
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
                  <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  {isRu
                    ? 'AI может ошибаться. Для важных вопросов — WhatsApp.'
                    : 'AI may make mistakes. For critical issues — WhatsApp.'}
                </p>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* Single global FAB — Sparkles signals "AI", green dot signals "live". */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed w-12 h-12 rounded-full',
          FLOATING_OFFSET.chatAboveStack,
          'right-4',
          FLOATING.chatFab,
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'shadow-[var(--shadow-elevation-2)] ring-1 ring-primary/20',
          'transition-transform hover:scale-105 active:scale-95',
          'md:bottom-6 md:w-14 md:h-14',
          className,
        )}
        aria-label={isRu ? 'Открыть помощник UNO' : 'Open UNO assistant'}
      >
        <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background" />
      </button>
    </>
  );
};

export default UnifiedChatFAB;
