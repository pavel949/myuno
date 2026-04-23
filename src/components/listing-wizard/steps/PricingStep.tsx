import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ListingApplicationDraft } from '@/hooks/useListingApplication';

interface PricingStepProps {
  draft: ListingApplicationDraft;
  onChange: (updates: Partial<ListingApplicationDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CURRENCIES = [
  { value: 'THB', label: '฿ THB' },
  { value: 'USD', label: '$ USD' },
  { value: 'EUR', label: '€ EUR' },
  { value: 'RUB', label: '₽ RUB' },
];

export function PricingStep({ draft, onChange, onNext, onBack }: PricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const getPriceLabel = () => {
    if (draft.listing_type === 'property') {
      return isRu ? 'Цена за ночь' : 'Price per night';
    }
    if (draft.listing_type === 'service') {
      return isRu ? 'Цена за услугу' : 'Price per service';
    }
    return isRu ? 'Цена за единицу' : 'Price per unit';
  };
  
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Укажите цену для вашего листинга'
          : 'Set the price for your listing'}
      </p>
      
      <div className="space-y-2">
        <Label>{getPriceLabel()}</Label>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min={0}
              value={draft.price ?? ''}
              onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="text-lg"
            />
          </div>
          <Select
            value={draft.currency || 'THB'}
            onValueChange={(v) => onChange({ currency: v })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {draft.listing_type === 'property' && (
        <div className="bg-muted/50 rounded-none p-4">
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? 'После одобрения вы сможете настроить сезонные цены, скидки за длительное проживание и специальные предложения.'
              : 'After approval, you can set up seasonal pricing, long-stay discounts, and special offers.'}
          </p>
        </div>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1">
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
