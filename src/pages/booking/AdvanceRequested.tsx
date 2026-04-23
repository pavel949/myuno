import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MessageCircle, FileText, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdvanceRequestedState {
  orderNumber: string;
  baseAmount: number;
  conciergeFee: number;
  totalWithFee: number;
  orderType?: string;
}

const AdvanceRequested = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const state = location.state as AdvanceRequestedState | null;
  
  // If no state, redirect to home
  if (!state) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {language === 'ru' ? 'Данные не найдены' : 'No data found'}
            </p>
            <Button onClick={() => navigate('/')}>
              {language === 'ru' ? 'На главную' : 'Go Home'}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const steps = [
    {
      icon: Clock,
      titleEn: 'Request Review',
      titleRu: 'Рассмотрение запроса',
      descEn: 'Our team will review your request (usually 1-2 hours)',
      descRu: 'Наша команда рассмотрит ваш запрос (обычно 1-2 часа)',
    },
    {
      icon: MessageCircle,
      titleEn: 'Confirmation',
      titleRu: 'Подтверждение',
      descEn: 'We\'ll contact you to confirm the payment',
      descRu: 'Мы свяжемся с вами для подтверждения',
    },
    {
      icon: FileText,
      titleEn: 'Payment Link',
      titleRu: 'Ссылка на оплату',
      descEn: 'After paying the provider, you\'ll receive a payment link',
      descRu: 'После оплаты провайдеру вы получите ссылку на оплату',
    },
  ];

  const handleWhatsApp = () => {
    const message = language === 'ru'
      ? `Здравствуйте! У меня вопрос по запросу на предоплату. Номер заказа: ${state.orderNumber}`
      : `Hello! I have a question about my advance payment request. Order number: ${state.orderNumber}`;
    window.open(`https://wa.me/66123456789?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">
              {language === 'ru' 
                ? 'Запрос на предоплату отправлен!' 
                : 'Advance Payment Request Submitted!'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ru'
                ? 'Наша команда уже работает над вашим запросом'
                : 'Our team is already working on your request'}
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-card border rounded-none p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">
                {language === 'ru' ? 'Детали заказа' : 'Order Details'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Номер заказа' : 'Order Number'}
                </span>
                <span className="font-medium font-mono">{state.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Сумма заказа' : 'Order Amount'}
                </span>
                <span>฿{state.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Сервис myUNO (5%)' : 'myUNO Service (5%)'}
                </span>
                <span className="text-accent">+฿{state.conciergeFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>{language === 'ru' ? 'К оплате' : 'Total to Pay'}</span>
                <span className="text-accent">฿{state.totalWithFee.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="mb-8">
            <h2 className="font-semibold mb-4">
              {language === 'ru' ? 'Что дальше?' : 'What\'s Next?'}
            </h2>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      index === 0 ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
                    )}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute top-10 left-1/2 w-0.5 h-8 bg-border -translate-x-1/2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <h3 className="font-medium mb-0.5">
                      {index + 1}. {language === 'ru' ? step.titleRu : step.titleEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ru' ? step.descRu : step.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/bookings')}
              className="w-full h-12"
            >
              {language === 'ru' ? 'Перейти к заказам' : 'View My Orders'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleWhatsApp}
              className="w-full h-12"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {language === 'ru' ? 'Написать в WhatsApp' : 'Contact via WhatsApp'}
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {language === 'ru'
              ? 'Вы получите уведомление, как только мы обработаем ваш запрос'
              : 'You\'ll receive a notification once we process your request'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdvanceRequested;
