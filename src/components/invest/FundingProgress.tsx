import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FundingProgressProps {
  fundingGoal: number | null;
  amountRaised: number | null;
  investorsCount?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  showInvestors?: boolean;
  className?: string;
}

export function FundingProgress({
  fundingGoal,
  amountRaised,
  investorsCount = 0,
  currency = 'USD',
  size = 'md',
  showInvestors = true,
  className,
}: FundingProgressProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!fundingGoal) return null;

  const raised = amountRaised || 0;
  const percentage = Math.min(Math.round((raised / fundingGoal) * 100), 100);
  const isFunded = percentage >= 100;

  const sizeStyles = {
    sm: {
      container: 'gap-1.5',
      progress: 'h-1.5',
      percentage: 'text-sm font-semibold',
      amounts: 'text-xs',
      investors: 'text-[10px]',
    },
    md: {
      container: 'gap-2',
      progress: 'h-2',
      percentage: 'text-base font-bold',
      amounts: 'text-sm',
      investors: 'text-xs',
    },
    lg: {
      container: 'gap-3',
      progress: 'h-3',
      percentage: 'text-xl font-bold',
      amounts: 'text-base',
      investors: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={cn('flex flex-col', styles.container, className)}>
      {/* Percentage */}
      <div className="flex items-baseline justify-between">
        <span className={cn(
          styles.percentage,
          isFunded ? 'text-success' : 'text-primary'
        )}>
          {percentage}%
          {isFunded && (
            <span className="ml-1 text-xs font-normal">
              {isRu ? 'Собрано!' : 'Funded!'}
            </span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <Progress 
        value={percentage} 
        className={cn(
          styles.progress,
          'bg-muted'
        )}
      />

      {/* Amounts */}
      <div className="flex items-center justify-between">
        <span className={cn(styles.amounts, 'text-foreground font-medium')}>
          ${raised >= 1000000 ? `${(raised / 1000000).toFixed(1)}M` : raised >= 1000 ? `${Math.round(raised / 1000)}K` : raised}
        </span>
        <span className={cn(styles.amounts, 'text-muted-foreground')}>
          / ${fundingGoal >= 1000000 ? `${(fundingGoal / 1000000).toFixed(1)}M` : fundingGoal >= 1000 ? `${Math.round(fundingGoal / 1000)}K` : fundingGoal}
        </span>
      </div>

      {/* Investors count */}
      {showInvestors && investorsCount > 0 && (
        <div className={cn(
          'flex items-center gap-1 text-muted-foreground',
          styles.investors
        )}>
          <Users className="h-3 w-3" />
          <span>
            {investorsCount} {isRu 
              ? (investorsCount === 1 ? 'инвестор' : 'инвесторов')
              : (investorsCount === 1 ? 'investor' : 'investors')
            }
          </span>
        </div>
      )}
    </div>
  );
}
