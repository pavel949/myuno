import React, { useState } from 'react';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePromoCode, PromoCode } from '@/hooks/usePromoCode';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface PromoCodeInputProps {
  subtotal: number;
  onPromoApplied: (promo: PromoCode | null, discount: number) => void;
  className?: string;
}

export function PromoCodeInput({ subtotal, onPromoApplied, className }: PromoCodeInputProps) {
  const { language } = useLanguage();
  const { appliedPromo, isValidating, error, validatePromoCode, calculateDiscount, clearPromo } = usePromoCode();
  const [code, setCode] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    
    const promo = await validatePromoCode(code.trim(), subtotal);
    if (promo) {
      const discount = calculateDiscount(subtotal);
      onPromoApplied(promo, discount);
    } else {
      onPromoApplied(null, 0);
    }
  };

  const handleClear = () => {
    clearPromo();
    setCode('');
    onPromoApplied(null, 0);
  };

  if (appliedPromo) {
    const discount = calculateDiscount(subtotal);
    return (
      <div className={cn('bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <div>
              <span className="font-medium text-green-700 dark:text-green-400">
                {appliedPromo.code}
              </span>
              <span className="text-sm text-green-600 dark:text-green-500 ml-2">
                −{getCurrencySymbol('THB')}{discount}
              </span>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
          {language === 'ru' ? appliedPromo.description_ru : appliedPromo.description_en}
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={language === 'ru' ? 'Промокод' : 'Promo code'}
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button 
          onClick={handleApply} 
          disabled={isValidating || !code.trim()}
          variant="outline"
        >
          {isValidating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            language === 'ru' ? 'Применить' : 'Apply'
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
