import React from 'react';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { useLanguage } from '@/contexts/LanguageContext';
import { ROLE_META, blendFeed, personaColor, type BlendedFeedItem } from '@/lib/roleBlend';

interface HomeActivityFeedProps {
  personas: UserPersona[];
}

/**
 * HomeActivityFeed — cross-role activity stream (mockup `screen.jsx · Feed`).
 *
 * Interleaves each active role's recent items via `blendFeed`, primary first,
 * and tags every row with its origin persona (colour glyph). Rows are seed data
 * (see `HOME_FEED_SEED`) and carry a quiet "demo" label so nothing reads as a
 * fake live event.
 */
export function HomeActivityFeed({ personas }: HomeActivityFeedProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const rows = blendFeed(personas);

  if (rows.length === 0) return null;

  return (
    <div className="px-4 pb-6">
      <div className="mb-2.5 flex items-baseline justify-between">
        <div className="text-label uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold">
          {isRu ? 'Активность' : 'Activity'}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {isRu ? 'Все роли · демо' : 'All roles · demo'}
        </div>
      </div>
      <div className="border-t border-border/[0.06]">
        {rows.map((row, i) => (
          <FeedRow key={`${row.persona}-${i}`} row={row} isRu={isRu} />
        ))}
      </div>
    </div>
  );
}

function FeedRow({ row, isRu }: { row: BlendedFeedItem; isRu: boolean }) {
  const meta = ROLE_META[row.persona];
  if (!meta) return null;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border/[0.06] py-2.5">
      <div
        className="mt-0.5 grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full font-display text-[9px] font-bold"
        style={{
          background: personaColor(row.persona, 0.09),
          border: `1px solid ${personaColor(row.persona, 0.2)}`,
          color: personaColor(row.persona),
        }}
        title={isRu ? meta.labelRu : meta.short}
      >
        {meta.glyph}
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium leading-snug text-foreground">
          {isRu ? row.titleRu : row.title}
        </div>
        <div className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
          {isRu ? row.detailRu : row.detail}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12px] font-medium text-foreground">
          {isRu ? row.metaRu : row.meta}
        </div>
        <div className="mt-0.5 text-[10.5px] tracking-[0.04em] text-muted-foreground/70">
          {isRu ? row.whenRu : row.when}
        </div>
      </div>
    </div>
  );
}
