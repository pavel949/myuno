 /**
  * TrustSignalsBadges - Unified trust indicators for Services and Market
  * Consistent with Klook/Airbnb professional standards
  */
 
 import React from 'react';
 import { Shield, Clock, CheckCircle, Award, Users } from 'lucide-react';
 import { Badge } from '@/components/ui/badge';
 import { cn } from '@/lib/utils';
 import { useLanguage } from '@/contexts/LanguageContext';
 
 interface TrustBadgeProps {
   type: 'verified' | 'insured' | 'fast-response' | 'guaranteed' | 'popular' | 'top-rated';
   value?: string | number;
   size?: 'sm' | 'md';
   className?: string;
 }
 
 const BADGE_CONFIG = {
   verified: {
     icon: Shield,
     labelEn: 'Verified',
     labelRu: 'Проверен',
     colorClass: 'bg-primary/10 text-primary border-primary/20',
   },
   insured: {
     icon: CheckCircle,
     labelEn: 'Insured',
     labelRu: 'Застрахован',
     colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
   },
   'fast-response': {
     icon: Clock,
     labelEn: 'Fast Response',
     labelRu: 'Быстрый ответ',
     colorClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
   },
   guaranteed: {
     icon: Award,
     labelEn: 'Guaranteed',
     labelRu: 'Гарантия',
     colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
   },
   popular: {
     icon: Users,
     labelEn: 'Popular',
     labelRu: 'Популярно',
     colorClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
   },
   'top-rated': {
     icon: Award,
     labelEn: 'Top Rated',
     labelRu: 'Топ рейтинг',
     colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
   },
 };
 
 export function TrustBadge({ type, value, size = 'sm', className }: TrustBadgeProps) {
   const { language } = useLanguage();
   const config = BADGE_CONFIG[type];
   const Icon = config.icon;
   const isRu = language === 'ru';
   
   const sizeClasses = {
     sm: 'text-[10px] px-1.5 py-0.5 gap-1',
     md: 'text-xs px-2 py-1 gap-1.5',
   };
 
   return (
     <Badge 
       variant="outline"
       className={cn(
         sizeClasses[size],
         config.colorClass,
         'font-medium border',
         className
       )}
     >
       <Icon className={cn(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5')} />
       {value || (isRu ? config.labelRu : config.labelEn)}
     </Badge>
   );
 }
 
 interface TrustSignalsRowProps {
   isVerified?: boolean;
   isInsured?: boolean;
   hasGuarantee?: boolean;
   responseTimeMinutes?: number;
   className?: string;
 }
 
 export function TrustSignalsRow({
   isVerified,
   isInsured,
   hasGuarantee,
   responseTimeMinutes,
   className,
 }: TrustSignalsRowProps) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
   
   const hasAnySignal = isVerified || isInsured || hasGuarantee || (responseTimeMinutes && responseTimeMinutes <= 30);
   
   if (!hasAnySignal) return null;
 
   return (
     <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
       {isVerified && <TrustBadge type="verified" />}
       {responseTimeMinutes && responseTimeMinutes <= 30 && (
         <TrustBadge type="fast-response" value={`${responseTimeMinutes}${isRu ? ' мин' : 'm'}`} />
       )}
       {isInsured && <TrustBadge type="insured" />}
       {hasGuarantee && <TrustBadge type="guaranteed" />}
     </div>
   );
 }
 
 interface SocialProofBadgeProps {
   count: number;
   type: 'bookings' | 'clients' | 'reviews';
   period?: 'today' | 'week' | 'month' | 'total';
   className?: string;
 }
 
 export function SocialProofBadge({ count, type, period = 'today', className }: SocialProofBadgeProps) {
   const { language } = useLanguage();
   const isRu = language === 'ru';
   
   const labels = {
     bookings: {
       today: isRu ? 'забронировали сегодня' : 'booked today',
       week: isRu ? 'бронирований за неделю' : 'bookings this week',
       month: isRu ? 'бронирований за месяц' : 'bookings this month',
       total: isRu ? 'бронирований' : 'bookings',
     },
     clients: {
       today: isRu ? 'клиентов сегодня' : 'clients today',
       week: isRu ? 'клиентов за неделю' : 'clients this week',
       month: isRu ? 'клиентов за месяц' : 'clients this month',
       total: isRu ? 'клиентов' : 'clients',
     },
     reviews: {
       today: isRu ? 'отзывов' : 'reviews',
       week: isRu ? 'отзывов' : 'reviews',
       month: isRu ? 'отзывов' : 'reviews',
       total: isRu ? 'отзывов' : 'reviews',
     },
   };
 
   return (
     <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
       <Users className="w-3 h-3" />
       <span className="text-[10px]">
         {count}+ {labels[type][period]}
       </span>
     </div>
   );
 }