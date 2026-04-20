import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { blendClusters } from '@/lib/roleBlend';

interface ClusterGridProps {
  personas: UserPersona[];
}

export function ClusterGrid({ personas }: ClusterGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const clusters = useMemo(() => blendClusters(personas), [personas]);

  return (
    <div className="px-4 pb-5">
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">
          {isRu ? 'Все сервисы' : 'All services'}
        </div>
        <div className="text-[11px] text-muted-foreground/50">
          {isRu ? '45 приложений · для вас' : '45 apps · ranked for you'}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {clusters.map(c => (
          <button
            key={c.id}
            onClick={() => navigate(c.route)}
            className="relative text-left rounded-[14px] bg-card border border-border p-[14px] pl-4 min-h-[86px] flex flex-col justify-between hover:border-border transition-colors active:scale-[0.98] overflow-hidden"
          >
            {/* 2px left spine */}
            <div
              className="absolute top-3.5 bottom-3.5 left-0 w-0.5 rounded-r-sm"
              style={{ background: c.accent }}
            />
            <div>
              <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold">
                {isRu ? 'Кластер' : 'Cluster'}
              </div>
              <div className="font-display text-[17px] font-semibold text-foreground mt-0.5 tracking-[-0.01em]">
                {isRu ? c.labelRu : c.labelEn}
              </div>
            </div>
            <div className="flex items-end justify-between mt-2 gap-2">
              <div className="text-[11px] text-muted-foreground leading-snug line-clamp-2 flex-1">
                {isRu ? c.subRu : c.sub}
              </div>
              <div className="font-mono text-[10.5px] font-medium shrink-0" style={{ color: c.accent }}>{c.items}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
