import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Clock, Ban, DollarSign, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CANCELLATION_POLICY_DETAILS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format, addHours } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CancellationPolicySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const POLICY_ICONS: Record<string, React.ElementType> = {
  flexible: Check,
  moderate: Clock,
  strict: AlertTriangle,
  super_strict: Ban,
  non_refundable: DollarSign,
};

export function CancellationPolicySelector({
  value,
  onChange,
  className,
}: CancellationPolicySelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const policies = Object.entries(CANCELLATION_POLICY_DETAILS).map(([key, policy]) => ({
    key,
    ...policy,
  }));

  const selectedPolicy = CANCELLATION_POLICY_DETAILS[value as keyof typeof CANCELLATION_POLICY_DETAILS] 
    || CANCELLATION_POLICY_DETAILS.flexible;

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      green: {
        bg: isSelected ? 'bg-success/20' : 'bg-success/5',
        border: isSelected ? 'border-success' : 'border-success/30',
        text: 'text-success',
      },
      yellow: {
        bg: isSelected ? 'bg-warning/20' : 'bg-warning/5',
        border: isSelected ? 'border-warning' : 'border-warning/30',
        text: 'text-warning',
      },
      orange: {
        bg: isSelected ? 'bg-warning/20' : 'bg-warning/5',
        border: isSelected ? 'border-warning' : 'border-warning/30',
        text: 'text-warning',
      },
      red: {
        bg: isSelected ? 'bg-destructive/20' : 'bg-destructive/5',
        border: isSelected ? 'border-destructive' : 'border-destructive/30',
        text: 'text-destructive',
      },
      destructive: {
        bg: isSelected ? 'bg-destructive/20' : 'bg-destructive/5',
        border: isSelected ? 'border-destructive' : 'border-destructive/30',
        text: 'text-destructive',
      },
    };
    return colorMap[color] || colorMap.green;
  };

  // Generate example dates for preview
  const exampleCheckIn = addHours(new Date(), 168); // 7 days from now
  const getRefundDeadline = (hoursBeforeCheckIn: number) => {
    return addHours(exampleCheckIn, -hoursBeforeCheckIn);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">
          {isRu ? 'Политика отмены' : 'Cancellation Policy'}
        </h4>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {isRu ? 'Превью гостя' : 'Guest Preview'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isRu ? 'Так увидит гость' : 'Guest View'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Selected policy preview */}
              <div className={cn(
                "p-4 rounded-xl border-2",
                getColorClasses(selectedPolicy.color, true).bg,
                getColorClasses(selectedPolicy.color, true).border
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={getColorClasses(selectedPolicy.color, true).text}>
                    {isRu ? selectedPolicy.nameRu : selectedPolicy.nameEn}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRu ? selectedPolicy.descRu : selectedPolicy.descEn}
                </p>
              </div>

              {/* Timeline example */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium">
                  {isRu ? 'Пример для заезда' : 'Example for check-in'}{' '}
                  {format(exampleCheckIn, 'dd MMM yyyy', { locale: isRu ? ru : undefined })}:
                </h5>
                <div className="space-y-2 text-sm">
                  {selectedPolicy.fullRefundHours > 0 && (
                    <div className="flex items-center gap-2 text-success">
                      <Check className="w-4 h-4" />
                      <span>
                        {isRu ? 'Полный возврат до' : 'Full refund until'}{' '}
                        {format(getRefundDeadline(selectedPolicy.fullRefundHours), 'dd MMM, HH:mm', { locale: isRu ? ru : undefined })}
                      </span>
                    </div>
                  )}
                  {selectedPolicy.partialRefundPercent > 0 && (
                    <div className="flex items-center gap-2 text-warning">
                      <Clock className="w-4 h-4" />
                      <span>
                        {selectedPolicy.partialRefundPercent}% {isRu ? 'возврат после' : 'refund after that'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {isRu ? '10% предоплата невозвратная' : '10% deposit is non-refundable'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discount badge for non-refundable */}
              {'discount' in selectedPolicy && selectedPolicy.discount && (
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">
                    {isRu 
                      ? `Скидка ${selectedPolicy.discount}% для гостя`
                      : `${selectedPolicy.discount}% discount for guest`}
                  </span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Policy cards grid */}
      <div className="grid gap-2">
        {policies.map((policy, index) => {
          const Icon = POLICY_ICONS[policy.key] || Check;
          const isSelected = value === policy.key;
          const colors = getColorClasses(policy.color, isSelected);

          return (
            <motion.button
              key={policy.key}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChange(policy.key)}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                colors.bg,
                colors.border,
                isSelected ? 'ring-2 ring-primary/20' : 'hover:border-primary/50'
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="policy-check"
                  className="absolute top-2 right-2"
                >
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                </motion.div>
              )}

              {/* Icon */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                colors.bg
              )}>
                <Icon className={cn("w-4 h-4", colors.text)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {isRu ? policy.nameRu : policy.nameEn}
                  </span>
                  {'discount' in policy && policy.discount && (
                    <Badge variant="secondary" className="text-xs">
                      -{policy.discount}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {isRu ? policy.descRu : policy.descEn}
                </p>
                {policy.fullRefundHours > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {policy.fullRefundHours >= 24 
                      ? `${Math.floor(policy.fullRefundHours / 24)} ${isRu ? 'дн.' : 'd'}`
                      : `${policy.fullRefundHours} ${isRu ? 'ч.' : 'h'}`
                    } {isRu ? 'до заезда' : 'before'}
                  </p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recommendation hint */}
      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          {isRu 
            ? 'Гибкая политика привлекает больше гостей, но строгая защищает от отмен в последний момент.'
            : 'Flexible policy attracts more guests, but strict protects from last-minute cancellations.'}
        </p>
      </div>
    </div>
  );
}
