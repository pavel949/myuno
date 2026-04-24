/**
 * FlashServicesSection - Hot deals with urgency indicators
 * Klook-style flash deals for services
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useServices } from '@/hooks/useServices';
import { UnifiedScrollSection } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { IconBadge } from '@/components/ui/IconBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Flame, Clock, Zap, Star, ChevronRight, Users, TrendingUp } from 'lucide-react';

export function FlashServicesSection() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  
  // Get popular services as "flash deals" (sorted by rating)
  const { services, isLoading } = useServices({ 
    sortBy: 'rating',
    limit: 6,
  });

  // Countdown timer (mock - ends at midnight)
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-3 space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[160px] h-[180px] rounded-none shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!services?.length) return null;

  return (
    <section className="py-3">
      {/* Header with countdown */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center animate-pulse">
              <Flame className="w-4 h-4 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">
                {isRu ? 'Горящие предложения' : 'Hot Deals'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{isRu ? 'Заканчивается через' : 'Ends in'}</span>
                <span className="font-mono font-bold text-destructive">{timeLeft}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/services?hot=true')}
            className="text-xs text-primary font-medium flex items-center gap-0.5"
          >
            {isRu ? 'Все' : 'All'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable cards */}
      <UnifiedScrollSection className="py-0">
        {services.slice(0, 6).map((service, idx) => (
          <FlashServiceCard 
            key={service.id} 
            service={service} 
            index={idx}
            onClick={() => navigate(`/services/provider/${service.id}`)}
          />
        ))}
      </UnifiedScrollSection>
    </section>
  );
}

interface FlashServiceCardProps {
  service: any;
  index: number;
  onClick: () => void;
}

function FlashServiceCard({ service, index, onClick }: FlashServiceCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  // Mock discount for demo (in real app, this comes from DB)
  const discountPercent = [25, 30, 15, 20, 35, 10][index % 6];
  const originalPrice = service.price ? Math.round(service.price * (100 / (100 - discountPercent))) : null;
  
  // Mock social proof data (in real app, from DB)
  const bookingsToday = [12, 8, 15, 6, 22, 9][index % 6];
  const spotsLeft = [3, 5, 2, 7, 1, 4][index % 6];
  const progressPercent = 100 - (spotsLeft * 10);
  
  // Urgency badge variations
  const urgencyBadges = [
    { label: isRu ? 'Последние места' : 'Last spots', color: 'bg-destructive' },
    { label: isRu ? 'Популярно' : 'Popular', color: 'bg-primary' },
    { label: isRu ? 'Выбор дня' : "Today's pick", color: 'bg-secondary text-secondary-foreground' },
  ];
  const urgency = urgencyBadges[index % 3];

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-[160px] shrink-0 snap-start",
        "rounded-none overflow-hidden bg-card border border-border/50",
        "hover:shadow-lg transition-all duration-200",
        "text-left group"
      )}
    >
      {/* Image */}
      <div className="relative h-[100px] bg-muted overflow-hidden">
        {service.images?.[0] || service.image ? (
          <img 
            src={service.images?.[0] || service.image} 
            alt={service.name_en}
            className="w-full h-full object-cover transition-transform duration-300"
          />
        ) : (
           <div className="w-full h-full bg-muted flex items-center justify-center">
            <IconBadge icon="Sparkles" size="lg" variant="muted" />
          </div>
        )}
        
        {/* Discount badge */}
        <Badge 
          className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5"
        >
          -{discountPercent}%
        </Badge>
        
        {/* Urgency badge */}
        <Badge 
          className={cn(
            "absolute bottom-2 left-2 text-white text-[9px] font-medium px-1.5 py-0.5",
            urgency.color
          )}
        >
          <Zap className="w-2.5 h-2.5 mr-0.5" />
          {urgency.label}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground">
          {isRu ? service.name_ru || service.name_en : service.name_en}
        </h3>
        
        {/* Social proof: Bookings today */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="w-3 h-3" />
          <span className="text-[10px]">
            {bookingsToday} {isRu ? 'забронировали сегодня' : 'booked today'}
          </span>
        </div>
        
        {/* Availability progress bar */}
        <div className="space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {spotsLeft} {isRu ? 'мест осталось' : 'spots left'}
            </span>
            {service.rating && (
            <div className="flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="text-[10px] font-medium">{service.rating}</span>
            </div>
            )}
          </div>
          <Progress 
            value={progressPercent} 
            className="h-1.5 bg-muted"
          />
        </div>
        
        {/* Price */}
        {service.price && (
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="font-bold text-primary">
              ฿{service.price.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ฿{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
