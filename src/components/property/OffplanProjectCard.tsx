/**
 * OffplanProjectCard - Premium card for off-plan property projects
 * Shows construction status, developer, muUNO score, pricing, ROI
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  Sparkles,
  HardHat,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Heart,
} from 'lucide-react';
import { useUserCollections } from '@/hooks/useUserCollections';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { DeveloperBadge } from './DeveloperBadge';
import { MuunoScoreWidget } from '@/components/invest/MuunoScoreWidget';
import type { OffplanProject, ProjectStatus } from '@/hooks/useOffplanProjects';
import { surfaceFromOffplanProject } from '@/lib/real-estate/listingViewModel';

interface OffplanProjectCardProps {
  project: OffplanProject;
  className?: string;
  variant?: 'carousel' | 'grid';
}

const STATUS_CONFIG: Record<ProjectStatus, { 
  label: { en: string; ru: string }; 
  icon: React.ElementType;
  color: string;
}> = {
  offplan: {
    label: { en: 'Off-Plan', ru: 'Новостройка' },
    icon: Building2,
    color: 'bg-primary/10 text-primary border-primary/30',
  },
  under_construction: {
    label: { en: 'Under Construction', ru: 'Строится' },
    icon: HardHat,
    color: 'bg-accent/10 text-accent-foreground border-accent/30',
  },
  completed: {
    label: { en: 'Completed', ru: 'Готово' },
    icon: CheckCircle2,
    color: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  },
};

export function OffplanProjectCard({ 
  project, 
  className,
  variant = 'carousel'
}: OffplanProjectCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { isInCollection, toggleCollection } = useUserCollections();
  const isFav = isInCollection('newbuild_project', project.id);

  const surface = useMemo(() => surfaceFromOffplanProject(project), [project]);
  const name = isRu ? surface.titleRu : surface.titleEn;
  const status = STATUS_CONFIG[project.projectStatus];
  const StatusIcon = status.icon;

  const handleClick = () => {
    navigate(surface.href);
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error(isRu ? 'Войдите, чтобы добавить в избранное' : 'Sign in to favourite');
      navigate('/auth');
      return;
    }
    await toggleCollection('newbuild_project', project.id, {
      name: isRu ? surface.titleRu : surface.titleEn,
      name_en: surface.titleEn,
      name_ru: surface.titleRu,
      cover_image: project.coverImage ?? undefined,
      district: project.district ?? undefined,
      price: project.priceFrom ?? undefined,
      currency: 'THB',
    });
  };

  // Format completion date
  const formatCompletionDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const quarter = Math.ceil((d.getMonth() + 1) / 3);
    return `Q${quarter} ${d.getFullYear()}`;
  };

  const isCarousel = variant === 'carousel';

  return (
    <div
      data-catalog-kind={surface.kind}
      data-listing-id={surface.id}
      onClick={handleClick}
      className={cn(
        "group cursor-pointer rounded-none overflow-hidden",
        "bg-card border border-border/50 shadow-sm",
        "hover:shadow-lg transition-all duration-300",
        isCarousel ? "flex-shrink-0 w-[280px] sm:w-[300px]" : "w-full",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 "
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[70%]">
          <Badge className={cn("gap-1 text-xs border", status.color)}>
            <StatusIcon className="w-3 h-3" />
            {isRu ? status.label.ru : status.label.en}
          </Badge>

          {/* ClearView recommendation badge (BUY / WATCH / AVOID) */}
          {project.isClearviewRated && project.offplanCatalog?.rec && (
            <Badge
              className={cn(
                "text-[11px] font-bold border-0 tracking-wide",
                project.offplanCatalog.rec === 'BUY' && 'bg-success text-success-foreground',
                project.offplanCatalog.rec === 'WATCH' && 'bg-warning text-warning-foreground',
                project.offplanCatalog.rec === 'AVOID' && 'bg-destructive text-destructive-foreground',
              )}
              title={isRu ? 'Рекомендация ClearView V3' : 'ClearView V3 recommendation'}
            >
              {project.offplanCatalog.rec}
            </Badge>
          )}

          {/* Brokered / not ClearView-rated */}
          {!project.isClearviewRated && (
            <Badge variant="outline" className="text-[10px] bg-background/80 border-warning/40 text-warning">
              {isRu ? 'Не оценён ClearView' : 'Not ClearView rated'}
            </Badge>
          )}

          {project.isFeatured && (
            <Badge className="bg-primary text-primary-foreground border-0 gap-1">
              <Sparkles className="w-3 h-3" />
              {isRu ? 'Топ' : 'Hot'}
            </Badge>
          )}
        </div>

        {/* muUNO Score badge — show only score dots, no risk label or numeric value on public cards */}
        {project.isClearviewRated && project.muunoScore && (
          <div className="absolute top-3 right-3">
            <MuunoScoreWidget score={project.muunoScore} size="sm" showRisk={false} showLabel={false} showScore={false} />
          </div>
        )}

        {/* Favorite (alerts on new units) */}
        <button
          type="button"
          aria-label={isRu ? 'Добавить в избранное' : 'Add to favourites'}
          onClick={handleFav}
          className={cn(
            'absolute right-3 flex items-center justify-center w-8 h-8 rounded-full',
            'bg-background/80 backdrop-blur border border-border/50 shadow-sm',
            'hover:bg-background transition-colors',
            project.isClearviewRated && project.muunoScore ? 'top-14' : 'top-3'
          )}
        >
          <Heart
            className={cn('w-4 h-4', isFav ? 'fill-destructive text-destructive' : 'text-foreground/70')}
          />
        </button>

        {project.projectStatus !== 'completed' && project.constructionProgress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center justify-between text-xs text-primary-foreground mb-1">
              <span>{isRu ? 'Прогресс' : 'Progress'}</span>
              <span className="font-semibold">{project.constructionProgress}%</span>
            </div>
            <Progress 
              value={project.constructionProgress} 
              className="h-1.5 bg-white/20"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Location + Developer */}
        <div className="flex items-center justify-between gap-2">
          {project.district && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{project.district}</span>
            </div>
          )}
          
          <DeveloperBadge
            developerId={project.developerId}
            developerName={project.developerName}
            developerLogo={project.developerLogo}
            isVerified={project.developerVerified}
            size="sm"
          />
        </div>

        {/* Price */}
        {project.priceFrom && (
          <p className="text-base">
            <span className="text-muted-foreground text-sm">{isRu ? 'от' : 'from'} </span>
            <span className="font-bold text-primary">
              {formatPrice(project.priceFrom)}
            </span>
          </p>
        )}

        {/* Due Diligence status */}
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-medium",
          project.riskLevel 
            ? "bg-success/10 text-success" 
            : "bg-warning/10 text-warning"
        )}>
          {project.riskLevel ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              {isRu ? 'Due Diligence пройден' : 'Due Diligence Complete'}
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              {isRu ? 'Запросить оценку рисков' : 'Request Risk Assessment'}
            </>
          )}
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {/* ROI */}
          {project.roiProjected && (
            <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span className="font-medium">{project.roiProjected}% ROI</span>
            </div>
          )}

          {/* Completion date */}
          {project.completionDate && project.projectStatus !== 'completed' && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatCompletionDate(project.completionDate)}</span>
            </div>
          )}

          {/* Units available */}
          {project.unitsAvailable > 0 && (
            <div className="text-xs text-muted-foreground ml-auto">
              {project.unitsAvailable} {isRu ? 'доступно' : 'units'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OffplanProjectCard;
