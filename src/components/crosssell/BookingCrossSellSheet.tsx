/**
 * BookingCrossSellSheet — Bottom sheet showing AI-generated cross-sell offers
 * after a property booking is confirmed.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Plane, Car, ShoppingCart, Flower2, Sparkles, UtensilsCrossed,
  Baby, Ship, Compass, Check, X, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrencySymbol } from '@/lib/config/currencies';

const SERVICE_ICONS: Record<string, any> = {
  transfer: Plane,
  car_rental: Car,
  grocery: ShoppingCart,
  flowers: Flower2,
  cleaning: Sparkles,
  restaurant: UtensilsCrossed,
  babysitter: Baby,
  yacht: Ship,
  experience: Compass,
};

const SERVICE_GRADIENTS: Record<string, string> = {
  transfer: 'from-blue-500 to-cyan-500',
  car_rental: 'from-slate-600 to-slate-800',
  grocery: 'from-green-500 to-emerald-600',
  flowers: 'from-pink-400 to-rose-500',
  cleaning: 'from-teal-400 to-cyan-500',
  restaurant: 'from-orange-400 to-red-500',
  babysitter: 'from-violet-400 to-purple-500',
  yacht: 'from-cyan-500 to-blue-600',
  experience: 'from-amber-500 to-orange-500',
};

const SERVICE_PATHS: Record<string, string> = {
  transfer: '/transport',
  car_rental: '/transport?type=rental',
  grocery: '/market?category=grocery',
  flowers: '/flowers',
  cleaning: '/services?type=cleaning',
  restaurant: '/restaurants',
  babysitter: '/babysitter',
  yacht: '/yachts',
  experience: '/experiences',
};

interface CrossSellOffer {
  id: string;
  service_type: string;
  service_name: string;
  suggested_price: number;
  reasoning: string;
  currency: string;
  status: string;
}

interface BookingCrossSellSheetProps {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingCrossSellSheet({ bookingId, open, onOpenChange }: BookingCrossSellSheetProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<CrossSellOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const isRu = language === 'ru';

  useEffect(() => {
    if (!open || !bookingId) return;

    const fetchOffers = async () => {
      setLoading(true);

      // First check if offers already exist
      const { data: existing } = await supabase
        .from('booking_cross_sell_offers')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('status', 'suggested');

      if (existing && existing.length > 0) {
        setOffers(existing as unknown as CrossSellOffer[]);
        setLoading(false);
        return;
      }

      // Generate new offers via edge function
      try {
        const { data, error } = await supabase.functions.invoke('ai-cross-sell', {
          body: { booking_id: bookingId },
        });

        if (error) throw error;
        if (data?.offers) {
          // Refetch from DB to get proper IDs
          const { data: freshOffers } = await supabase
            .from('booking_cross_sell_offers')
            .select('*')
            .eq('booking_id', bookingId)
            .eq('status', 'suggested');
          setOffers((freshOffers || []) as unknown as CrossSellOffer[]);
        }
      } catch (err) {
        console.error('Cross-sell error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [bookingId, open]);

  const handleDismiss = async (offerId: string) => {
    await supabase
      .from('booking_cross_sell_offers')
      .update({ status: 'dismissed' } as any)
      .eq('id', offerId);
    setOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const handleAccept = (offer: CrossSellOffer) => {
    const path = SERVICE_PATHS[offer.service_type] || '/';
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg">
            {isRu ? '✨ Сделайте отдых незабываемым' : '✨ Make your stay unforgettable'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Подобрано специально для вашего бронирования'
              : 'Curated just for your booking'}
          </p>
        </SheetHeader>

        <div className="space-y-3 pt-2 pb-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : offers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              {isRu ? 'Нет доступных предложений' : 'No offers available'}
            </p>
          ) : (
            <AnimatePresence>
              {offers.map((offer, idx) => {
                const Icon = SERVICE_ICONS[offer.service_type] || Compass;
                const gradient = SERVICE_GRADIENTS[offer.service_type] || 'from-primary to-primary/80';
                const currencySymbol = getCurrencySymbol(offer.currency || 'THB');

                return (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm truncate">{offer.service_name}</h4>
                        {offer.suggested_price > 0 && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {isRu ? 'от' : 'from'} {currencySymbol}{offer.suggested_price.toLocaleString()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {offer.reasoning}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleAccept(offer)}
                        >
                          {isRu ? 'Подробнее' : 'Explore'}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => handleDismiss(offer.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          {isRu ? 'Не сейчас' : 'Not now'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
