import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, TrendingUp, Clock, Flame, Star, BadgeCheck } from 'lucide-react';
import { MuunoScoreWidget } from './MuunoScoreWidget';
import { FundingProgress } from './FundingProgress';
import { Badge } from '@/components/ui/badge';
import { INVESTMENT_CATEGORIES } from '@/hooks/useInvestmentProjects';
import type { InvestmentProject } from '@/hooks/useInvestmentProjects';

interface InvestmentCardProps {
  project: InvestmentProject;
  variant?: 'default' | 'compact' | 'horizontal';
  showProgress?: boolean;
  className?: string;
}

export function InvestmentCard({
  project,
  variant = 'default',
  showProgress = true,
  className,
}: InvestmentCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const title = isRu ? project.title_ru : project.title_en;
  const category = INVESTMENT_CATEGORIES.find(c => c.key === project.project_type);
  const categoryLabel = category 
    ? (isRu ? category.ru : category.en)
    : project.project_type;
  const categoryIcon = category?.icon || '💼';

  const handleClick = () => {
    navigate(`/property/invest/${project.id}`);
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group flex-shrink-0 w-[280px] cursor-pointer',
          'bg-card rounded-xl border border-border/50',
          'hover:shadow-lg hover:border-primary/30 transition-all',
          'overflow-hidden',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <span className="text-4xl">{categoryIcon}</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {project.is_hot && (
              <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">
                <Flame className="h-3 w-3 mr-0.5" />
                HOT
              </Badge>
            )}
            {project.is_featured && !project.is_hot && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
                <Star className="h-3 w-3 mr-0.5" />
                Featured
              </Badge>
            )}
          </div>

          {/* Category */}
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur-sm">
              {categoryIcon} {categoryLabel}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">
                {title}
                {project.is_verified && (
                  <BadgeCheck className="inline-block h-3.5 w-3.5 ml-1 text-primary" />
                )}
              </h3>
              {project.district && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {project.district}
                </div>
              )}
            </div>
            
            {/* Score */}
            <MuunoScoreWidget
              score={project.muuno_score}
              size="sm"
              showLabel={false}
              showRisk={false}
            />
          </div>

          {/* Key metrics */}
          <div className="flex items-center gap-3 text-xs">
            {project.roi_projected && (
              <div className="flex items-center gap-1 text-emerald-600">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">ROI {project.roi_projected}%</span>
              </div>
            )}
            {project.investment_term_months && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{project.investment_term_months} {isRu ? 'мес' : 'mo'}</span>
              </div>
            )}
          </div>

          {/* Min investment */}
          {project.min_investment && (
            <div className="text-xs text-muted-foreground">
              {isRu ? 'от' : 'from'}{' '}
              <span className="font-semibold text-foreground">
                ${project.min_investment >= 1000 ? `${Math.round(project.min_investment / 1000)}K` : project.min_investment}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      className={cn(
        'group cursor-pointer',
        'bg-card rounded-xl border border-border/50',
        'hover:shadow-xl hover:border-primary/30 transition-all duration-300',
        'overflow-hidden',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-5xl">{categoryIcon}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {project.is_hot && (
            <Badge className="bg-orange-500 text-white">
              <Flame className="h-3.5 w-3.5 mr-1" />
              HOT DEAL
            </Badge>
          )}
          {project.is_featured && !project.is_hot && (
            <Badge className="bg-primary text-primary-foreground">
              <Star className="h-3.5 w-3.5 mr-1" />
              Featured
            </Badge>
          )}
          {project.is_verified && (
            <Badge variant="secondary" className="bg-background/90">
              <BadgeCheck className="h-3.5 w-3.5 mr-1 text-primary" />
              Verified
            </Badge>
          )}
        </div>

        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {categoryIcon} {categoryLabel}
          </Badge>
        </div>

        {/* Score widget */}
        <div className="absolute top-3 right-3">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2">
            <MuunoScoreWidget
              score={project.muuno_score}
              size="sm"
              showRisk={false}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg line-clamp-1">{title}</h3>
          {project.district && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              {project.district}, Phuket
            </div>
          )}
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">
              {project.roi_projected ? `${project.roi_projected}%` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Годовой ROI' : 'Annual ROI'}
            </div>
          </div>
          <div className="text-center border-x border-border/50">
            <div className="text-lg font-bold">
              {project.investment_term_months ? `${project.investment_term_months}` : '—'}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Месяцев' : 'Months'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {project.min_investment 
                ? (project.min_investment >= 1000 
                    ? `$${Math.round(project.min_investment / 1000)}K` 
                    : `$${project.min_investment}`)
                : '—'
              }
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              {isRu ? 'Мин. вход' : 'Min Entry'}
            </div>
          </div>
        </div>

        {/* Funding progress */}
        {showProgress && project.funding_goal && (
          <FundingProgress
            fundingGoal={project.funding_goal}
            amountRaised={project.amount_raised}
            investorsCount={project.investors_count}
            currency={project.currency}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
