import { Building2, MapPin, Calendar, Layers, Home, Shield, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPLEX_TYPES } from '@/lib/complexConstants';
import type { PropertyComplex } from '@/hooks/usePropertyComplexes';

interface ComplexCardProps {
  complex: PropertyComplex;
  onClick: () => void;
}

export function ComplexCard({ complex, onClick }: ComplexCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const typeLabel = COMPLEX_TYPES.find(t => t.value === complex.complex_type);
  const amenityCount = (complex.amenities?.length || 0) + (complex.services?.length || 0);
  const securityCount = complex.security_features?.length || 0;

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative h-40 bg-muted overflow-hidden">
        {complex.cover_image ? (
          <img 
            src={complex.cover_image} 
            alt={complex.name} 
            className="w-full h-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Building2 className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {typeLabel && (
          <Badge variant="secondary" className="absolute top-3 left-3 bg-background/90 text-xs">
            {isRu ? typeLabel.labelRu : typeLabel.labelEn}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground truncate">
            {isRu ? (complex.name_ru || complex.name) : complex.name}
          </h3>
          {complex.district && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {complex.district}
            </p>
          )}
        </div>

        {/* Platform description (hide MC description) */}
        {(complex.description_en || complex.description_ru) && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {isRu ? (complex.description_ru || complex.description_en) : (complex.description_en || complex.description_ru)}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {complex.total_units && (
            <span className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              {complex.total_units} {isRu ? 'юнитов' : 'units'}
            </span>
          )}
          {complex.total_buildings && (
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {complex.total_buildings} {isRu ? 'корп.' : 'bldg'}
            </span>
          )}
          {complex.year_built && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {complex.year_built}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {amenityCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1 font-normal">
              <Sparkles className="h-3 w-3" />
              {amenityCount} {isRu ? 'удобств' : 'amenities'}
            </Badge>
          )}
          {securityCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1 font-normal">
              <Shield className="h-3 w-3" />
              {securityCount} {isRu ? 'безоп.' : 'security'}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
