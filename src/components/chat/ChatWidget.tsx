/**
 * Floating chat: gold FAB → panel 360×520, POST /api/chat, leadId in sessionStorage.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getChatApiUrl } from '@/lib/chat/chatApi';
import { getOrCreateLeadId, setStoredLeadId } from '@/lib/chat/leadStorage';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { MiniListingCard } from '@/components/chat/MiniListingCard';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { ChatApiResponse, ChatListingPayload, ChatWidgetLang } from '@/types/chatWidget';

const LANGS: { code: ChatWidgetLang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: 'ZH' },
  { code: 'de', label: 'DE' },
  { code: 'th', label: 'TH' },
];

const footerCopy: Record<
  ChatWidgetLang,
  { continue: string; telegram: string; whatsapp: string; placeholder: string; send: string }
> = {
  ru: {
    continue: 'Продолжить в',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    placeholder: 'Сообщение…',
    send: 'Отправить',
  },
  en: {
    continue: 'Continue on',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    placeholder: 'Message…',
    send: 'Send',
  },
  zh: {
    continue: '继续',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    placeholder: '消息…',
    send: '发送',
  },
  de: {
    continue: 'Weiter in',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    placeholder: 'Nachricht…',
    send: 'Senden',
  },
  th: {
    continue: 'ต่อใน',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    placeholder: 'ข้อความ…',
    send: 'ส่ง',
  },
};

type Bubble = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  quickReplies?: string[];
  listings?: ChatListingPayload[];
};

function parseReply(data: ChatApiResponse): string {
  return (data.reply ?? data.message ?? data.text ?? '').trim();
}

export function ChatWidget({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [chatLang, setChatLang] = useState<ChatWidgetLang>('en');
  const [input, setInput] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [pending, setPending] = useState(false);
  const sendingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const copy = footerCopy[chatLang];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles, typing, open]);

  useEffect(() => {
    if (open) {
      getOrCreateLeadId();
      inputRef.current?.focus();
    }
  }, [open]);

  const postChat = useCallback(
    async (message: string) => {
      const leadId = getOrCreateLeadId();
      const url = getChatApiUrl();
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message, leadId, language: chatLang }),
      });

      const raw = await res.text();
      let data: ChatApiResponse = {};
      try {
        data = raw ? (JSON.parse(raw) as ChatApiResponse) : {};
      } catch {
        throw new Error(raw || 'Invalid JSON');
      }

      if (!res.ok) {
        throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
      }

      if (data.leadId) setStoredLeadId(data.leadId);

      const text = parseReply(data);
      const quickReplies = Array.isArray(data.quickReplies) ? data.quickReplies.filter(Boolean) : undefined;
      const listings = Array.isArray(data.listings) ? data.listings : undefined;

      return { text, quickReplies, listings };
    },
    [chatLang],
  );

  const newId = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sendingRef.current) return;
      sendingRef.current = true;

      const userBubble: Bubble = {
        id: newId(),
        role: 'user',
        content: trimmed,
      };
      setBubbles((prev) => [...prev, userBubble]);
      setInput('');
      setPending(true);
      setTyping(true);

      try {
        const { text: reply, quickReplies, listings } = await postChat(trimmed);
        setTyping(false);
        setBubbles((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'bot',
            content:
              reply ||
              (chatLang === 'ru'
                ? 'Нет текста ответа.'
                : 'No reply text.'),
            quickReplies,
            listings,
          },
        ]);
      } catch (e) {
        setTyping(false);
        logger.error('[ChatWidget] POST /api/chat', e);
        toast.error(chatLang === 'ru' ? 'Ошибка чата' : 'Chat error');
        setBubbles((prev) => [
          ...prev,
          {
            id: newId(),
            role: 'bot',
            content:
              chatLang === 'ru'
                ? 'Не удалось отправить сообщение. Попробуйте позже.'
                : 'Could not send your message. Please try again later.',
          },
        ]);
      } finally {
        setPending(false);
        sendingRef.current = false;
      }
    },
    [chatLang, postChat],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendText(input);
  };

  return (
    <>
      {/* Panel */}
      <div
        className={cn(
          'fixed z-[100] flex flex-col rounded-2xl border border-border/80 bg-background shadow-2xl transition-all duration-200 overflow-hidden',
          'bottom-24 right-4 md:bottom-6 md:right-6',
          'w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[min(520px,calc(100vh-6rem))]',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none invisible',
          className,
        )}
        aria-hidden={!open}
      >
        {/* Header + language */}
        <div className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm px-3 py-2.5 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => setChatLang(code)}
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors',
                  chatLang === code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
          {bubbles.length === 0 && !typing && (
            <p className="text-xs text-muted-foreground text-center px-2">
              {chatLang === 'ru'
                ? 'Напишите нам — поможем с объектами и сервисами на Пхукете.'
                : 'Ask us about properties and services in Phuket.'}
            </p>
          )}

          {bubbles.map((b) => (
            <div key={b.id} className={cn('flex', b.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  b.role === 'user'
                    ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-primary-foreground shadow-md'
                    : 'bg-zinc-900 text-zinc-100 border border-zinc-700/80 dark:bg-zinc-950',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{b.content}</p>

                {b.role === 'bot' && b.listings && b.listings.length > 0 && (
                  <div className="mt-3 space-y-2 flex flex-col items-start">
                    {b.listings.map((listing) => (
                      <MiniListingCard key={listing.id} listing={listing} chatLang={chatLang} />
                    ))}
                  </div>
                )}

                {b.role === 'bot' && b.quickReplies && b.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {b.quickReplies.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => sendText(qr)}
                        disabled={pending}
                        className="text-xs px-2 py-1 rounded-full border border-zinc-600 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-100 transition-colors"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-zinc-900 border border-zinc-700/80 flex items-center gap-1">
                <span className="sr-only">Typing</span>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Continue on Telegram / WhatsApp */}
        <div className="shrink-0 px-3 py-2 border-t border-border/60 bg-muted/30 space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground text-center">{copy.continue}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              asChild
            >
              <a href={COMPANY_CONTACTS.telegram.support} target="_blank" rel="noopener noreferrer">
                {copy.telegram}
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs border-green-600/40 text-green-700 dark:text-green-400"
              asChild
            >
              <a href={COMPANY_CONTACTS.whatsapp.link} target="_blank" rel="noopener noreferrer">
                {copy.whatsapp}
              </a>
            </Button>
          </div>
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="shrink-0 p-3 border-t border-border/60 flex gap-2 bg-card/90">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.placeholder}
            disabled={pending}
            className="flex-1 text-sm"
            maxLength={4000}
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending || !input.trim()}
            className="gradient-gold text-primary-foreground border-0 shrink-0"
            aria-label={copy.send}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed z-[100] w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
          'bottom-24 right-4 md:bottom-6 md:right-6',
          'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 text-primary-foreground',
          'ring-2 ring-amber-200/50 dark:ring-amber-900/40',
          'hover:scale-105 active:scale-95 transition-transform',
          open && 'scale-95 opacity-90',
        )}
        aria-expanded={open}
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}

export default ChatWidget;
