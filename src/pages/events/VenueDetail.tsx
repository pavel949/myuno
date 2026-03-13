import { useParams, useNavigate } from 'react-router-dom';
import { useVenue, VENUE_TYPES, AMENITIES_MAP } from '@/hooks/useVenues';
import { useEvents } from '@/hooks/useEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MapPin, Users, Phone, Mail, Globe, Clock, Star, 
  Navigation, Calendar, ChevronRight, Ticket
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { RelatedServicesSection } from '@/components/crosssell';

export default function VenueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { venue, isLoading } = useVenue(id);
  const { events } = useEvents({ limit: 10 });

  // Filter events at this venue
  const venueEvents = events?.filter(e => e.provider_id === id || (venue && e.location_name?.includes(venue.name_en)));

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer>
          <Skeleton className="h-64 w-full rounded-xl mb-4" />
          <Skeleton className="h-8 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/3" />
        </PageContainer>
      </AppLayout>
    );
  }

  if (!venue) {
    return (
      <AppLayout>
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {language === 'ru' ? 'Площадка не найдена' : 'Venue not found'}
            </p>
            <BackButton fallbackPath={APP_ROUTES.EVENTS} />
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  const name = language === 'ru' ? venue.name_ru : venue.name_en;
  const description = language === 'ru' ? venue.description_ru : venue.description_en;
  const address = language === 'ru' ? (venue.address_ru || venue.address) : venue.address;
  const venueType = VENUE_TYPES.find(t => t.value === venue.venue_type);
  const typeLabel = venueType ? (language === 'ru' ? venueType.labelRu : venueType.label) : venue.venue_type;

  const openGoogleMaps = () => {
    if (venue.lat && venue.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`, '_blank');
    }
  };

  return (
    <AppLayout>
      <PageContainer className="pb-24">
        <PageHeader 
          title={name} 
          showBack 
          actions={
            venue.rating > 0 ? (
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium">{venue.rating.toFixed(1)}</span>
              </div>
            ) : undefined
          }
        />

        {/* Hero Image */}
        <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
          <img 
            src={venue.cover_image || '/placeholder.svg'} 
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Badge className="bg-primary text-primary-foreground">{typeLabel}</Badge>
            {venue.is_featured && (
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                ⭐ {language === 'ru' ? 'Популярное' : 'Featured'}
              </Badge>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        {venue.images && venue.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
            {venue.images.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`${name} ${idx + 1}`}
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
              />
            ))}
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-4">
          {/* Location & Capacity */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{address}</p>
                    {venue.lat && venue.lng && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary"
                        onClick={openGoogleMaps}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        {language === 'ru' ? 'Построить маршрут' : 'Get Directions'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {venue.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <p>
                    {language === 'ru' ? 'Вместимость:' : 'Capacity:'}{' '}
                    <span className="font-medium">{venue.capacity.toLocaleString()}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {description && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">
                  {language === 'ru' ? 'О площадке' : 'About'}
                </h3>
                <p className="text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          )}

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  {language === 'ru' ? 'Удобства' : 'Amenities'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {venue.amenities.map((amenity) => {
                    const info = AMENITIES_MAP[amenity];
                    const label = info ? (language === 'ru' ? info.ru : info.en) : amenity;
                    return (
                      <Badge key={amenity} variant="secondary" className="py-1.5">
                        {label}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contacts */}
          {(venue.phone || venue.email || venue.website) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">
                  {language === 'ru' ? 'Контакты' : 'Contact'}
                </h3>
                
                {venue.phone && (
                  <a href={`tel:${venue.phone}`} className="flex items-center gap-3 text-primary">
                    <Phone className="h-5 w-5" />
                    {venue.phone}
                  </a>
                )}
                
                {venue.email && (
                  <a href={`mailto:${venue.email}`} className="flex items-center gap-3 text-primary">
                    <Mail className="h-5 w-5" />
                    {venue.email}
                  </a>
                )}
                
                {venue.website && (
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary">
                    <Globe className="h-5 w-5" />
                    {venue.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          {venueEvents && venueEvents.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {language === 'ru' ? 'Ближайшие события' : 'Upcoming Events'}
                  </h3>
                  <Badge variant="secondary">{venueEvents.length}</Badge>
                </div>
                <div className="space-y-2">
                  {venueEvents.slice(0, 5).map((event) => (
                    <div 
                      key={event.id}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    >
                      <img 
                        src={event.cover_image || '/placeholder.svg'} 
                        alt={language === 'ru' ? event.title_ru : event.title_en}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {language === 'ru' ? event.title_ru : event.title_en}
                        </p>
                        {event.event_date && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'd MMMM', { locale: language === 'ru' ? ru : undefined })}
                            {event.event_time && ` • ${event.event_time}`}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Cross-sell */}
        <div className="pb-24">
          <RelatedServicesSection currentVertical="events" />
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <Button 
            className="w-full"
            size="lg"
            onClick={() => navigate('/events')}
          >
            <Ticket className="h-5 w-5 mr-2" />
            {language === 'ru' ? 'Все события на площадке' : 'View All Events'}
          </Button>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
