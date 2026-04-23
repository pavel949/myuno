import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Zap, Clock, Shield, Calendar, Users, BedDouble
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  PAYMENT_MODELS,
  KEY_HANDOVER_METHODS,
  DEPOSIT_TYPES,
  CLEANING_FREQUENCIES
} from '@/lib/taxonomies';
import { CANCELLATION_POLICY_DETAILS } from '@/lib/constants';

interface BookingConditionsChipsProps {
  // Booking terms
  instantBooking?: boolean;
  cancellationPolicy?: string;
  paymentModel?: string;
  depositType?: string;
  depositAmount?: number;
  minStayNights?: number;
  maxGuests?: number;
  keyHandover?: string;
  cleaningFrequency?: string;
  // Display options
  variant?: 'compact' | 'detailed' | 'card';
  maxChips?: number;
  className?: string;
}

/**
 * Reusable component to display booking conditions as chips
 * Used on property cards, detail pages, and booking flows
 */
export function BookingConditionsChips({
  instantBooking,
  cancellationPolicy,
  paymentModel = 'prepay_10',
  depositType,
  depositAmount,
  minStayNights,
  maxGuests,
  keyHandover,
  cleaningFrequency,
  variant = 'compact',
  maxChips,
  className,
}: BookingConditionsChipsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const chips: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    color?: 'default' | 'success' | 'warning' | 'info';
    priority: number;
  }> = [];

  // Instant booking - highest priority
  if (instantBooking) {
    chips.push({
      id: 'instant',
      label: isRu ? 'Мгновенное бронирование' : 'Instant Book',
      icon: <Zap className="h-3 w-3" />,
      color: 'success',
      priority: 1,
    });
  }

  // Cancellation policy
  if (cancellationPolicy) {
    const policy = CANCELLATION_POLICY_DETAILS[cancellationPolicy as keyof typeof CANCELLATION_POLICY_DETAILS];
    if (policy) {
      chips.push({
        id: 'cancel',
        label: isRu ? policy.nameRu : policy.nameEn,
        icon: <Shield className="h-3 w-3" />,
        color: policy.color === 'green' ? 'success' : policy.color === 'yellow' ? 'warning' : 'default',
        priority: 2,
      });
    }
  }

  // Payment model
  const payment = PAYMENT_MODELS.find(p => p.id === paymentModel);
  if (payment && paymentModel !== 'prepay_10') {
    chips.push({
      id: 'payment',
      label: isRu ? payment.labelRu : payment.labelEn,
      icon: <CreditCard className="h-3 w-3" />,
      color: 'info',
      priority: 3,
    });
  }

  // Deposit info
  if (depositAmount && depositAmount > 0) {
    chips.push({
      id: 'deposit',
      label: `${isRu ? 'Залог' : 'Deposit'} ฿${depositAmount.toLocaleString()}`,
      icon: <Shield className="h-3 w-3" />,
      priority: 4,
    });
  }

  // Min stay
  if (minStayNights && minStayNights > 1) {
    chips.push({
      id: 'minstay',
      label: `${minStayNights}+ ${isRu ? 'ночей' : 'nights'}`,
      icon: <Calendar className="h-3 w-3" />,
      priority: 5,
    });
  }

  // Max guests
  if (maxGuests) {
    chips.push({
      id: 'guests',
      label: `${maxGuests} ${isRu ? 'гостей' : 'guests'}`,
      icon: <Users className="h-3 w-3" />,
      priority: 6,
    });
  }

  // Key handover
  if (keyHandover) {
    const method = KEY_HANDOVER_METHODS.find(m => m.id === keyHandover);
    if (method) {
      chips.push({
        id: 'key',
        label: isRu ? method.labelRu : method.labelEn,
        icon: <Clock className="h-3 w-3" />,
        priority: 7,
      });
    }
  }

  // Cleaning
  if (cleaningFrequency) {
    const freq = CLEANING_FREQUENCIES.find(f => f.id === cleaningFrequency);
    if (freq) {
      chips.push({
        id: 'cleaning',
        label: isRu ? freq.labelRu : freq.labelEn,
        icon: <span className="text-xs">🧹</span>,
        priority: 8,
      });
    }
  }

  // Sort by priority and limit
  const sortedChips = chips.sort((a, b) => a.priority - b.priority);
  const displayChips = maxChips ? sortedChips.slice(0, maxChips) : sortedChips;
  const remaining = sortedChips.length - displayChips.length;

  if (displayChips.length === 0) return null;

  const getColorClass = (color?: string) => {
    switch (color) {
      case 'success':
        return 'bg-success/10 text-success border-success/20';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'info':
        return 'bg-info/10 text-info border-info/20';
      default:
        return '';
    }
  };

  if (variant === 'card') {
    return (
      <div className={cn("space-y-2", className)}>
        {displayChips.map(chip => (
          <div 
            key={chip.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-none border",
              getColorClass(chip.color) || "bg-muted/50"
            )}
          >
            {chip.icon}
            <span className="text-sm font-medium">{chip.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displayChips.map(chip => (
        <Badge
          key={chip.id}
          variant="outline"
          className={cn(
            "gap-1 text-xs py-0.5 px-2",
            variant === 'compact' && "text-[10px] py-0 px-1.5",
            getColorClass(chip.color)
          )}
        >
          {chip.icon}
          {chip.label}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
