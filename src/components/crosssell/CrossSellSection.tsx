import { pickLang } from '@/lib/i18n/pickLang';
import { memo } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCrossSellLinks } from '@/lib/crossSellConfig';
import { CrossSellCard } from './CrossSellCard';
import { ExploreVerticalsSheet } from '@/components/shared/ExploreVerticalsSheet';
import { cn } from '@/lib/utils';

interface CrossSellSectionProps {
  currentVertical: string;
  variant?: 'grid' | 'scroll';
  maxItems?: number;
  className?: string;
  title?: {
    en: string;
    ru: string;
    th?: string;
  };
}

export const CrossSellSection = memo(function CrossSellSection({
  currentVertical,
  variant = 'scroll',
  maxItems = 4,
  className,
  title,
}: CrossSellSectionProps) {
  const { language } = useLanguage();
  
  const links = getCrossSellLinks(currentVertical, maxItems);
  
  if (links.length === 0) return null;

  const sectionTitle = title || {
    en: 'You Might Also Like',
    ru: 'Вам также понравится',
    th: 'คุณอาจสนใจ',
  };

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">
            {pickLang(language, sectionTitle)}
          </h3>
        </div>
        <ExploreVerticalsSheet
          trigger={
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              {pickLang(language, { ru: 'Все', en: 'All', th: 'ทั้งหมด' })}
              <ChevronRight className="w-4 h-4" />
            </button>
          }
        />
      </div>

      <div className={cn(
        'gap-3',
        variant === 'scroll'
          ? 'flex snap-x snap-proximity overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible'
          : 'grid grid-cols-2 lg:grid-cols-4',
      )}>
        {links.map((link, index) => (
          <div key={link.id} className={cn('min-w-0', variant === 'scroll' && 'w-32 shrink-0 snap-start lg:w-auto')}>
            <CrossSellCard link={link} index={index} />
          </div>
        ))}
      </div>
    </section>
  );
});
