import React, { useState } from 'react';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Truck, Clock, MapPin, Star, Shield, 
  Zap, ArrowRight, Box, ShoppingBag, FileText
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const deliveryTypes = [
  {
    id: 'express',
    icon: Zap,
    nameEn: 'Express Delivery',
    nameRu: 'Экспресс доставка',
    descEn: '1-2 hours',
    descRu: '1-2 часа',
    priceFrom: 150,
    color: 'from-orange-500 to-red-500',
    isPopular: true,
  },
  {
    id: 'same-day',
    icon: Clock,
    nameEn: 'Same Day',
    nameRu: 'В тот же день',
    descEn: 'Before 8 PM',
    descRu: 'До 20:00',
    priceFrom: 100,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'scheduled',
    icon: Package,
    nameEn: 'Scheduled',
    nameRu: 'По расписанию',
    descEn: 'Choose time',
    descRu: 'Выберите время',
    priceFrom: 80,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'freight',
    icon: Truck,
    nameEn: 'Large Items',
    nameRu: 'Крупногабарит',
    descEn: 'Furniture, etc.',
    descRu: 'Мебель и др.',
    priceFrom: 500,
    color: 'from-purple-500 to-violet-500',
  },
];

const popularServices = [
  {
    id: 'grocery',
    icon: ShoppingBag,
    nameEn: 'Grocery Pickup',
    nameRu: 'Продукты из магазина',
    descEn: 'We buy and deliver',
    descRu: 'Купим и доставим',
    image: PLACEHOLDER_IMAGES.grocery,
  },
  {
    id: 'documents',
    icon: FileText,
    nameEn: 'Document Delivery',
    nameRu: 'Доставка документов',
    descEn: 'Safe and fast',
    descRu: 'Безопасно и быстро',
    image: PLACEHOLDER_IMAGES.document,
  },
  {
    id: 'parcels',
    icon: Box,
    nameEn: 'Parcel Delivery',
    nameRu: 'Посылки',
    descEn: 'Any size packages',
    descRu: 'Посылки любого размера',
    image: PLACEHOLDER_IMAGES.delivery,
  },
];

const recentOrders = [
  {
    id: 'order-1',
    from: 'Central Festival',
    to: 'Patong Beach',
    status: 'delivered',
    statusEn: 'Delivered',
    statusRu: 'Доставлено',
    time: '45 min',
    price: 150,
  },
  {
    id: 'order-2',
    from: 'HomePro Phuket',
    to: 'Rawai',
    status: 'in_progress',
    statusEn: 'In Transit',
    statusRu: 'В пути',
    time: '~20 min',
    price: 200,
  },
];

export default function DeliveryIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'Доставка' : 'Delivery'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? 'Быстрая доставка по Пхукету' : 'Fast delivery across Phuket'}
        />

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-primary/20 p-6 mt-4 mb-6">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-6 h-6 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                {language === 'ru' ? 'Доставим что угодно' : 'We deliver anything'}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              {language === 'ru'
                ? 'От документов до крупногабаритных грузов'
                : 'From documents to large items'}
            </p>
          </div>
        </div>

        {/* Quick Order Button - leads to first delivery type */}
        <Button 
          className="w-full h-14 text-base gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          onClick={() => navigate('/delivery?type=express')}
        >
          <Zap className="w-5 h-5" />
          {language === 'ru' ? 'Заказать доставку' : 'Order Delivery'}
        </Button>

        {/* Delivery Types */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === 'ru' ? 'Тип доставки' : 'Delivery Type'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {deliveryTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => navigate(`/delivery?type=${type.id}`)}
                  className="relative bg-card rounded-2xl border border-border/50 p-4 text-left hover:border-primary/30 transition-all active:scale-[0.98]"
                >
                  {type.isPopular && (
                    <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px]">
                      {language === 'ru' ? 'ТОП' : 'HOT'}
                    </Badge>
                  )}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-3",
                    type.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">
                    {language === 'ru' ? type.nameRu : type.nameEn}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ru' ? type.descRu : type.descEn}
                  </p>
                  <p className="text-sm font-bold text-primary mt-2">
                    {language === 'ru' ? 'от' : 'from'} ฿{type.priceFrom}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Services */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {language === 'ru' ? 'Популярные услуги' : 'Popular Services'}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {popularServices.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.id}
                  onClick={() => navigate(`/delivery?service=${service.id}`)}
                  className="flex-shrink-0 w-40 bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="h-24 relative">
                    <img
                      src={service.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Icon className="absolute bottom-2 left-2 w-6 h-6 text-white" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate">
                      {language === 'ru' ? service.nameRu : service.nameEn}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {language === 'ru' ? service.descRu : service.descEn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">
                {language === 'ru' ? 'Недавние заказы' : 'Recent Orders'}
              </h2>
              <button className="text-sm text-primary flex items-center gap-1">
                {language === 'ru' ? 'Все' : 'All'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card rounded-xl border border-border/50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{order.from}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        <span className="truncate">{order.to}</span>
                      </div>
                    </div>
                    <Badge 
                      variant={order.status === 'delivered' ? 'default' : 'secondary'}
                      className={order.status === 'in_progress' ? 'bg-blue-500 text-white' : ''}
                    >
                      {language === 'ru' ? order.statusRu : order.statusEn}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{order.time}</span>
                    </div>
                    <span className="font-bold text-primary">฿{order.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">
                {language === 'ru' ? 'Гарантия' : 'Guarantee'}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">
              {language === 'ru' 
                ? 'Доставим вовремя или бесплатно' 
                : 'On-time or free delivery'}
            </h3>
            <p className="text-sm opacity-80">
              {language === 'ru'
                ? 'Мы гарантируем доставку в указанное время'
                : 'We guarantee delivery within the stated time'}
            </p>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
