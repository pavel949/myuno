/**
 * ConciergeIntentChat — M10d (IPP §18 "Seven Doors" intent router).
 *
 * Free-text chat UI that routes user intent to the right cluster + route.
 * Mounted on /discover when ?ai=1 (and reachable from FloatingConcierge FAB).
 *
 * - Uses `useConciergeIntent` hook (full history sent each turn).
 * - Renders assistant replies as markdown.
 * - Each assistant turn may attach a CTA button → navigate to suggested route.
 * - Bilingual RU/EN, semantic tokens only.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Send, RotateCcw, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useConciergeIntent, type ChatMessage } from '@/hooks/useConciergeIntent';
import { cn } from '@/lib/utils';

const SUGGESTED_PROMPTS_RU = [
  'Хочу купить квартиру под сдачу',
  'Прилетаю с семьёй на 3 месяца',
  'Какая виза мне нужна?',
  'Управляю двумя виллами — что вы можете?',
];

const SUGGESTED_PROMPTS_EN = [
  'I want to buy a unit for rental',
  'Arriving with family for 3 months',
  'Which visa do I need?',
  'I manage 2 villas — what can you do?',
];

export function ConciergeIntentChat() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { messages, isPending, send, reset } = useConciergeIntent();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isPending]);

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || isPending) return;
    setInput('');
    void send(value);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const isEmpty = messages.length === 0;
  const prompts = isRu ? SUGGESTED_PROMPTS_RU : SUGGESTED_PROMPTS_EN;

  return (
    <Card className="bg-card border-border shadow-sm" data-testid="concierge-intent-chat">
      <CardContent className="p-0 flex flex-col h-[min(70vh,640px)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground leading-tight">
                {isRu ? 'AI-Консьерж myUNO' : 'myUNO AI Concierge'}
              </div>
              <div className="text-[11px] text-muted-foreground leading-tight">
                {isRu ? 'Опишите задачу — я подскажу куда пойти' : 'Describe your goal — I will route you'}
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="p-2 rounded-none hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label={isRu ? 'Начать заново' : 'Start over'}
              title={isRu ? 'Начать заново' : 'Start over'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isEmpty && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground leading-relaxed">
                {isRu
                  ? 'Привет 👋 Я помогу разобраться. Опишите своими словами, что вам нужно — найду подходящий раздел.'
                  : 'Hi 👋 Tell me in your own words what you need and I will route you to the right place.'}
              </div>
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {isRu ? 'Примеры' : 'Try'}
                </div>
                {prompts.map(p => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="w-full text-left text-sm px-3 py-2.5 rounded-none border border-border hover:border-primary/40 hover:bg-muted/40 transition-colors"
                    disabled={isPending}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m => (
            <MessageBubble
              key={m.id}
              message={m}
              isRu={isRu}
              onNavigate={(r) => navigate(r)}
            />
          ))}

          {isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {isRu ? 'Думаю…' : 'Thinking…'}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={onSubmit}
          className="border-t border-border p-3 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRu ? 'Спросите что угодно…' : 'Ask anything…'}
            disabled={isPending}
            aria-label={isRu ? 'Сообщение' : 'Message'}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isPending || !input.trim()}
            aria-label={isRu ? 'Отправить' : 'Send'}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MessageBubble({
  message,
  isRu,
  onNavigate,
}: {
  message: ChatMessage;
  isRu: boolean;
  onNavigate: (route: string) => void;
}) {
  const isUser = message.role === 'user';
  const label = message.routeLabel
    ? (isRu ? message.routeLabel.ru : message.routeLabel.en) ?? null
    : null;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-none px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : message.isError
              ? 'bg-destructive/10 text-destructive border border-destructive/20'
              : 'bg-muted text-foreground',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    onClick={(e) => {
                      if (href && href.startsWith('/')) {
                        e.preventDefault();
                        onNavigate(href);
                      }
                    }}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && message.route && label && (
          <button
            onClick={() => onNavigate(message.route!)}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            {label}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
