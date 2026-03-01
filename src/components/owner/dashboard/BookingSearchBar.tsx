import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAllPropertyBookings } from '@/hooks/usePropertyBookings';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Calendar, User, Home, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function BookingSearchBar() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const { bookings, isLoading } = useAllPropertyBookings();

  const filteredBookings = useMemo(() => {
    if (!query.trim() || !bookings) return [];
    
    const searchLower = query.toLowerCase().trim();
    
    return bookings.filter(booking => {
      // Search by guest name
      if (booking.guest_name?.toLowerCase().includes(searchLower)) return true;
      // Search by guest phone
      if (booking.guest_phone?.includes(searchLower)) return true;
      // Search by guest email
      if (booking.guest_email?.toLowerCase().includes(searchLower)) return true;
      // Search by booking ID
      if (booking.id.toLowerCase().includes(searchLower)) return true;
      // Search by property title (field is title_en from properties table, aliased as title in map)
      const property = booking.owner_properties as any;
      if (property?.title?.toLowerCase().includes(searchLower)) return true;
      if (property?.title_en?.toLowerCase().includes(searchLower)) return true;
      if (property?.title_ru?.toLowerCase().includes(searchLower)) return true;
      // Search by date (format: dd.mm or yyyy-mm-dd)
      if (booking.check_in.includes(searchLower) || booking.check_out.includes(searchLower)) return true;
      
      return false;
    }).slice(0, 5); // Limit to 5 results
  }, [query, bookings]);

  const showResults = isFocused && query.trim().length > 0;

  const handleSelect = (bookingId: string, propertyId: string) => {
    setQuery('');
    setIsFocused(false);
    navigate(`/mc/properties/${propertyId}?booking=${bookingId}`);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success/20 text-success';
      case 'pending': return 'bg-warning/20 text-warning';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      case 'completed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={isRu ? 'Поиск по гостю, телефону, дате...' : 'Search by guest, phone, date...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-9 pr-9 h-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 overflow-hidden shadow-lg">
          <ScrollArea className="max-h-[300px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isRu ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {isRu ? 'Ничего не найдено' : 'No results found'}
              </div>
            ) : (
              <div className="py-1">
                {filteredBookings.map((booking) => {
                  const property = booking.owner_properties as any;
                  const propertyTitle = isRu 
                    ? (property?.title_ru || property?.title) 
                    : property?.title;
                  
                  return (
                    <button
                      key={booking.id}
                      className="w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors flex items-start gap-3"
                      onClick={() => handleSelect(booking.id, booking.property_id)}
                    >
                      <div className="p-1.5 rounded-lg bg-muted flex-shrink-0 mt-0.5">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {booking.guest_name || (isRu ? 'Гость' : 'Guest')}
                          </span>
                          <Badge variant="outline" className={cn("text-xs", getStatusColor(booking.status))}>
                            {booking.status || 'pending'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(booking.check_in), 'd MMM', { locale: isRu ? ru : undefined })} 
                            {' → '}
                            {format(new Date(booking.check_out), 'd MMM', { locale: isRu ? ru : undefined })}
                          </span>
                        </div>
                        
                        {propertyTitle && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Home className="h-3 w-3" />
                            <span className="truncate">{propertyTitle}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
