/**
 * PortalChatTab — Real-time chat between owner and MC.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePortalChat } from '@/hooks/usePortalChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Props {
  propertyId: string;
  senderRole?: 'owner' | 'mc';
}

export function PortalChatTab({ propertyId, senderRole = 'owner' }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, markAsRead } = usePortalChat(propertyId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Mark unread messages as read
  useEffect(() => {
    const unread = messages.filter(
      m => !m.is_read && m.sender_role !== senderRole
    );
    if (unread.length > 0) {
      markAsRead(unread.map(m => m.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, senderRole]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    try {
      await sendMessage({ message: text, senderRole });
    } catch {
      // error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        {isRu ? 'Загрузка...' : 'Loading...'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[60vh] max-h-[500px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">{isRu ? 'Начните диалог' : 'Start a conversation'}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                <p className={cn(
                  'text-[10px] mt-1',
                  isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}>
                  {format(new Date(msg.created_at), 'HH:mm')}
                  {isOwn && msg.is_read && ' ✓✓'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={isRu ? 'Написать сообщение...' : 'Type a message...'}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isSending}
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim() || isSending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
