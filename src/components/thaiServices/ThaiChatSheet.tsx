/**
 * ThaiChatSheet — customer-side chat with a Thai business.
 *
 * The customer always reads in Russian: their own messages show the original,
 * the business's messages show the auto-translated RU text (with a toggle to
 * reveal the original). Sending goes through the `thai-chat-send` edge function
 * which translates + persists + notifies.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyChatWithBusiness, useThaiChatMessages, useSendThaiMessage } from '@/hooks/thaiServices/useThaiServices';
import { cn } from '@/lib/utils';
import type { ThaiChatMessage } from '@/types/thaiBusiness';
import { redirectToAuth } from '@/lib/auth/redirectToAuth';

interface Props {
  businessId: string;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThaiChatSheet({ businessId, businessName, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: chat } = useMyChatWithBusiness(open ? businessId : undefined);
  const [chatId, setChatId] = useState<string | undefined>();
  const effectiveChatId = chatId ?? chat?.id;
  const { data: messages = [] } = useThaiChatMessages(open ? effectiveChatId : undefined);
  const send = useSendThaiMessage();
  const [text, setText] = useState('');
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat?.id) setChatId(chat.id);
  }, [chat?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const submit = async (body: string) => {
    if (!user) { redirectToAuth(navigate); return; }
    if (!body.trim()) return;
    const res = await send.mutateAsync({ businessId, chatId: effectiveChatId, text: body, senderLang: 'ru' });
    setChatId(res.chatId);
    setText('');
  };

  // Customer view: own message → original RU; business message → translated RU.
  const displayText = (m: ThaiChatMessage) => {
    const isMine = m.sender_id === user?.id;
    if (showOriginal[m.id]) return isMine ? m.text_translated : m.text_original;
    return isMine ? m.text_original : (m.text_translated || m.text_original);
  };

  const quick: { label: string; msg: string }[] = [
    { label: t('thai.chat.quick.askPrice'), msg: t('thai.chat.quick.askPriceMsg') },
    { label: t('thai.chat.quick.checkDates'), msg: t('thai.chat.quick.checkDatesMsg') },
    { label: t('thai.chat.quick.askAddress'), msg: t('thai.chat.quick.askAddressMsg') },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-base">{businessName}</SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">{t('thai.chat.title')}</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] px-3 py-2 text-sm',
                    isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                  )}
                >
                  {m.is_image && m.image_url ? (
                    <img src={m.image_url} alt="" className="max-h-48" />
                  ) : (
                    <p className="whitespace-pre-line">{displayText(m)}</p>
                  )}
                  {!isMine && m.text_original !== m.text_translated && (
                    <button
                      type="button"
                      onClick={() => setShowOriginal((s) => ({ ...s, [m.id]: !s[m.id] }))}
                      className="mt-1 text-[11px] opacity-60 underline"
                    >
                      {t('thai.chat.showOriginal')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => submit(q.msg)}
                className="text-xs rounded-full border border-border px-2.5 py-1 text-foreground hover:bg-muted"
              >
                {q.label}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); submit(text); }}
          >
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('thai.chat.placeholder')}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={send.isPending || !text.trim()}>
              {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
