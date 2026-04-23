import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeamChannels, useTeamMessages, type TeamChannel, type TeamMessage } from '@/hooks/useTeamChat';
import { useTeamMembers } from '@/hooks/useTeamMember';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Hash, Megaphone, Send, Smile, Reply, MoreVertical,
  Headphones, TrendingUp, FileEdit, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const CHANNEL_ICONS: Record<string, typeof Hash> = {
  general: Hash,
  support: Headphones,
  sales: TrendingUp,
  content: FileEdit,
  announcements: Megaphone,
};

interface ChatSidebarProps {
  channels: TeamChannel[];
  activeChannel: string;
  onSelectChannel: (slug: string) => void;
  className?: string;
}

export function ChatSidebar({ channels, activeChannel, onSelectChannel, className }: ChatSidebarProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className={cn("w-56 border-r bg-muted/30 p-3", className)}>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-2">
        {isRu ? 'Каналы' : 'Channels'}
      </h3>
      <div className="space-y-1">
        {channels.map(channel => {
          const Icon = CHANNEL_ICONS[channel.slug] || Hash;
          const isActive = channel.slug === activeChannel;
          
          return (
            <button
              key={channel.id}
              onClick={() => onSelectChannel(channel.slug)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-none text-left transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate">
                {isRu ? channel.name_ru : channel.name_en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: TeamMessage;
  isOwn: boolean;
  onReply?: () => void;
}

function MessageBubble({ message, isOwn, onReply }: MessageBubbleProps) {
  const { language } = useLanguage();
  const dateLocale = language === 'ru' ? ru : enUS;

  return (
    <div className={cn(
      "group flex gap-3",
      isOwn && "flex-row-reverse"
    )}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">
          {message.sender?.display_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex-1 max-w-[70%]", isOwn && "flex flex-col items-end")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {message.sender?.display_name || 'Team Member'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { 
              addSuffix: true, 
              locale: dateLocale 
            })}
          </span>
        </div>
        
        <div className={cn(
          "px-4 py-2 rounded-none",
          isOwn 
            ? "bg-primary text-primary-foreground rounded-none" 
            : "bg-muted rounded-none"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Reactions */}
        {message.reactions && Object.keys(message.reactions as Record<string, string[]>).length > 0 && (
          <div className="flex gap-1 mt-1">
            {Object.entries(message.reactions as Record<string, string[]>).map(([emoji, users]) => (
              <Badge 
                key={emoji} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-muted"
              >
                {emoji} {users.length}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onReply}>
          <Reply className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Smile className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface ChatInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
  placeholder?: string;
}

function ChatInput({ onSend, isSending, placeholder }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleSend = () => {
    if (!message.trim() || isSending) return;
    onSend(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (isRu ? 'Напишите сообщение...' : 'Type a message...')}
          className="flex-1"
          disabled={isSending}
        />
        <Button 
          onClick={handleSend} 
          disabled={!message.trim() || isSending}
          size="icon"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface TeamChatProps {
  className?: string;
}

/**
 * Full team chat component with channels and messages
 */
export function TeamChat({ className }: TeamChatProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { channels, isLoading: channelsLoading } = useTeamChannels();
  const [activeChannel, setActiveChannel] = useState('general');
  const { messages, isLoading: messagesLoading, sendMessage, isSending } = useTeamMessages(activeChannel);
  const isRu = language === 'ru';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeChannelData = channels?.find(c => c.slug === activeChannel);

  if (channelsLoading) {
    return (
      <Card className={cn("flex h-[600px]", className)}>
        <div className="w-56 border-r p-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-9 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("flex h-[600px] overflow-hidden", className)}>
      {/* Channels Sidebar */}
      <ChatSidebar
        channels={channels || []}
        activeChannel={activeChannel}
        onSelectChannel={setActiveChannel}
      />

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Channel Header */}
        <div className="p-4 border-b flex items-center gap-3">
          {activeChannelData && (
            <>
              {React.createElement(
                CHANNEL_ICONS[activeChannelData.slug] || Hash,
                { className: "h-5 w-5 text-muted-foreground" }
              )}
              <div>
                <h3 className="font-medium">
                  {isRu ? activeChannelData.name_ru : activeChannelData.name_en}
                </h3>
                {activeChannelData.description && (
                  <p className="text-xs text-muted-foreground">
                    {activeChannelData.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-3/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Hash className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{isRu ? 'Пока нет сообщений' : 'No messages yet'}</p>
                <p className="text-sm mt-1">
                  {isRu ? 'Начните обсуждение!' : 'Start the conversation!'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === user?.id}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        {!activeChannelData?.is_announcements_only && (
          <ChatInput
            onSend={(content) => sendMessage({ content })}
            isSending={isSending}
          />
        )}
      </div>
    </Card>
  );
}
