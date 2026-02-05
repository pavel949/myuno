/**
 * @module ManagerProperties
 * @description List of assigned properties for Property Manager
 */

import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAssignedProperties } from '@/hooks/useAssignedProperties';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Search,
  Users,
  Bed,
  Bath,
  LogIn,
  LogOut,
  CheckCircle2,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ManagerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [search, setSearch] = useState('');

  const { properties, isLoading } = useAssignedProperties();

  const filteredProperties = properties.filter(p => {
    const searchLower = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(searchLower) ||
      p.title_ru.toLowerCase().includes(searchLower) ||
      p.address?.toLowerCase().includes(searchLower) ||
      p.district?.toLowerCase().includes(searchLower)
    );
  });

  const statusConfig = {
    available: { 
      icon: CheckCircle2, 
      labelEn: 'Available', 
      labelRu: 'Свободно',
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    },
    occupied: { 
      icon: Users, 
      labelEn: 'Occupied', 
      labelRu: 'Занято',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    },
    checkin: { 
      icon: LogIn, 
      labelEn: 'Check-in today', 
      labelRu: 'Заезд сегодня',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    },
    checkout: { 
      icon: LogOut, 
      labelEn: 'Check-out today', 
      labelRu: 'Выезд сегодня',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    },
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          {isRu ? 'Мои объекты' : 'My Properties'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? `${properties.length} объект(ов) под управлением` 
            : `${properties.length} property(ies) under management`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRu ? 'Поиск объектов...' : 'Search properties...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Properties List */}
      {filteredProperties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {search 
                ? (isRu ? 'Ничего не найдено' : 'No properties found')
                : (isRu ? 'Нет назначенных объектов' : 'No assigned properties')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProperties.map(property => {
            const status = statusConfig[property.today_status];
            const StatusIcon = status.icon;

            return (
              <Card 
                key={property.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/manager/properties/${property.property_id}`)}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Image */}
                    <div className="relative w-28 h-28 flex-shrink-0 bg-muted">
                      {property.cover_image ? (
                        <img 
                          src={property.cover_image} 
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      {/* Status overlay */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className={cn("gap-1 text-xs", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {isRu ? status.labelRu : status.labelEn}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {isRu ? property.title_ru : property.title}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {property.district || property.address}
                      </p>

                      {/* Property details */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {property.bedrooms && (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {property.bedrooms}
                          </span>
                        )}
                        {property.bathrooms && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3 w-3" />
                            {property.bathrooms}
                          </span>
                        )}
                        {property.price_per_night && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {property.price_per_night.toLocaleString()} {property.currency}
                          </span>
                        )}
                      </div>

                      {/* Actions row */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manager/calendar?property=${property.property_id}`);
                          }}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {isRu ? 'Календарь' : 'Calendar'}
                        </Button>
                        {property.upcoming_bookings_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {property.upcoming_bookings_count} {isRu ? 'брон.' : 'bookings'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
