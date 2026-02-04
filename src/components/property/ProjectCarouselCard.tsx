/**
 * ProjectCarouselCard - Compact visual card for horizontal carousel
 * Shows project image, name, district, rent/sale counts, and min price
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Home, DollarSign, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import type { ProjectWithStats } from '@/hooks/usePropertyProjectsWithStats';

interface ProjectCarouselCardProps {
  project: ProjectWithStats;
  className?: string;
}

export function ProjectCarouselCard({ project, className }: ProjectCarouselCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const name = isRu ? project.nameRu : project.nameEn;
  const hasProperties = project.rentCount > 0 || project.saleCount > 0;

  const handleClick = () => {
    // Navigate to complexes page with highlight parameter
    navigate(`/complexes?highlight=${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group cursor-pointer flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl overflow-hidden",
        "bg-card border border-border/50 shadow-sm",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Featured badge */}
        {project.isFeatured && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white border-0 text-xs gap-1">
            <Star className="w-3 h-3 fill-current" />
            {isRu ? 'Топ' : 'Featured'}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* District */}
        {project.district && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{project.district}</span>
          </div>
        )}

        {/* Stats: rent/sale counts */}
        {hasProperties && (
          <div className="flex items-center gap-3 text-xs">
            {project.rentCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Home className="w-3 h-3" />
                {project.rentCount} {isRu ? 'аренда' : 'rent'}
              </span>
            )}
            {project.saleCount > 0 && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-3 h-3" />
                {project.saleCount} {isRu ? 'продажа' : 'sale'}
              </span>
            )}
          </div>
        )}

        {/* Min price */}
        {project.minRentPrice && (
          <p className="text-sm">
            <span className="text-muted-foreground">{isRu ? 'от' : 'from'} </span>
            <span className="font-semibold text-primary">
              {formatPrice(project.minRentPrice)}
            </span>
            <span className="text-muted-foreground">{isRu ? '/мес' : '/mo'}</span>
          </p>
        )}

        {!hasProperties && (
          <p className="text-xs text-muted-foreground italic">
            {isRu ? 'Скоро появятся объекты' : 'Properties coming soon'}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectCarouselCard;
