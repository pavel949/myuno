/**
 * MessagesTab — owner inbox. Left: conversation list; right: active thread.
 * Owner reads customer messages translated (TH), replies in TH/EN (translated → RU).
 */
import { useState } from 'react';
import { Send, Loader2, ChevronLeft, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VoiceInputButton, appendTranscript } from '@/components/ui/voice-input-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBusinessChats, useThaiChatMessages, useSendThaiMessage } from '@/hooks/thaiServices/useThaiServices';
import { cn } from '@/lib/utils';
import type { ThaiChatMessage } from '@/types/thaiBusiness';

export function MessagesTab({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: chats = [], isLoading } = useBusinessChats(businessId);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const { data: messages = [] } = useThaiChatMessages(activeChat ?? undefined);
  const send = useSendThaiMessage();
  const [text, setText] = useState('');
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});

  const submit = async () => {
    if (!text.trim() || !activeChat) return;
    await send.mutateAsync({ businessId, chatId: activeChat, text, senderLang: 'th' });
    setText('');
  };

  // Owner view: own messages → original (TH/EN); customer messages → translated (TH).
  const displayText = (m: ThaiChatMessage) => {
    const isMine = m.sender_id === user?.id;
    if (showOriginal[m.id]) return isMine ? m.text_translated : m.text_original;
    return isMine ? m.text_original : (m.text_translated || m.text_original);
  };

  if (isLoading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;

  if (activeChat) {
    return (
      <div className="flex flex-col h-[70vh] border border-border">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Button size="icon" variant="ghost" onClick={() => setActiveChat(null)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium">{t('thai.owner.tab.messages')}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m) => {
            const isMine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%] px-3 py-2 text-sm', isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
                  {m.is_image && m.image_url ? <img src={m.image_url} alt="" className="max-h-48" /> : <p className="whitespace-pre-line">{displayText(m)}</p>}
                  {m.text_original !== m.text_translated && (
                    <button type="button" onClick={() => setShowOriginal((s) => ({ ...s, [m.id]: !s[m.id] }))} className="mt-1 text-[11px] opacity-60 underline">
                      {t('thai.chat.showOriginal')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('thai.chat.placeholder')} />
          <Button type="submit" size="icon" disabled={send.isPending || !text.trim()}>
            {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-2xl">
      {chats.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <MessagesSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{t('thai.empty')}</p>
        </div>
      ) : (
        chats.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChat(c.id)}
            className="w-full text-left border border-border p-3 hover:bg-muted"
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground">{t('thai.chat.title')}</span>
              <span className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
