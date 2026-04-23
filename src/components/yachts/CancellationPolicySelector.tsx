import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancellationPolicy {
  id: string;
  code: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  full_refund_hours: number | null;
  partial_refund_hours: number | null;
  partial_refund_percent: number | null;
  no_refund_hours: number | null;
  sort_order: number;
}

interface CancellationPolicySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function formatHours(hours: number, isRu: boolean): string {
  if (hours < 24) {
    return isRu ? `${hours} ч` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return isRu ? `${days} дн` : `${days}d`;
}

export function CancellationPolicySelector({
  value,
  onChange,
  className,
}: CancellationPolicySelectorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { data: policies, isLoading } = useQuery({
    queryKey: ['cancellation-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cancellation_policies')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching cancellation policies:', error);
        return [];
      }

      return data as CancellationPolicy[];
    },
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!policies || policies.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        {isRu ? 'Политики отмены недоступны' : 'Cancellation policies not available'}
      </div>
    );
  }

  const getPolicyStyle = (code: string) => {
    switch (code) {
      case 'flexible':
        return {
          border: 'border-success/40 dark:border-success/40',
          bg: 'bg-success/10/50 dark:bg-success/20',
          badge: 'bg-success/10 text-success dark:bg-success/50 dark:text-success',
          icon: <CheckCircle className="h-4 w-4 text-success" />,
        };
      case 'moderate':
        return {
          border: 'border-primary/40 dark:border-primary/40',
          bg: 'bg-primary/10/50 dark:bg-primary/20',
          badge: 'bg-primary/10 text-primary dark:bg-primary/50 dark:text-primary',
          icon: <Clock className="h-4 w-4 text-primary" />,
        };
      case 'strict':
        return {
          border: 'border-accent/40 dark:border-accent/40',
          bg: 'bg-accent/10/50 dark:bg-accent/20',
          badge: 'bg-accent/10 text-accent dark:bg-accent/50 dark:text-accent',
          icon: <AlertCircle className="h-4 w-4 text-accent" />,
        };
      case 'super_strict':
        return {
          border: 'border-red-200 dark:border-red-800',
          bg: 'bg-red-50/50 dark:bg-red-950/20',
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        };
      default:
        return {
          border: 'border-border',
          bg: 'bg-muted/50',
          badge: 'bg-muted text-muted-foreground',
          icon: <Clock className="h-4 w-4" />,
        };
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">
        {isRu ? 'Политика отмены' : 'Cancellation Policy'}
      </Label>
      <p className="text-xs text-muted-foreground mb-3">
        {isRu
          ? 'Выберите политику возврата для гостей'
          : 'Choose a refund policy for guests'}
      </p>

      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        {policies.map((policy) => {
          const style = getPolicyStyle(policy.code);
          const isSelected = value === policy.code;

          return (
            <label
              key={policy.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-none border-2 cursor-pointer transition-all",
                style.border,
                isSelected ? style.bg : 'hover:bg-muted/30',
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <RadioGroupItem value={policy.code} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {style.icon}
                  <span className="font-medium">
                    {isRu ? policy.name_ru : policy.name_en}
                  </span>
                  {policy.code === 'moderate' && (
                    <Badge variant="secondary" className="text-[10px]">
                      {isRu ? 'Рекомендуется' : 'Recommended'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {isRu ? policy.description_ru : policy.description_en}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {policy.full_refund_hours && (
                    <Badge variant="outline" className={style.badge}>
                      {isRu ? '100% за' : '100% if'} {formatHours(policy.full_refund_hours, isRu)}
                    </Badge>
                  )}
                  {policy.partial_refund_hours && policy.partial_refund_percent && (
                    <Badge variant="outline" className={style.badge}>
                      {policy.partial_refund_percent}% {isRu ? 'за' : 'if'} {formatHours(policy.partial_refund_hours, isRu)}
                    </Badge>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
