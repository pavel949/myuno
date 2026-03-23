import { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Scale, Send, Bot, User, Loader2, Copy, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AILegalAssistantProps {
  propertyContext?: {
    title: string;
    address?: string;
    property_type?: string;
    price_per_night?: number;
    deposit_amount?: number;
    owner_name?: string;
  };
  bookingContext?: {
    guest_name: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    currency?: string;
    deposit_amount?: number;
    guest_email?: string;
    guest_phone?: string;
  };
}

const QUICK_ACTIONS_RU = [
  { label: '📄 Подтверждение бронирования', prompt: 'Сгенерируй подтверждение бронирования для гостя на английском и русском языках. Включи детали объекта, даты, сумму и условия оплаты депозита.' },
  { label: '📋 Договор аренды', prompt: 'Составь договор краткосрочной аренды на английском и русском языках для объекта на Пхукете. Включи все необходимые пункты по тайскому законодательству.' },
  { label: '🔑 Акт приёма-передачи', prompt: 'Составь акт приёма-передачи объекта при заезде гостя на английском и русском.' },
  { label: '💰 Акт возврата залога', prompt: 'Составь акт возврата залога с расшифровкой удержаний на английском и русском.' },
  { label: '📑 Доверенность на управление', prompt: 'Составь доверенность собственника на управляющую компанию для управления объектом недвижимости на Пхукете.' },
  { label: '⚖️ Консультация по тайскому праву', prompt: 'Какие основные правила аренды недвижимости иностранцами на Пхукете? Расскажи о законодательных ограничениях, правах арендатора и арендодателя.' },
];

const QUICK_ACTIONS_EN = [
  { label: '📄 Booking Confirmation', prompt: 'Generate a booking confirmation letter for the guest in English and Russian. Include property details, dates, amount, and deposit payment terms.' },
  { label: '📋 Lease Agreement', prompt: 'Draft a short-term lease agreement in English and Russian for a Phuket property. Include all necessary clauses under Thai law.' },
  { label: '🔑 Handover Act', prompt: 'Draft a property handover act for guest check-in in English and Russian.' },
  { label: '💰 Deposit Return Act', prompt: 'Draft a deposit return act with deduction breakdown in English and Russian.' },
  { label: '📑 Power of Attorney', prompt: 'Draft a power of attorney from owner to management company for property management in Phuket.' },
  { label: '⚖️ Thai Law Consultation', prompt: 'What are the key rules for foreigners renting property in Phuket? Cover legal restrictions, tenant and landlord rights.' },
];

export function AILegalAssistant({ propertyContext, bookingContext }: AILegalAssistantProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const quickActions = isRu ? QUICK_ACTIONS_RU : QUICK_ACTIONS_EN;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-legal-assistant`;

    const context: any = {};
    if (propertyContext) context.property = propertyContext;
    if (bookingContext) context.booking = bookingContext;
    if (activeCompany) {
      context.company = {
        name: activeCompany.name_en || activeCompany.name_ru || '',
      };
    }

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages, context }),
    });

    if (resp.status === 429) {
      toast.error(isRu ? 'Превышен лимит запросов, попробуйте позже' : 'Rate limit exceeded, try again later');
      throw new Error('Rate limited');
    }
    if (resp.status === 402) {
      toast.error(isRu ? 'Необходимо пополнить баланс' : 'Payment required, add credits');
      throw new Error('Payment required');
    }
    if (!resp.ok || !resp.body) throw new Error('Failed to start stream');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantSoFar = '';
    let streamDone = false;

    while (!streamDone) {
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
        if (jsonStr === '[DONE]') { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
              }
              return [...prev, { role: 'assistant', content: assistantSoFar }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { role: 'user', content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (e) {
      logger.error(e);
      if (!(e instanceof Error && (e.message === 'Rate limited' || e.message === 'Payment required'))) {
        toast.error(isRu ? 'Ошибка AI' : 'AI Error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isRu ? 'Скопировано' : 'Copied');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          {isRu ? 'AI Юрист • Недвижимость Пхукет' : 'AI Legal • Phuket Real Estate'}
          <Badge variant="secondary" className="text-[10px] ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </CardTitle>
        {(propertyContext || bookingContext) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {propertyContext && (
              <Badge variant="outline" className="text-[10px]">
                🏠 {propertyContext.title}
              </Badge>
            )}
            {bookingContext && (
              <Badge variant="outline" className="text-[10px]">
                👤 {bookingContext.guest_name} | {bookingContext.check_in}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 gap-3">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {isRu 
                  ? 'Я помогу составить любые документы для аренды недвижимости на Пхукете. Выберите действие или задайте вопрос.'
                  : 'I can help draft any documents for Phuket rental properties. Choose an action or ask a question.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickActions.map((action, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 justify-start text-left whitespace-normal"
                    onClick={() => handleSend(action.prompt)}
                    disabled={isLoading}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                    {msg.role === 'assistant' && msg.content.length > 100 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 mt-1 text-[10px]"
                        onClick={() => copyToClipboard(msg.content)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {isRu ? 'Копировать' : 'Copy'}
                      </Button>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-xl px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2 flex-shrink-0">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRu ? 'Опишите документ или задайте вопрос...' : 'Describe the document or ask a question...'}
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-11 w-11 flex-shrink-0"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
