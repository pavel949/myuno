import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Waves, Pill, Car, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface QuickStat {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  value: string;
  path: string;
  color: string;
  bgColor: string;
}

const QUICK_STATS: QuickStat[] = [
  {
    id: 'exchange',
    icon: DollarSign,
    labelEn: 'Rate',
    labelRu: 'Курс',
    value: '฿34.5',
    path: '/exchange',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'beaches',
    icon: Waves,
    labelEn: 'Beach',
    labelRu: 'Пляж',
    value: '✓ Safe',
    path: '/beaches',
    color: 'text-sky-600',
    bgColor: 'bg-sky-500/10',
  },
  {
    id: 'pharmacy',
    icon: Pill,
    labelEn: 'Pharmacy',
    labelRu: 'Аптека',
    value: '24/7',
    path: '/pharmacy',
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
  },
  {
    id: 'taxi',
    icon: Car,
    labelEn: 'Taxi',
    labelRu: 'Такси',
    value: '~10 min',
    path: '/taxi',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
];

interface QuickStatChipProps {
  stat: QuickStat;
  isRu: boolean;
  onClick: () => void;
}

function QuickStatChipComponent({ stat, isRu, onClick }: QuickStatChipProps) {
  const Icon = stat.icon;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-background/80 border border-border/50",
        "hover:border-primary/30 hover:bg-background",
        "transition-all active:scale-95",
        "shrink-0"
      )}
    >
      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", stat.bgColor)}>
        <Icon className={cn("w-3 h-3", stat.color)} />
      </div>
      <span className="text-xs font-medium text-foreground whitespace-nowrap">
        {stat.value}
      </span>
    </button>
  );
}

const QuickStatChip = memo(QuickStatChipComponent);

export const QuickStatsRibbon = memo(function QuickStatsRibbon() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = (path: string) => {
    triggerHaptic('light');
    navigate(path);
  };

  return (
    <div 
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-3 px-3 pb-1"
      style={{ scrollSnapType: 'x mandatory' }}
    >
      {QUICK_STATS.map((stat) => (
        <div key={stat.id} style={{ scrollSnapAlign: 'start' }}>
          <QuickStatChip
            stat={stat}
            isRu={isRu}
            onClick={() => handleClick(stat.path)}
          />
        </div>
      ))}
      
      {/* More indicator */}
      <div className="shrink-0 flex items-center text-muted-foreground pr-2">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
});
