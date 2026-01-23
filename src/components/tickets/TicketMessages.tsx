import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, User, Shield, Bot, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import type { TicketMessage } from '@/hooks/useTickets';
import { cn } from '@/lib/utils';

interface TicketMessagesProps {
  ticketId: string;
  messages: TicketMessage[];
  onSendMessage: (message: string) => Promise<boolean>;
  isAdmin?: boolean;
  onSendInternalNote?: (message: string) => Promise<boolean>;
  canReply?: boolean;
}

export function TicketMessages({ 
  ticketId, 
  messages: initialMessages, 
  onSendMessage, 
  isAdmin = false,
  onSendInternalNote,
  canReply = true 
}: TicketMessagesProps) {
  const [messages, setMessages] = useState<TicketMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Real-time subscription with proper cleanup
  useEffect(() => {
    let isSubscribed = true;
    const channelName = `ticket-messages-${ticketId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          if (!isSubscribed) return;
          const newMsg = payload.new as unknown as TicketMessage;
          // Don't show internal messages to non-admins
          if (!isAdmin && newMsg.is_internal) return;
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      channel.unsubscribe().then(() => {
        supabase.removeChannel(channel);
      });
    };
  }, [ticketId, isAdmin]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const success = isInternal && onSendInternalNote 
        ? await onSendInternalNote(newMessage)
        : await onSendMessage(newMessage);

      if (success) {
        setNewMessage('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const getSenderIcon = (type: string) => {
    switch (type) {
      case 'admin': return Shield;
      case 'system': return Bot;
      default: return User;
    }
  };

  const getSenderColor = (type: string) => {
    switch (type) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'system': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Нет сообщений
          </div>
        ) : (
          messages.map((msg) => {
            const Icon = getSenderIcon(msg.sender_type);
            const isCurrentUser = msg.sender_type === 'user' && !isAdmin;

            return (
              <div 
                key={msg.id} 
                className={cn(
                  'flex gap-3',
                  isCurrentUser && 'flex-row-reverse'
                )}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className={getSenderColor(msg.sender_type)}>
                    <Icon className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>

                <div className={cn('flex-1 max-w-[80%]', isCurrentUser && 'text-right')}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isCurrentUser && (
                      <span className="text-sm font-medium">
                        {msg.sender_name || (msg.sender_type === 'admin' ? 'Поддержка' : 'Вы')}
                      </span>
                    )}
                    {msg.is_internal && (
                      <Badge variant="outline" className="text-xs">
                        <Lock className="w-3 h-3 mr-1" />
                        Внутреннее
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
                    </span>
                  </div>

                  <Card className={cn(
                    msg.is_internal && 'bg-yellow-50 border-yellow-200',
                    msg.sender_type === 'system' && 'bg-muted/50'
                  )}>
                    <CardContent className="p-3">
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {canReply && (
        <div className="border-t p-4 bg-background">
          {isAdmin && onSendInternalNote && (
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant={isInternal ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsInternal(!isInternal)}
              >
                <Lock className="w-3 h-3 mr-1" />
                Внутренняя заметка
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isInternal ? 'Внутренняя заметка (не видна клиенту)...' : 'Введите сообщение...'}
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
