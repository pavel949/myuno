/**
 * IconGrid — dense 4-col (mobile) / 6-col (≥sm) grid of AppTile items.
 * Optional civic header (mono uppercase title + counter + "see all").
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { FlatService } from '@/lib/catalog/taxonomy';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppTile } from './AppTile';

export interface IconGridProps {
  title?: string;
  caption?: string;
  count?: number;
  seeAllHref?: string;
  services: FlatService[];
  /** When true, render the category label as the per-tile caption */
  showCategoryCaption?: boolean;
}

export const IconGrid: React.FC<IconGridProps> = ({
  title,
  caption,
  count,
  seeAllHref,
  services,
  showCategoryCaption,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';

  if (services.length === 0) return null;

  return (
    <section className="px-4 mt-6">
      {(title || count !== undefined) && (
        <header className="flex items-baseline justify-between gap-3 mb-3">
          <div className="min-w-0">
            {title && (
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {title}
                {typeof count === 'number' && (
                  <span className="ml-2 tabular-nums text-foreground/70">{count}</span>
                )}
              </h2>
            )}
            {caption && (
              <p className="mt-1 text-[12px] text-muted-foreground leading-snug">{caption}</p>
            )}
          </div>
          {seeAllHref && (
            <Link
              to={seeAllHref}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              {isRu ? 'Все' : isTh ? 'ทั้งหมด' : 'All'}
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          )}
        </header>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-x-1 gap-y-3">
        {services.map((svc) => (
          <AppTile
            key={svc.id}
            to={svc.path}
            icon={svc.icon}
            label={isRu ? svc.labelRu : svc.labelEn}
            caption={showCategoryCaption ? (isRu ? svc.categoryLabelRu : svc.categoryLabelEn) : undefined}
            status={svc.status}
          />
        ))}
      </div>
    </section>
  );
};

export default IconGrid;
