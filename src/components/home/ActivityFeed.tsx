import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { SectionHead } from './SectionHead';

interface ActivityFeedProps {
  personas: UserPersona[];
}

export function ActivityFeed({ personas }: ActivityFeedProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: feedItems = [], isLoading } = useActivityFeed();

  return (
    <div className="px-4 pb-5">
      <SectionHead
        title={isRu ? 'История событий' : 'Activity log'}
        meta={isRu ? 'За неделю · все роли' : 'This week · all roles'}
      />


      {isLoading ? (
        <div className="border-t border-border/[0.05]">
          {[1, 2, 3].map(i => (
            <div key={i} className="py-3 border-b border-border/[0.05] flex gap-3 items-start">
              <div className="w-[18px] h-[18px] rounded-full bg-muted/30 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-muted/30 animate-pulse rounded-none w-2/3" />
                <div className="h-2.5 bg-muted/20 animate-pulse rounded-none w-1/2" />
              </div>
              <div className="text-right space-y-1.5">
                <div className="h-3 bg-muted/30 animate-pulse rounded-none w-12" />
                <div className="h-2.5 bg-muted/20 animate-pulse rounded-none w-8" />
              </div>
            </div>
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <div className="border-t border-border/[0.05] py-8 text-center text-[12px] text-muted-foreground/40">
          {isRu ? 'Записей пока нет' : 'No entries yet'}
        </div>
      ) : (
        <div className="border-t border-border/[0.05]">
          {feedItems.map((item) => {
            const roleMeta = item.role ? ROLE_META[item.role] : ROLE_META[personas[0]];
            const roleColor = roleMeta?.color || 'hsl(var(--muted-foreground))';
            const roleGlyph = roleMeta?.glyph || '·';

            return (
              <div key={item.id} className="grid grid-cols-[auto_1fr_auto] gap-3 py-3 border-b border-border/[0.05] last:border-0 items-start">
                {/* Role glyph */}
                <div
                  className="w-[18px] h-[18px] rounded-full flex items-center justify-center font-display text-[9px] font-bold mt-0.5 flex-shrink-0"
                  style={{ background: `${roleColor}18`, border: `1px solid ${roleColor}33`, color: roleColor }}
                >
                  {roleGlyph}
                </div>
                {/* Content */}
                <div>
                  <div className="text-[13.5px] font-medium text-foreground leading-tight mb-0.5">{item.title}</div>
                  <div className="text-[12px] text-muted-foreground leading-snug">{item.detail}</div>
                </div>
                {/* Meta */}
                <div className="text-right">
                  <div className="font-mono text-[12px] font-medium text-foreground">{item.meta}</div>
                  <div className="text-[10.5px] text-muted-foreground/50 mt-0.5 tracking-[0.04em]">{item.when}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
