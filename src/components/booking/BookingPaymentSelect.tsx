import { useState, useEffect, forwardRef } from 'react';
import { CreditCard, Wallet, Banknote, Smartphone, Loader2, ChevronRight, Star, QrCode } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/currencyUtils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'online' | 'promptpay' | 'concierge_advance';

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
  showPromptPay?: boolean;
  selectedCardId?: string | null;
  onCardSelect?: (cardId: string | null) => void;
}

const brandColors: Record<string, string> = {
  visa: 'from-blue-600 to-blue-800',
  mastercard: 'from-orange-500 to-red-600',
  mir: 'from-green-500 to-teal-600',
  amex: 'from-gray-600 to-gray-800',
  default: 'from-gray-500 to-gray-700',
};

const brandLogos: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  mir: 'МИР',
  amex: 'AMEX',
};

export const BookingPaymentSelect = forwardRef<HTMLDivElement, BookingPaymentSelectProps>(({
  selected,
  onSelect,
  amount,
  currency = 'THB',
  showWallet = true,
  showCash = true,
  showCard = false,
  showOnline = true,
  showPromptPay = true,
  selectedCardId,
  onCardSelect,
}, ref) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [showCardSheet, setShowCardSheet] = useState(false);
  
  const { paymentMethods, isLoading: cardsLoading, defaultMethod } = usePaymentMethods();

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

  // Auto-select default card when online is selected
  useEffect(() => {
    if (selected === 'online' && defaultMethod && !selectedCardId && onCardSelect) {
      onCardSelect(defaultMethod.id);
    }
  }, [selected, defaultMethod, selectedCardId, onCardSelect]);

  const currencySymbol = getCurrencySymbol(currency);
  const canUseWallet = walletBalance !== null && walletBalance >= amount;
  
  const selectedCard = paymentMethods.find(c => c.id === selectedCardId);
  const hasCards = paymentMethods.length > 0;

  // Only show PromptPay for THB currency
  const canShowPromptPay = showPromptPay && currency.toUpperCase() === 'THB';
  
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
      label: { en: 'Pay online (Card)', ru: 'Картой онлайн' },
      icon: <CreditCard className="w-5 h-5" />,
    }] : []),
    ...(canShowPromptPay ? [{
      id: 'promptpay' as PaymentMethod,
      label: { en: 'QR PromptPay', ru: 'QR PromptPay' },
      icon: <QrCode className="w-5 h-5" />,
      badge: 'Thai QR',
    }] : []),
  ];

  const handleOnlineClick = () => {
    onSelect('online');
    if (hasCards && onCardSelect) {
      setShowCardSheet(true);
    }
  };

  const handleCardSelect = (cardId: string) => {
    onCardSelect?.(cardId);
    setShowCardSheet(false);
  };

  return (
    <>
      <div ref={ref} className="space-y-2">
        {paymentOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              if (option.disabled) return;
              if (option.id === 'online') {
                handleOnlineClick();
              } else {
                onSelect(option.id);
              }
            }}
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
              {/* Show selected card info */}
              {option.id === 'online' && selected === 'online' && selectedCard && (
                <p className="text-xs text-muted-foreground">
                  •••• {selectedCard.last4}
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
            {/* Show card selector arrow for online */}
            {option.id === 'online' && hasCards && selected === 'online' ? (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            ) : (
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
            )}
          </button>
        ))}
      </div>

      {/* Card Selection Sheet */}
      <Sheet open={showCardSheet} onOpenChange={setShowCardSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>
              {language === 'ru' ? 'Выберите карту' : 'Select Card'}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-2">
            {paymentMethods.map((card) => {
              const brand = card.brand?.toLowerCase() || 'default';
              const gradientClass = brandColors[brand] || brandColors.default;
              
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => handleCardSelect(card.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-colors",
                    selectedCardId === card.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r',
                      gradientClass
                    )}>
                      {brandLogos[brand] || <CreditCard className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">•••• {card.last4}</p>
                      {card.exp_month && card.exp_year && (
                        <p className="text-xs text-muted-foreground">
                          {String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.is_default && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                    {selectedCardId === card.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Add new card link */}
            <button
              type="button"
              onClick={() => window.location.href = '/wallet/cards'}
              className="w-full p-3 rounded-xl border border-dashed text-center text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {language === 'ru' ? '+ Добавить новую карту' : '+ Add new card'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

BookingPaymentSelect.displayName = 'BookingPaymentSelect';
