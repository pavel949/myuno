import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Sparkles } from 'lucide-react';
import type { QualityArtifact } from '@/hooks/useListingQualityAnalysis';

interface AIQualityBadgeProps {
  artifact?: QualityArtifact | null;
  score?: number;
  verdict?: string;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  isRu?: boolean;
  onClick?: () => void;
}

export function AIQualityBadge({ 
  artifact, 
  score: propScore, 
  verdict: propVerdict,
  size = 'sm',
  showScore = true,
  isRu = false,
  onClick,
}: AIQualityBadgeProps) {
  const score = propScore ?? artifact?.primary_score ?? 0;
  const verdict = propVerdict ?? artifact?.verdict ?? 'review';
  const issues = artifact?.data?.issues || [];

  const getVerdictConfig = () => {
    switch (verdict) {
      case 'approve':
        return {
          icon: CheckCircle,
          color: 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20',
          label: isRu ? 'Хорошо' : 'Good',
        };
      case 'review':
        return {
          icon: HelpCircle,
          color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/20',
          label: isRu ? 'Проверить' : 'Review',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20',
          label: isRu ? 'Подозрительно' : 'Suspicious',
        };
      case 'reject_recommend':
        return {
          icon: XCircle,
          color: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
          label: isRu ? 'Проблемы' : 'Issues',
        };
      default:
        return {
          icon: Sparkles,
          color: 'bg-muted text-muted-foreground',
          label: isRu ? 'Нет данных' : 'No data',
        };
    }
  };

  const config = getVerdictConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  const tooltipContent = (
    <div className="space-y-1 max-w-xs">
      <div className="font-medium">
        {isRu ? 'Оценка качества AI' : 'AI Quality Score'}: {Math.round(score)}/100
      </div>
      {issues.length > 0 && (
        <div className="text-xs space-y-0.5">
          {criticalCount > 0 && (
            <div className="text-red-400">
              {criticalCount} {isRu ? 'критических' : 'critical'}
            </div>
          )}
          {warningCount > 0 && (
            <div className="text-yellow-400">
              {warningCount} {isRu ? 'предупреждений' : 'warnings'}
            </div>
          )}
        </div>
      )}
      {artifact?.is_reviewed && (
        <div className="text-xs text-muted-foreground">
          ✓ {isRu ? 'Проверено админом' : 'Reviewed by admin'}
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'cursor-pointer transition-colors gap-1',
              config.color,
              sizeClasses[size],
              onClick && 'cursor-pointer',
              artifact?.is_reviewed && 'opacity-60'
            )}
            onClick={onClick}
          >
            <Icon className={iconSizes[size]} />
            {showScore && <span>{Math.round(score)}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
