import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { UserListingDraft } from '@/types/userListing';
import { BadgePercent } from 'lucide-react';

interface SellPricingStepProps {
  draft: UserListingDraft;
  onChange: (updates: Partial<UserListingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}

const CURRENCIES = [
  { value: 'THB', label: '฿ THB', symbol: '฿' },
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'RUB', label: '₽ RUB', symbol: '₽' },
];

export function SellPricingStep({ draft, onChange, onNext, onBack }: SellPricingStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const currency = CURRENCIES.find(c => c.value === draft.currency) || CURRENCIES[0];
  const isValid = draft.price && draft.price > 0;
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="price">
          {isRu ? 'Цена *' : 'Price *'}
        </Label>
        <div className="flex gap-2">
          <Select
            value={draft.currency}
            onValueChange={(value) => onChange({ currency: value })}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.value} value={curr.value}>
                  {curr.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Input
            id="price"
            type="number"
            placeholder="0"
            value={draft.price || ''}
            onChange={(e) => onChange({ price: parseFloat(e.target.value) || undefined })}
            className="flex-1 text-lg font-semibold"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
        <div className="flex items-center gap-3">
          <BadgePercent className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {isRu ? 'Торг уместен' : 'Price is negotiable'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Покупатели смогут предложить свою цену' 
                : 'Buyers can make an offer'}
            </p>
          </div>
        </div>
        <Switch
          checked={draft.is_negotiable}
          onCheckedChange={(checked) => onChange({ is_negotiable: checked })}
        />
      </div>
      
      {draft.price && draft.price > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Итоговая цена' : 'Your listing price'}
          </p>
          <p className="text-2xl font-bold">
            {currency.symbol}{draft.price.toLocaleString()}
          </p>
          {draft.is_negotiable && (
            <p className="text-sm text-muted-foreground mt-1">
              {isRu ? '(торг уместен)' : '(negotiable)'}
            </p>
          )}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          {isRu ? 'Назад' : 'Back'}
        </Button>
        <Button onClick={onNext} className="flex-1" disabled={!isValid}>
          {isRu ? 'Продолжить' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
