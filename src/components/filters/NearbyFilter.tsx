import { useState } from 'react';
import { MapPin, Navigation, Loader2, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGeolocation, formatDistance } from '@/hooks/useGeolocation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const RADIUS_OPTIONS = [
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: '50 km', labelRu: '50 км' },
];

interface NearbyFilterProps {
  isActive: boolean;
  radius: number;
  onRadiusChange: (radius: number) => void;
  onLocationChange: (lat: number | null, lng: number | null) => void;
  onActiveChange: (active: boolean) => void;
  className?: string;
  compact?: boolean;
}

export function NearbyFilter({
  isActive,
  radius,
  onRadiusChange,
  onLocationChange,
  onActiveChange,
  className,
  compact = false,
}: NearbyFilterProps) {
  const { language } = useLanguage();
  const { latitude, longitude, loading, error, getPosition, hasLocation, supported } = useGeolocation();
  const [showError, setShowError] = useState(false);

  const handleActivate = () => {
    if (!hasLocation) {
      getPosition();
    }
    
    if (hasLocation) {
      onLocationChange(latitude, longitude);
      onActiveChange(true);
    }
  };

  const handleDeactivate = () => {
    onLocationChange(null, null);
    onActiveChange(false);
  };

  // Update parent when location changes
  if (hasLocation && isActive && (latitude !== null && longitude !== null)) {
    onLocationChange(latitude, longitude);
  }

  // Show error toast
  if (error && !showError) {
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  }

  if (!supported) {
    return null;
  }

  const currentRadiusOption = RADIUS_OPTIONS.find(opt => opt.value === radius) || RADIUS_OPTIONS[2];

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          onClick={isActive ? handleDeactivate : handleActivate}
          disabled={loading}
          className={cn(
            'gap-2 transition-all',
            isActive && 'bg-primary text-primary-foreground'
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {language === 'ru' ? 'Рядом' : 'Near Me'}
        </Button>

        {isActive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                {language === 'ru' ? currentRadiusOption.labelRu : currentRadiusOption.labelEn}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {RADIUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onRadiusChange(option.value)}
                  className={cn(radius === option.value && 'bg-accent')}
                >
                  {language === 'ru' ? option.labelRu : option.labelEn}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {language === 'ru' ? 'Рядом со мной' : 'Near Me'}
          </span>
        </div>
        
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          onClick={isActive ? handleDeactivate : handleActivate}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isActive ? (
            <X className="h-4 w-4" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {isActive 
            ? (language === 'ru' ? 'Отключить' : 'Disable')
            : (language === 'ru' ? 'Включить' : 'Enable')
          }
        </Button>
      </div>

      {isActive && (
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <Badge
              key={option.value}
              variant={radius === option.value ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-colors',
                radius === option.value 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              )}
              onClick={() => onRadiusChange(option.value)}
            >
              {language === 'ru' ? option.labelRu : option.labelEn}
            </Badge>
          ))}
        </div>
      )}

      {error && showError && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {hasLocation && isActive && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {language === 'ru' ? 'Местоположение определено' : 'Location detected'}
        </p>
      )}
    </div>
  );
}

// Badge component to show distance
interface DistanceBadgeProps {
  distanceKm: number;
  className?: string;
}

export function DistanceBadge({ distanceKm, className }: DistanceBadgeProps) {
  const { language } = useLanguage();
  const lang = language === 'ru' ? 'ru' : 'en';
  
  return (
    <Badge 
      variant="secondary"
      className={cn('gap-1 bg-primary/10 text-primary', className)}
    >
      <MapPin className="h-3 w-3" />
      {formatDistance(distanceKm, lang)}
    </Badge>
  );
}
