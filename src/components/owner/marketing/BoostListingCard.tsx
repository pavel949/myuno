/**
 * @component BoostListingCard
 * @description Card for purchasing listing promotions/boosts
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  Rocket, Star, TrendingUp, Zap, CheckCircle2,
  Clock, ArrowRight
} from 'lucide-react';
import { 
  usePropertyPromotions, useCreatePromotion, PROMOTION_TIERS,
  type PropertyPromotion
} from '@/hooks/usePropertyMarketing';
import { format, addDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface BoostListingCardProps {
  propertyId: string;
  className?: string;
}

export function BoostListingCard({ propertyId, className }: BoostListingCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  
  const [selectedTier, setSelectedTier] = useState<keyof typeof PROMOTION_TIERS | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { data: promotions = [] } = usePropertyPromotions(propertyId);
  const createPromotion = useCreatePromotion();
  
  const activePromotion = promotions.find(p => p.status === 'active');
  
  const tiers: Array<{
    type: 'featured' | 'boost' | 'highlight' | 'top_search';
    name_en: string;
    name_ru: string;
    description_en: string;
    description_ru: string;
    duration_days: number;
    price: number;
    currency: string;
    key: 'boost' | 'featured' | 'top_search';
    icon: typeof Rocket;
    color: string;
    bgColor: string;
    borderColor: string;
    popular?: boolean;
  }> = [
    {
      ...PROMOTION_TIERS.boost,
      key: 'boost' as const,
      icon: Rocket,
      color: 'text-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
    },
    {
      ...PROMOTION_TIERS.featured,
      key: 'featured' as const,
      icon: Star,
      color: 'text-accent-amber',
      bgColor: 'bg-accent-amber/10',
      borderColor: 'border-accent-amber/20',
      popular: true,
    },
    {
      ...PROMOTION_TIERS.top_search,
      key: 'top_search' as const,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
    },
  ];
  
  const handleSelectTier = (tierKey: keyof typeof PROMOTION_TIERS) => {
    setSelectedTier(tierKey);
    setShowConfirmDialog(true);
  };
  
  const handleConfirmPromotion = async () => {
    if (!selectedTier) return;
    
    const tier = PROMOTION_TIERS[selectedTier];
    const startsAt = new Date().toISOString();
    const endsAt = addDays(new Date(), tier.duration_days).toISOString();
    
    await createPromotion.mutateAsync({
      property_id: propertyId,
      promotion_type: tier.type,
      starts_at: startsAt,
      ends_at: endsAt,
      cost: tier.price,
      currency: tier.currency,
    });
    
    setShowConfirmDialog(false);
    setSelectedTier(null);
  };
  
  const selectedTierData = selectedTier ? PROMOTION_TIERS[selectedTier] : null;
  
  return (
    <>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isRu ? 'Продвижение' : 'Boost Your Listing'}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Увеличьте видимость объекта' : 'Increase your property visibility'}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Active Promotion */}
          {activePromotion && (
            <div className="p-3 rounded-none bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  {isRu ? 'Активное продвижение' : 'Active Promotion'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {activePromotion.promotion_type === 'featured' && (isRu ? 'Рекомендуемый' : 'Featured')}
                {activePromotion.promotion_type === 'boost' && (isRu ? 'Буст' : 'Boost')}
                {activePromotion.promotion_type === 'top_search' && (isRu ? 'Топ поиска' : 'Top Search')}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                {isRu ? 'До' : 'Until'} {format(new Date(activePromotion.ends_at), 'd MMMM', { locale })}
              </div>
            </div>
          )}
          
          {/* Promotion Tiers */}
          {!activePromotion && (
            <div className="space-y-2">
              {tiers.map((tier) => (
                <button
                  key={tier.key}
                  onClick={() => handleSelectTier(tier.key)}
                  className={cn(
                    "w-full p-3 rounded-none border-2 transition-all text-left",
                    "hover:shadow-md active:scale-[0.99]",
                    tier.borderColor,
                    tier.bgColor
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-none flex items-center justify-center",
                        tier.bgColor
                      )}>
                        <tier.icon className={cn("h-5 w-5", tier.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {isRu ? tier.name_ru : tier.name_en}
                          </p>
                          {tier.popular && (
                            <Badge variant="default" className="text-[10px] h-4">
                              {isRu ? 'Популярно' : 'Popular'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isRu ? tier.description_ru : tier.description_en}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">฿{tier.price.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {tier.duration_days} {isRu ? 'дней' : 'days'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Benefits */}
          <div className="pt-2 border-t space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              {isRu ? 'Преимущества' : 'Benefits'}
            </p>
            {[
              isRu ? 'Больше просмотров вашего объекта' : 'More views on your property',
              isRu ? 'Выше позиция в результатах поиска' : 'Higher position in search results',
              isRu ? 'Выделение среди конкурентов' : 'Stand out from competitors',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3 text-primary" />
                {benefit}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRu ? 'Подтвердите продвижение' : 'Confirm Promotion'}
            </DialogTitle>
            <DialogDescription>
              {selectedTierData && (
                <>
                  {isRu ? 'Вы выбрали' : 'You selected'} "{isRu ? selectedTierData.name_ru : selectedTierData.name_en}" 
                  {isRu ? ' на ' : ' for '}
                  {selectedTierData.duration_days} {isRu ? 'дней' : 'days'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTierData && (
            <div className="p-4 bg-muted rounded-none space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Тариф' : 'Plan'}</span>
                <span className="font-medium">{isRu ? selectedTierData.name_ru : selectedTierData.name_en}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Длительность' : 'Duration'}</span>
                <span className="font-medium">{selectedTierData.duration_days} {isRu ? 'дней' : 'days'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Окончание' : 'Ends'}</span>
                <span className="font-medium">
                  {format(addDays(new Date(), selectedTierData.duration_days), 'd MMMM yyyy', { locale })}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between">
                <span className="font-medium">{isRu ? 'Итого' : 'Total'}</span>
                <span className="text-lg font-bold">฿{selectedTierData.price.toLocaleString()}</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleConfirmPromotion}
              disabled={createPromotion.isPending}
            >
              {createPromotion.isPending 
                ? (isRu ? 'Обработка...' : 'Processing...') 
                : (isRu ? 'Оплатить' : 'Pay Now')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
