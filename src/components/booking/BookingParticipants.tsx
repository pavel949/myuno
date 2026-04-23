import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface BookingParticipantsProps {
  count: number;
  onChange: (count: number) => void;
  min?: number;
  max?: number;
  pricePerPerson?: number; // Always in THB
  label?: string;
}

export function BookingParticipants({
  count,
  onChange,
  min = 1,
  max = 10,
  pricePerPerson,
  label,
}: BookingParticipantsProps) {
  const { language, t } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();

  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">
        {label || t('tours.participants')}
      </Label>
      
      <div className="flex items-center justify-between bg-muted/50 rounded-none p-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.max(min, count - 1))}
          disabled={count <= min}
          className="h-10 w-10"
        >
          <Minus className="w-4 h-4" />
        </Button>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{count}</span>
          </div>
          {pricePerPerson && (
            <span className="text-xs text-muted-foreground mt-1">
              {currencyInfo.symbol}{convertPrice(pricePerPerson).toLocaleString()} × {count} = {currencyInfo.symbol}{convertPrice(pricePerPerson * count).toLocaleString()}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(Math.min(max, count + 1))}
          disabled={count >= max}
          className="h-10 w-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {max && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {t('booking.maxPeople').replace('{max}', String(max))}
        </p>
      )}
    </div>
  );
}
