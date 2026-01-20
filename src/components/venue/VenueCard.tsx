import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Star } from 'lucide-react';
import { Venue, VENUE_TYPES } from '@/hooks/useVenues';
import { useNavigate } from 'react-router-dom';

interface VenueCardProps {
  venue: Venue;
  compact?: boolean;
}

export function VenueCard({ venue, compact = false }: VenueCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const name = language === 'ru' ? venue.name_ru : venue.name_en;
  const address = language === 'ru' ? (venue.address_ru || venue.address) : venue.address;
  const venueType = VENUE_TYPES.find(t => t.value === venue.venue_type);
  const typeLabel = venueType ? (language === 'ru' ? venueType.labelRu : venueType.label) : venue.venue_type;

  if (compact) {
    return (
      <div 
        onClick={() => navigate(`/venues/${venue.id}`)}
        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img 
            src={venue.cover_image || '/placeholder.svg'} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
            {venue.capacity && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {venue.capacity.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/venues/${venue.id}`)}
    >
      <div className="relative aspect-[16/9]">
        <img 
          src={venue.cover_image || '/placeholder.svg'} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex gap-2">
          <Badge className="bg-primary/90">{typeLabel}</Badge>
          {venue.is_featured && (
            <Badge variant="secondary" className="bg-yellow-500/90 text-white">
              ⭐ Featured
            </Badge>
          )}
        </div>
        {venue.rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {venue.rating.toFixed(1)}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        {address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3" />
            {address}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          {venue.capacity && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              {language === 'ru' ? 'Вместимость:' : 'Capacity:'} {venue.capacity.toLocaleString()}
            </span>
          )}
          {venue.review_count > 0 && (
            <span className="text-muted-foreground">
              {venue.review_count} {language === 'ru' ? 'отзывов' : 'reviews'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
