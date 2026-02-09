import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Compass } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VERTICALS } from '@/lib/verticals';
import { IconBadge } from '@/components/ui/IconBadge';
import { ExploreVerticalsSheet } from './ExploreVerticalsSheet';
import { cn } from '@/lib/utils';

const PREVIEW_VERTICALS = [
  VERTICALS.YACHT,
  VERTICALS.EXPERIENCE,
  VERTICALS.RESTAURANT,
  VERTICALS.BEAUTY,
  VERTICALS.MEDICAL,
  VERTICALS.TRANSFER,
];

const MINI_GRADIENTS: Record<string, string> = {
  yacht: 'from-blue-500 to-cyan-400',
  experience: 'from-purple-500 to-indigo-400',
  restaurant: 'from-rose-500 to-pink-400',
  beauty: 'from-pink-500 to-purple-400',
  medical: 'from-teal-500 to-emerald-400',
  transfer: 'from-indigo-500 to-blue-400',
};

interface ExploreMoreBannerProps {
  className?: string;
}

export const ExploreMoreBanner = memo(function ExploreMoreBanner({
  className,
}: ExploreMoreBannerProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  return (
    <section className={cn('py-6', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">
            {language === 'ru' ? 'Ещё услуги' : 'Explore More'}
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

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 touch-pan-y snap-x snap-proximity pb-1">
        {PREVIEW_VERTICALS.map((v) => (
          <button
            key={v.id}
            onClick={() => navigate(`/${v.plural}`)}
            className={cn(
              'flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px]',
              'touch-manipulation active:scale-95 transition-transform'
            )}
          >
            <IconBadge
              icon={v.icon}
              size="lg"
              variant="gradient"
              gradient={MINI_GRADIENTS[v.id] || 'from-primary to-accent'}
              className="shadow-sm"
            />
            <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-1">
              {language === 'ru' ? v.labelRu : v.labelEn}
            </span>
          </button>
        ))}

        {/* "All" trailing button */}
        <ExploreVerticalsSheet
          trigger={
            <button className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px] touch-manipulation active:scale-95 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shadow-sm">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {language === 'ru' ? 'Все' : 'All'}
              </span>
            </button>
          }
        />
      </div>
    </section>
  );
});
