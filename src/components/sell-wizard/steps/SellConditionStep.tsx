import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ItemCondition, CONDITION_LABELS } from '@/types/userListing';
import { cn } from '@/lib/utils';
import { Sparkles, Star, ThumbsUp, Meh, Wrench } from 'lucide-react';

interface SellConditionStepProps {
  condition: ItemCondition;
  onChange: (condition: ItemCondition) => void;
  onNext: () => void;
  onBack: () => void;
}

const CONDITIONS: { value: ItemCondition; icon: React.ReactNode; descEn: string; descRu: string }[] = [
  { 
    value: 'new', 
    icon: <Sparkles className="h-5 w-5" />,
    descEn: 'Brand new, never used, in original packaging',
    descRu: 'Абсолютно новый, не использовался, в оригинальной упаковке'
  },
  { 
    value: 'like_new', 
    icon: <Star className="h-5 w-5" />,
    descEn: 'Used once or twice, no visible wear',
    descRu: 'Использовался 1-2 раза, без видимых следов использования'
  },
  { 
    value: 'good', 
    icon: <ThumbsUp className="h-5 w-5" />,
    descEn: 'Some signs of use, works perfectly',
    descRu: 'Есть следы использования, работает отлично'
  },
  { 
    value: 'fair', 
    icon: <Meh className="h-5 w-5" />,
    descEn: 'Visible wear and tear, fully functional',
    descRu: 'Заметные следы использования, полностью работает'
  },
  { 
    value: 'for_parts', 
    icon: <Wrench className="h-5 w-5" />,
    descEn: 'Not working or for parts only',
    descRu: 'Не работает или только на запчасти'
  },
];

export function SellConditionStep({ condition, onChange, onNext, onBack }: SellConditionStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {CONDITIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              condition === item.value
                ? 'border-primary bg-primary/5'
                : 'border-border'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                condition === item.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {isRu ? CONDITION_LABELS[item.value].ru : CONDITION_LABELS[item.value].en}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isRu ? item.descRu : item.descEn}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
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
