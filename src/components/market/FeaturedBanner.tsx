import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Truck, Clock, Shield, Sparkles, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeaturedBannerProps {
  freeDeliveryThreshold?: number | null;
  estimatedTime?: number;
  productCount: number;
  vendorCount: number;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({
  freeDeliveryThreshold,
  estimatedTime,
  productCount,
  vendorCount,
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-none bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5 text-primary-foreground">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Top badges */}
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-white/20 border-0 text-white text-xs font-medium">
            <Sparkles className="w-3 h-3 mr-1" />
            {language === 'ru' ? 'Пхукет' : 'Phuket'}
          </Badge>
          <Badge className="bg-white/20 border-0 text-white text-xs">
            <Plane className="w-3 h-3 mr-1" />
            {language === 'ru' ? '+Доставка домой' : '+Ship Home'}
          </Badge>
        </div>

        {/* Main title */}
        <h1 className="text-2xl font-bold mb-1">
          {language === 'ru' ? 'myUNO Market' : 'myUNO Market'}
        </h1>
        <p className="text-white/80 text-sm mb-4">
          {language === 'ru' 
            ? 'Продукты, товары и тайские деликатесы' 
            : 'Fresh food, goods & Thai delicacies'}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold">{productCount}+</div>
            <div className="text-[10px] text-white/70 uppercase tracking-wide">
              {language === 'ru' ? 'товаров' : 'Products'}
            </div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-xl font-bold">{vendorCount}</div>
            <div className="text-[10px] text-white/70 uppercase tracking-wide">
              {language === 'ru' ? 'продавцов' : 'Vendors'}
            </div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="text-center">
            <div className="text-xl font-bold">12</div>
            <div className="text-[10px] text-white/70 uppercase tracking-wide">
              {language === 'ru' ? 'категорий' : 'Categories'}
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {freeDeliveryThreshold && (
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
              <Truck className="w-3.5 h-3.5" />
              {language === 'ru' ? `Бесплатно от ฿${freeDeliveryThreshold}` : `Free from ฿${freeDeliveryThreshold}`}
            </div>
          )}
          {estimatedTime && (
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              {estimatedTime} {language === 'ru' ? 'мин' : 'min'}
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
            <Shield className="w-3.5 h-3.5" />
            {language === 'ru' ? 'Гарантия' : 'Guarantee'}
          </div>
        </div>
      </div>
    </div>
  );
};
