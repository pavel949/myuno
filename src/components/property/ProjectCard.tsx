/**
 * ProjectCard - Rich card component for project catalog display
 * Shows cover image, name, stats, and badges
 */

/**
 * ProjectCard - Rich card component for project catalog display
 * Shows cover image, name, stats, and badges
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Home, Star, Play } from 'lucide-react';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { BADGE_SYSTEM } from '@/lib/designTokens';

interface ProjectCardProps {
  project: PropertyProject & { 
    propertyCount?: number;
    minPrice?: number;
    isNew?: boolean;
  };
  variant?: 'default' | 'featured' | 'compact';
  className?: string;
}

export function ProjectCard({ project, variant = 'default', className }: ProjectCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const name = isRu ? project.name_ru : project.name_en;
  const hasVideo = !!project.video_url;
  const propertyCount = (project as any).propertyCount || project.total_units || 0;

  const handleClick = () => {
    navigate(`/property/project/${project.id}`);
  };

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-2xl cursor-pointer group",
          "transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
          className
        )}
      >
        <AspectRatio ratio={16 / 9}>
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-primary/30" />
            </div>
          )}
        </AspectRatio>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Video badge */}
        {hasVideo && (
          <Badge className="absolute top-3 right-3 gap-1 bg-black/50 text-white border-none">
            <Play className="h-3 w-3" />
            Video
          </Badge>
        )}

        {/* Featured badge */}
        {project.is_featured && (
          <Badge className={cn("absolute top-3 left-3 border-none", BADGE_SYSTEM.featured)}>
            <Star className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-xl font-bold mb-1">{name}</h3>
          <div className="flex items-center gap-3 text-sm text-white/80">
            {project.district && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.district}
              </span>
            )}
            {propertyCount > 0 && (
              <span className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                {propertyCount} {isRu ? 'объектов' : 'units'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl bg-card border border-border",
          "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all",
          className
        )}
      >
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={name}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h4 className="font-medium truncate">{name}</h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {project.district || (isRu ? 'Пхукет' : 'Phuket')}
          </p>
          <p className="text-xs text-muted-foreground">
            {propertyCount} {isRu ? 'объектов' : 'units'}
          </p>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={handleClick}
      className={cn(
        "overflow-hidden rounded-2xl bg-card border border-border",
        "cursor-pointer hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all group",
        className
      )}
    >
      <AspectRatio ratio={4 / 3}>
        {project.cover_image ? (
          <img
            src={project.cover_image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {project.is_featured && (
            <Badge className={cn("border-none text-xs", BADGE_SYSTEM.featured)}>
              Featured
            </Badge>
          )}
          {(project as any).isNew && (
            <Badge className={cn("border-none text-xs", BADGE_SYSTEM.new)}>
              New
            </Badge>
          )}
          {hasVideo && (
            <Badge className="bg-black/50 text-white border-none text-xs gap-1">
              <Play className="h-2.5 w-2.5" />
              Video
            </Badge>
          )}
        </div>
      </AspectRatio>

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {project.district && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.district}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            {propertyCount} {isRu ? 'объектов' : 'units'}
          </span>
          
          {project.year_built && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {project.year_built}
            </span>
          )}
        </div>

        {project.developer_name && (
          <p className="text-xs text-muted-foreground truncate">
            {isRu ? 'Застройщик:' : 'Developer:'} {project.developer_name}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectCard;
