/**
 * BookingCrossSellSheet — Modal showing AI-generated cross-sell offers
 * after a property booking is confirmed.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plane, Car, ShoppingCart, Flower2, Sparkles, UtensilsCrossed,
  Baby, Ship, Compass, Check, X, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrencySymbol } from '@/lib/config/currencies';

import { toast } from 'sonner';
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
  transfer: 'from-primary to-primary',
  car_rental: 'from-slate-600 to-slate-800',
  grocery: 'from-success to-success',
  flowers: 'from-accent to-accent',
  cleaning: 'from-success to-primary',
  restaurant: 'from-accent to-red-500',
  babysitter: 'from-primary to-primary',
  yacht: 'from-primary to-primary',
  experience: 'from-accent to-accent',
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

      try {
        const { data, error } = await supabase.functions.invoke('ai-cross-sell', {
          body: { booking_id: bookingId },
        });
        if (error) throw error;
        if (data?.offers) {
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

  const footer = (
    <Button
      variant="ghost"
      className="w-full text-muted-foreground"
      onClick={() => onOpenChange(false)}
    >
      {isRu ? 'Не сейчас' : 'Not now'}
    </Button>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? '✨ Сделайте отдых незабываемым' : '✨ Make your stay unforgettable'}
      description={isRu ? 'Подобрано специально для вашего бронирования' : 'Curated just for your booking'}
      icon={<Sparkles className="h-5 w-5 text-primary" />}
      size="lg"
      footer={footer}
    >
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="w-12 h-12 rounded-none" />
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
                  className="flex gap-3 p-3 rounded-none border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-none bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
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
    </ResponsiveModal>
  );
}
