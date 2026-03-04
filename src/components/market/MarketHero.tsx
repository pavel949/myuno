import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Truck, 
  Clock, 
  Gift,
  ArrowRight,
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 text-white/90">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

interface MarketHeroProps {
  totalProducts: number;
  totalCategories: number;
  freeDeliveryThreshold: number;
}

export function MarketHero({ totalProducts, totalCategories, freeDeliveryThreshold }: MarketHeroProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative px-4 py-6 max-w-[1536px] mx-auto">
        {/* Header with badge */}
        <div className="flex items-center gap-2 mb-3">
        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <Sparkles className="w-3 h-3 mr-1" />
            {isRu ? 'Всё для жизни за рубежом' : 'Everything abroad'}
          </Badge>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
          {isRu ? (
            <>Свежие продукты<br />с доставкой за 45 мин</>
          ) : (
            <>Fresh groceries<br />delivered in 45 min</>
          )}
        </h1>
        
        {/* Subtitle */}
        <p className="text-white/80 text-sm mb-4 max-w-xs">
          {isRu 
            ? `${totalProducts}+ товаров в ${totalCategories} категориях — надёжная инфраструктура для повседневных покупок`
            : `${totalProducts}+ products in ${totalCategories} categories — trusted infrastructure for daily shopping`
          }
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Button 
            className="bg-white text-primary hover:bg-white/90 shadow-lg rounded-full gap-1.5"
            onClick={() => navigate('/market/categories')}
          >
            {isRu ? 'Каталог' : 'Browse'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-full"
            onClick={() => navigate('/market/category/deals')}
          >
            <Gift className="w-4 h-4 mr-1.5" />
            {isRu ? 'Акции' : 'Deals'}
          </Button>
        </div>
        
        {/* Trust Badges Row */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-white/20">
          <TrustBadge 
            icon={<ShieldCheck className="w-4 h-4 text-emerald-300" />} 
            label={isRu ? 'Проверенные продавцы' : 'Verified sellers'} 
          />
          <TrustBadge 
            icon={<Truck className="w-4 h-4 text-sky-300" />} 
            label={isRu ? `Бесплатно от ฿${freeDeliveryThreshold}` : `Free from ฿${freeDeliveryThreshold}`} 
          />
          <TrustBadge 
            icon={<Clock className="w-4 h-4 text-amber-300" />} 
            label={isRu ? 'Экспресс 45 мин' : '45 min express'} 
          />
        </div>
      </div>
    </div>
  );
}
