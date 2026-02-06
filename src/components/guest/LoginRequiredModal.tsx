import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus, ArrowLeft, Shield, Sparkles, CreditCard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context to explain why login is needed */
  context?: 'booking' | 'order' | 'purchase' | 'save' | 'default';
  /** Where to return after successful login */
  returnPath?: string;
  /** Order/booking state to preserve */
  preserveState?: Record<string, unknown>;
}

const contextMessages = {
  booking: {
    en: 'To complete your booking, please sign in or create an account.',
    ru: 'Для завершения бронирования, пожалуйста, войдите или создайте аккаунт.',
  },
  order: {
    en: 'To place your order, please sign in or create an account.',
    ru: 'Для оформления заказа, пожалуйста, войдите или создайте аккаунт.',
  },
  purchase: {
    en: 'To complete your purchase, please sign in or create an account.',
    ru: 'Для завершения покупки, пожалуйста, войдите или создайте аккаунт.',
  },
  save: {
    en: 'To save your progress, please sign in or create an account.',
    ru: 'Для сохранения прогресса, пожалуйста, войдите или создайте аккаунт.',
  },
  default: {
    en: 'Please sign in or create an account to continue.',
    ru: 'Пожалуйста, войдите или создайте аккаунт для продолжения.',
  },
};

const benefits = [
  { icon: Shield, en: 'Secure payment processing', ru: 'Безопасная обработка платежей' },
  { icon: Sparkles, en: 'Earn cashback on purchases', ru: 'Получайте кэшбэк с покупок' },
  { icon: CreditCard, en: 'Track all your bookings', ru: 'Отслеживайте все бронирования' },
];

export function LoginRequiredModal({
  open,
  onOpenChange,
  context = 'default',
  returnPath,
  preserveState,
}: LoginRequiredModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const message = contextMessages[context][isRu ? 'ru' : 'en'];
  
  const handleLogin = () => {
    onOpenChange(false);
    navigate('/auth', { 
      state: { 
        from: returnPath || location.pathname,
        preserveState,
      } 
    });
  };

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/auth?mode=signup', { 
      state: { 
        from: returnPath || location.pathname,
        preserveState,
      } 
    });
  };

  const handleContinueBrowsing = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">
            {isRu ? 'Требуется авторизация' : 'Sign in required'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Benefits */}
          <div className="space-y-2">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <benefit.icon className="w-4 h-4 text-primary" />
                <span>{isRu ? benefit.ru : benefit.en}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={handleLogin} 
              className="w-full gap-2"
              size="lg"
            >
              <LogIn className="w-4 h-4" />
              {isRu ? 'Войти' : 'Sign in'}
            </Button>
            
            <Button 
              onClick={handleSignup} 
              variant="outline" 
              className="w-full gap-2"
              size="lg"
            >
              <UserPlus className="w-4 h-4" />
              {isRu ? 'Создать аккаунт' : 'Create account'}
            </Button>

            <button
              onClick={handleContinueBrowsing}
              className={cn(
                "w-full py-2 text-sm text-muted-foreground",
                "hover:text-foreground transition-colors flex items-center justify-center gap-1"
              )}
            >
              <ArrowLeft className="w-3 h-3" />
              {isRu ? 'Продолжить просмотр' : 'Continue browsing'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
