import { useState, useEffect, forwardRef } from 'react';
import { CreditCard, Wallet, Banknote, Smartphone, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'online';

interface PaymentOption {
  id: PaymentMethod;
  label: { en: string; ru: string };
  icon: React.ReactNode;
  disabled?: boolean;
  badge?: string;
}

export interface BookingPaymentSelectProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  amount: number;
  currency?: string;
  showWallet?: boolean;
  showCash?: boolean;
  showCard?: boolean;
  showOnline?: boolean;
}

export const BookingPaymentSelect = forwardRef<HTMLDivElement, BookingPaymentSelectProps>(({
  selected,
  onSelect,
  amount,
  currency = 'THB',
  showWallet = true,
  showCash = true,
  showCard = false,
  showOnline = true,
}, ref) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    if (!showWallet || !user) return;
    
    let isMounted = true;
    setLoadingWallet(true);
    
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (isMounted) {
          setWalletBalance(data?.balance ?? 0);
          setLoadingWallet(false);
        }
      });
    
    return () => {
      isMounted = false;
    };
  }, [user, showWallet]);

  const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₽';
  const canUseWallet = walletBalance !== null && walletBalance >= amount;

  const paymentOptions: PaymentOption[] = [
    ...(showWallet ? [{
      id: 'wallet' as PaymentMethod,
      label: { en: 'Wallet', ru: 'Кошелёк' },
      icon: loadingWallet ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />,
      disabled: !canUseWallet,
      badge: walletBalance !== null ? `${currencySymbol}${walletBalance.toLocaleString()}` : undefined,
    }] : []),
    ...(showCash ? [{
      id: 'cash' as PaymentMethod,
      label: { en: 'Cash on arrival', ru: 'Наличными' },
      icon: <Banknote className="w-5 h-5" />,
    }] : []),
    ...(showCard ? [{
      id: 'card' as PaymentMethod,
      label: { en: 'Card on site', ru: 'Картой на месте' },
      icon: <CreditCard className="w-5 h-5" />,
    }] : []),
    ...(showOnline ? [{
      id: 'online' as PaymentMethod,
      label: { en: 'Pay online', ru: 'Оплатить онлайн' },
      icon: <Smartphone className="w-5 h-5" />,
    }] : []),
  ];

  return (
    <div ref={ref} className="space-y-2">
      {paymentOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => !option.disabled && onSelect(option.id)}
          disabled={option.disabled}
          className={cn(
            "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
            selected === option.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            selected === option.id ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {option.icon}
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {option.label[language as 'en' | 'ru']}
            </p>
            {option.id === 'wallet' && !canUseWallet && walletBalance !== null && (
              <p className="text-xs text-destructive">
                {language === 'ru' ? 'Недостаточно средств' : 'Insufficient balance'}
              </p>
            )}
          </div>
          {option.badge && (
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              canUseWallet && option.id === 'wallet' 
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : "bg-muted text-muted-foreground"
            )}>
              {option.badge}
            </span>
          )}
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0",
            selected === option.id 
              ? "border-primary bg-primary" 
              : "border-muted-foreground/30"
          )}>
            {selected === option.id && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
});

BookingPaymentSelect.displayName = 'BookingPaymentSelect';
