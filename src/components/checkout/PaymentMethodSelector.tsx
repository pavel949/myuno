import { useState } from 'react';
import { CreditCard, ChevronRight, Plus, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentMethodSelectorProps {
  selectedMethodId: string | null;
  onSelect: (methodId: string | null, type: 'card' | 'cash' | 'wallet') => void;
  showCashOption?: boolean;
  showWalletOption?: boolean;
  walletBalance?: number;
}

const brandColors: Record<string, string> = {
  visa: 'from-info to-primary',
  mastercard: 'from-warning to-destructive',
  mir: 'from-success to-accent-teal',
  amex: 'from-muted-foreground to-foreground',
  default: 'from-muted-foreground to-secondary-foreground',
};

const brandLogos: Record<string, string> = {
  visa: 'VISA',
  mastercard: 'MC',
  mir: 'МИР',
  amex: 'AMEX',
};

export function PaymentMethodSelector({
  selectedMethodId,
  onSelect,
  showCashOption = true,
  showWalletOption = false,
  walletBalance = 0,
}: PaymentMethodSelectorProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const { paymentMethods, isLoading, defaultMethod } = usePaymentMethods();
  const [isOpen, setIsOpen] = useState(false);

  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);
  
  const handleSelectCard = (method: PaymentMethod) => {
    onSelect(method.id, 'card');
    setIsOpen(false);
  };

  const handleSelectCash = () => {
    onSelect(null, 'cash');
    setIsOpen(false);
  };

  const handleSelectWallet = () => {
    onSelect(null, 'wallet');
    setIsOpen(false);
  };

  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-xl" />;
  }

  const renderCardMini = (method: PaymentMethod) => {
    const brand = method.brand?.toLowerCase() || 'default';
    const gradientClass = brandColors[brand] || brandColors.default;
    
    return (
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-r',
          gradientClass
        )}>
          {brandLogos[brand] || <CreditCard className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">•••• {method.last4}</p>
          {method.exp_month && method.exp_year && (
            <p className="text-xs text-muted-foreground">
              {String(method.exp_month).padStart(2, '0')}/{String(method.exp_year).slice(-2)}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                {isRu ? 'Способ оплаты' : 'Payment Method'}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedMethod 
                  ? `•••• ${selectedMethod.last4}`
                  : (selectedMethodId === null 
                      ? (isRu ? 'Наличные' : 'Cash')
                      : (isRu ? 'Выберите способ' : 'Select method')
                    )
                }
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <SheetHeader className="mb-4">
          <SheetTitle>
            {isRu ? 'Способ оплаты' : 'Payment Method'}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 overflow-y-auto">
          {/* Saved Cards */}
          {paymentMethods.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isRu ? 'Сохранённые карты' : 'Saved Cards'}
              </p>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => handleSelectCard(method)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-xl border transition-colors',
                    selectedMethodId === method.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-accent/50'
                  )}
                >
                  {renderCardMini(method)}
                  <div className="flex items-center gap-2">
                    {method.is_default && (
                      <Star className="w-4 h-4 fill-warning text-warning" />
                    )}
                    {selectedMethodId === method.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add New Card */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
            onClick={() => window.location.href = '/wallet/cards'}
          >
            <Plus className="w-5 h-5" />
            {isRu ? 'Добавить карту' : 'Add Card'}
          </Button>

          {/* Wallet Option */}
          {showWalletOption && (
            <button
              type="button"
              onClick={handleSelectWallet}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border transition-colors',
                selectedMethodId === null && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg gradient-gold flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">₿</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">UNO Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Баланс:' : 'Balance:'} {formatPrice(walletBalance)}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Cash Option */}
          {showCashOption && (
            <button
              type="button"
              onClick={handleSelectCash}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border transition-colors',
                selectedMethodId === null && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="text-lg">💵</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">
                    {isRu ? 'Наличные' : 'Cash'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Оплата при получении' : 'Pay on delivery'}
                  </p>
                </div>
              </div>
              {selectedMethodId === null && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
