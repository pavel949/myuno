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
     labelTh: 'ยืนยันแล้ว',
      colorClass: 'bg-primary/10 text-primary border-primary/20',
    },
    insured: {
      icon: CheckCircle,
      labelEn: 'Insured',
      labelRu: 'Застрахован',
      labelTh: 'มีประกัน',
      colorClass: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20',
    },
    'fast-response': {
      icon: Clock,
      labelEn: 'Fast Response',
      labelRu: 'Быстрый ответ',
      labelTh: 'ตอบกลับเร็ว',
      colorClass: 'bg-[hsl(var(--info))]/10 text-[hsl(var(--info))] border-[hsl(var(--info))]/20',
    },
    guaranteed: {
      icon: Award,
      labelEn: 'Guaranteed',
      labelRu: 'Гарантия',
      labelTh: 'รับประกัน',
      colorClass: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20',
    },
    popular: {
      icon: Users,
      labelEn: 'Popular',
      labelRu: 'Популярно',
      labelTh: 'ยอดนิยม',
      colorClass: 'bg-[hsl(var(--accent-purple))]/10 text-[hsl(var(--accent-purple))] border-[hsl(var(--accent-purple))]/20',
    },
    'top-rated': {
      icon: Award,
      labelEn: 'Top Rated',
      labelRu: 'Топ рейтинг',
      labelTh: 'คะแนนสูงสุด',
      colorClass: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/20',
    },
 };
 
 export function TrustBadge({ type, value, size = 'sm', className }: TrustBadgeProps) {
   const { language } = useLanguage();
   const config = BADGE_CONFIG[type];
   const Icon = config.icon;
   const label = language === 'ru' ? config.labelRu : language === 'th' ? config.labelTh : config.labelEn;

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
       {value || label}
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
   const minutesSuffix = language === 'ru' ? ' мин' : language === 'th' ? ' นาที' : 'm';

   const hasAnySignal = isVerified || isInsured || hasGuarantee || (responseTimeMinutes && responseTimeMinutes <= 30);
   
   if (!hasAnySignal) return null;
 
   return (
     <div className={cn('flex items-center gap-1.5 flex-wrap', className)}>
       {isVerified && <TrustBadge type="verified" />}
       {responseTimeMinutes && responseTimeMinutes <= 30 && (
         <TrustBadge type="fast-response" value={`${responseTimeMinutes}${minutesSuffix}`} />
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
   const tr = (ru: string, en: string, th: string) =>
     language === 'ru' ? ru : language === 'th' ? th : en;

   const labels = {
     bookings: {
       today: tr('забронировали сегодня', 'booked today', 'จองวันนี้'),
       week: tr('бронирований за неделю', 'bookings this week', 'การจองสัปดาห์นี้'),
       month: tr('бронирований за месяц', 'bookings this month', 'การจองเดือนนี้'),
       total: tr('бронирований', 'bookings', 'การจอง'),
     },
     clients: {
       today: tr('клиентов сегодня', 'clients today', 'ลูกค้าวันนี้'),
       week: tr('клиентов за неделю', 'clients this week', 'ลูกค้าสัปดาห์นี้'),
       month: tr('клиентов за месяц', 'clients this month', 'ลูกค้าเดือนนี้'),
       total: tr('клиентов', 'clients', 'ลูกค้า'),
     },
     reviews: {
       today: tr('отзывов', 'reviews', 'รีวิว'),
       week: tr('отзывов', 'reviews', 'รีวิว'),
       month: tr('отзывов', 'reviews', 'รีวิว'),
       total: tr('отзывов', 'reviews', 'รีวิว'),
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