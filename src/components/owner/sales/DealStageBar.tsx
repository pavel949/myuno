import { useLanguage } from '@/contexts/LanguageContext';
import { DEAL_STAGES, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { cn } from '@/lib/utils';

interface Props {
  currentStage: DealStage;
  onStageClick?: (stage: DealStage) => void;
}

const stageColors: Record<DealStage, string> = {
  new: 'bg-info',
  contacted: 'bg-info/80',
  showing: 'bg-warning',
  negotiation: 'bg-warning/80',
  contract: 'bg-primary',
  closed_won: 'bg-success',
  closed_lost: 'bg-destructive',
};

export function DealStageBar({ currentStage, onStageClick }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const currentIdx = DEAL_STAGES.indexOf(currentStage);

  return (
    <div className="flex gap-1">
      {DEAL_STAGES.filter(s => s !== 'closed_lost').map((stage, idx) => {
        const label = isRu ? DEAL_STAGE_LABELS[stage].ru : DEAL_STAGE_LABELS[stage].en;
        const shortLabel = isRu ? DEAL_STAGE_LABELS[stage].shortRu : DEAL_STAGE_LABELS[stage].short;
        const isActive = idx <= currentIdx && currentStage !== 'closed_lost';
        return (
          <button
            key={stage}
            onClick={() => onStageClick?.(stage)}
            disabled={!onStageClick}
            className={cn(
              'flex-1 py-2.5 text-[11px] font-medium rounded-none transition-all min-h-[44px] flex items-center justify-center',
              isActive ? `${stageColors[stage]} text-white` : 'bg-muted text-muted-foreground',
              onStageClick && 'cursor-pointer hover:opacity-80',
            )}
            title={label}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
