import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  ChevronRight, 
  Send,
  HelpCircle,
  ShoppingBag,
  CreditCard,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { SectionCard } from '@/components/uno/SectionCard';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSupportChat, UNO_WHATSAPP } from '@/hooks/useChat';

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function Support() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { startSupportChat, openWhatsApp } = useSupportChat();
  const [quickMessage, setQuickMessage] = useState('');
  const isRu = language === 'ru';

  const quickTopics = [
    { 
      icon: ShoppingBag, 
      label: isRu ? 'Вопрос по бронированию' : 'Booking question',
      topic: isRu ? 'бронирование' : 'booking'
    },
    { 
      icon: CreditCard, 
      label: isRu ? 'Оплата и возврат' : 'Payment & refunds',
      topic: isRu ? 'оплата и возврат' : 'payment and refunds'
    },
    { 
      icon: MapPin, 
      label: isRu ? 'Помощь с локацией' : 'Location help',
      topic: isRu ? 'локация' : 'location'
    },
    { 
      icon: AlertTriangle, 
      label: isRu ? 'Сообщить о проблеме' : 'Report an issue',
      topic: isRu ? 'проблема с сервисом' : 'service issue'
    },
    { 
      icon: HelpCircle, 
      label: isRu ? 'Другой вопрос' : 'Other question',
      topic: ''
    },
  ];

  const handleSendQuickMessage = () => {
    if (quickMessage.trim()) {
      openWhatsApp(quickMessage);
      setQuickMessage('');
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Поддержка' : 'Support'} 
          showBack 
        />

        {/* Main WhatsApp CTA */}
        <SectionCard className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
              <WhatsAppIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">
                {isRu ? 'Чат с UNO' : 'Chat with UNO'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Быстрые ответы 24/7' : 'Quick answers 24/7'}
              </p>
            </div>
          </div>
          
          <PremiumButton 
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            onClick={() => startSupportChat()}
          >
            <WhatsAppIcon className="w-5 h-5 mr-2" />
            {isRu ? 'Открыть WhatsApp' : 'Open WhatsApp'}
          </PremiumButton>
          
          <p className="text-xs text-center text-muted-foreground mt-3">
            {UNO_WHATSAPP}
          </p>
        </SectionCard>

        {/* Quick Topics */}
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {isRu ? 'Выберите тему' : 'Select a topic'}
        </div>
        <SectionCard noPadding className="divide-y divide-border">
          {quickTopics.map((item, index) => (
            <button
              key={index}
              onClick={() => startSupportChat(item.topic)}
              className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left text-sm">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </SectionCard>

        {/* Quick Message */}
        <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">
          {isRu ? 'Или напишите сразу' : 'Or write directly'}
        </div>
        <SectionCard>
          <Textarea
            placeholder={isRu ? 'Опишите ваш вопрос...' : 'Describe your question...'}
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
            className="min-h-[100px] mb-3"
          />
          <PremiumButton 
            className="w-full"
            onClick={handleSendQuickMessage}
            disabled={!quickMessage.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {isRu ? 'Отправить в WhatsApp' : 'Send to WhatsApp'}
          </PremiumButton>
        </SectionCard>

        {/* Contact Info */}
        <div className="text-sm font-medium text-muted-foreground mb-2 mt-4">
          {isRu ? 'Другие способы связи' : 'Other contact methods'}
        </div>
        <SectionCard className="space-y-4">
          <a 
            href={`tel:${UNO_WHATSAPP}`}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isRu ? 'Позвонить' : 'Call us'}
              </p>
              <p className="text-xs text-muted-foreground">{UNO_WHATSAPP}</p>
            </div>
          </a>
          
          <a 
            href="mailto:support@uno.phuket"
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-xs text-muted-foreground">support@uno.phuket</p>
            </div>
          </a>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isRu ? 'Время работы' : 'Working hours'}
              </p>
              <p className="text-xs text-muted-foreground">24/7</p>
            </div>
          </div>
        </SectionCard>

        {/* FAQ Link */}
        <button 
          onClick={() => navigate('/faq')}
          className="w-full"
        >
          <SectionCard className="flex items-center gap-3 hover:bg-secondary/50 transition-colors">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="flex-1 font-medium text-left">
              {isRu ? 'Частые вопросы (FAQ)' : 'Frequently Asked Questions'}
            </span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SectionCard>
        </button>
      </PageContainer>
    </AppLayout>
  );
}
