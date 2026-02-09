import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const links = getCrossSellLinks(currentVertical, maxItems);
  
  if (links.length === 0) return null;

  const sectionTitle = title || {
    en: 'You Might Also Like',
    ru: 'Вам также понравится',
  };

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-foreground">
            {language === 'ru' ? sectionTitle.ru : sectionTitle.en}
          </h3>
        </div>
        <ExploreVerticalsSheet
          trigger={
            <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
              {language === 'ru' ? 'Все' : 'All'}
              <ChevronRight className="w-4 h-4" />
            </button>
          }
        />
      </div>

      {variant === 'scroll' ? (
        <div className="flex gap-3 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 touch-pan-y snap-x snap-proximity">
          {links.map((link, index) => (
            <div key={link.id} className="w-[110px] flex-shrink-0 snap-start touch-manipulation">
              <CrossSellCard
                link={link}
                fromVertical={currentVertical}
                index={index}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {links.map((link, index) => (
            <CrossSellCard
              key={link.id}
              link={link}
              fromVertical={currentVertical}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
});
