import React from 'react';
import { Building2, Wrench, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ListingType } from '@/hooks/useListingApplication';
import { cn } from '@/lib/utils';

interface ListingTypeStepProps {
  value: ListingType;
  onChange: (type: ListingType) => void;
  onNext: () => void;
}

const LISTING_TYPES = [
  {
    type: 'property' as ListingType,
    icon: Building2,
    titleEn: 'Property for Rent',
    titleRu: 'Сдать жильё',
    descEn: 'Villa, condo, apartment, or house',
    descRu: 'Вилла, кондо, квартира или дом',
  },
  {
    type: 'service' as ListingType,
    icon: Wrench,
    titleEn: 'Offer a Service',
    titleRu: 'Предложить услугу',
    descEn: 'Tours, beauty, cleaning, repairs, etc.',
    descRu: 'Туры, красота, уборка, ремонт и др.',
  },
  {
    type: 'product' as ListingType,
    icon: Package,
    titleEn: 'Sell Products',
    titleRu: 'Продавать товары',
    descEn: 'Physical goods in the marketplace',
    descRu: 'Товары на маркетплейсе',
  },
];

export function ListingTypeStep({ value, onChange, onNext }: ListingTypeStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {isRu 
          ? 'Выберите тип листинга, который хотите создать'
          : 'Choose the type of listing you want to create'}
      </p>
      
      <div className="grid gap-4">
        {LISTING_TYPES.map((item) => {
          const Icon = item.icon;
          const isSelected = value === item.type;
          
          return (
            <Card
              key={item.type}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => onChange(item.type)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {isRu ? item.titleRu : item.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? item.descRu : item.descEn}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Button onClick={onNext} className="w-full" size="lg">
        {isRu ? 'Продолжить' : 'Continue'}
      </Button>
    </div>
  );
}
