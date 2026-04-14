import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { PropertyProject } from '@/hooks/usePropertyProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, MapPin, Calendar, Users, ChevronDown, ChevronUp, 
  Waves, Dumbbell, Shield, Car, TreeDeciduous, Baby, 
  Utensils, Sparkles, Dribbble, Umbrella, Headphones, Bus,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';

interface ProjectInfoCardProps {
  project: PropertyProject;
  className?: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  pool: <Waves className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  garden: <TreeDeciduous className="h-4 w-4" />,
  playground: <Baby className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  spa: <Sparkles className="h-4 w-4" />,
  tennis: <Dribbble className="h-4 w-4" />,
  beach_access: <Umbrella className="h-4 w-4" />,
  concierge: <Headphones className="h-4 w-4" />,
  shuttle: <Bus className="h-4 w-4" />,
};

const amenityLabels: Record<string, { en: string; ru: string }> = {
  pool: { en: 'Pool', ru: 'Бассейн' },
  gym: { en: 'Gym', ru: 'Спортзал' },
  security: { en: '24h Security', ru: 'Охрана 24ч' },
  parking: { en: 'Parking', ru: 'Парковка' },
  garden: { en: 'Garden', ru: 'Сад' },
  playground: { en: 'Playground', ru: 'Детская площадка' },
  restaurant: { en: 'Restaurant', ru: 'Ресторан' },
  spa: { en: 'Spa', ru: 'Спа' },
  tennis: { en: 'Tennis Court', ru: 'Теннисный корт' },
  beach_access: { en: 'Beach Access', ru: 'Доступ к пляжу' },
  concierge: { en: 'Concierge', ru: 'Консьерж' },
  shuttle: { en: 'Shuttle Service', ru: 'Трансфер' },
};

export function ProjectInfoCard({ project, className }: ProjectInfoCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [expanded, setExpanded] = useState(false);

  const name = isRu ? project.name_ru : project.name_en;
  const description = isRu ? project.description_ru : project.description_en;
  const amenities = project.amenities || [];

  const handleExploreProject = () => {
    navigate(APP_ROUTES.PROJECT_DETAIL(project.id));
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          {isRu ? 'Проект / ЖК' : 'Project / Complex'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project header */}
        <div className="flex gap-3">
          {project.cover_image ? (
            <img
              src={project.cover_image}
              alt={name}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            {project.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{project.address}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {project.developer_name && (
                <Badge variant="secondary" className="text-xs">
                  {project.developer_name}
                </Badge>
              )}
              {project.year_built && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {project.year_built}
                </Badge>
              )}
              {project.total_units && (
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {project.total_units} {isRu ? 'юнитов' : 'units'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {isRu ? 'Удобства территории' : 'Project Amenities'}
            </p>
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, expanded ? undefined : 6).map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-sm"
                >
                  {amenityIcons[amenity] || <Building2 className="h-4 w-4" />}
                  <span>
                    {amenityLabels[amenity]
                      ? (isRu ? amenityLabels[amenity].ru : amenityLabels[amenity].en)
                      : amenity}
                  </span>
                </div>
              ))}
              {amenities.length > 6 && !expanded && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => setExpanded(true)}
                >
                  +{amenities.length - 6}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Description (expandable) */}
        {description && (
          <div className="space-y-2">
            <p className={cn(
              "text-sm text-muted-foreground",
              !expanded && "line-clamp-2"
            )}>
              {description}
            </p>
          </div>
        )}

        {/* Expand button */}
        {(description || amenities.length > 6) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {isRu ? 'Свернуть' : 'Show less'}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {isRu ? 'Подробнее о проекте' : 'More about project'}
              </>
            )}
          </Button>
        )}

        {/* Project gallery preview */}
        {expanded && project.images && project.images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {isRu ? 'Фото территории' : 'Territory Photos'}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {project.images.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${name} ${idx + 1}`}
                  className="aspect-square rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Video link */}
        {expanded && project.video_url && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={project.video_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {isRu ? 'Смотреть видео' : 'Watch Video'}
            </a>
          </Button>
        )}

        {/* Explore Project Button */}
        <Button 
          variant="default" 
          size="sm" 
          className="w-full gap-2"
          onClick={handleExploreProject}
        >
          <Building2 className="h-4 w-4" />
          {isRu ? 'Исследовать комплекс' : 'Explore Complex'}
        </Button>
      </CardContent>
    </Card>
  );
}
