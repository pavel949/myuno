import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/hooks/useWallet';
import { usePromoteListing, getPromoPrice } from '@/hooks/usePromotedListings';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, Wallet, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingType: string;
  listingName?: string;
}

const DURATION_OPTIONS = [
  { days: '7', labelEn: '7 days', labelRu: '7 дней' },
  { days: '14', labelEn: '14 days', labelRu: '14 дней' },
  { days: '30', labelEn: '30 days', labelRu: '30 дней' },
];

export function PromoteListingModal({ open, onOpenChange, listingId, listingType, listingName }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { balance } = useWallet();
  const promoteMutation = usePromoteListing();
  const [selectedDays, setSelectedDays] = useState('7');
  const price = getPromoPrice(selectedDays);
  const canAfford = balance >= price;

  const handlePromote = async () => {
    try {
      await promoteMutation.mutateAsync({ listingId, listingType, days: selectedDays });
      toast.success(isRu ? 'Объект продвинут!' : 'Listing promoted!');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || (isRu ? 'Ошибка оплаты' : 'Payment failed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {isRu ? 'Продвинуть объект' : 'Promote Listing'}
          </DialogTitle>
          <DialogDescription>
            {listingName && <span className="font-medium text-foreground">{listingName}</span>}
            {' — '}
            {isRu
              ? 'Ваш объект будет показываться выше в каталоге'
              : 'Your listing will appear at the top of search results'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Duration selection */}
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const p = getPromoPrice(opt.days);
              const selected = selectedDays === opt.days;
              return (
                <button
                  key={opt.days}
                  onClick={() => setSelectedDays(opt.days)}
                  className={cn(
                    'relative rounded-xl border-2 p-3 text-center transition-all',
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {opt.days === '30' && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]">
                      {isRu ? 'Выгодно' : 'Best value'}
                    </Badge>
                  )}
                  <div className="font-semibold text-sm">
                    {isRu ? opt.labelRu : opt.labelEn}
                  </div>
                  <div className="text-lg font-bold text-primary mt-1">
                    ฿{p.toLocaleString()}
                  </div>
                  {selected && <Check className="h-4 w-4 text-primary mx-auto mt-1" />}
                </button>
              );
            })}
          </div>

          {/* Balance info */}
          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-4 w-4" />
              {isRu ? 'Баланс' : 'Balance'}
            </span>
            <span className={cn('font-semibold', canAfford ? 'text-foreground' : 'text-destructive')}>
              ฿{balance.toLocaleString()}
            </span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={!canAfford || promoteMutation.isPending}
            onClick={handlePromote}
          >
            {promoteMutation.isPending
              ? (isRu ? 'Обработка...' : 'Processing...')
              : !canAfford
                ? (isRu ? 'Недостаточно средств' : 'Insufficient balance')
                : (isRu ? `Оплатить ฿${price.toLocaleString()}` : `Pay ฿${price.toLocaleString()}`)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
