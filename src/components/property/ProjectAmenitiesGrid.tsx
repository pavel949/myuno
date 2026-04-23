/**
 * ProjectAmenitiesGrid - Visual grid display of project amenities
 * Maps amenity codes to icons and bilingual labels
 */

import React from 'react';
import { 
  Waves, Dumbbell, Shield, Car, TreeDeciduous, Baby, 
  Utensils, Sparkles, Dribbble, Umbrella, Headphones, Bus,
  Building2, Wifi, Zap, Droplets, Flame, Wind,
  Users, Store, Coffee, Tv, Camera, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectAmenitiesGridProps {
  amenities: string[];
  maxItems?: number;
  showAll?: boolean;
  className?: string;
}

const amenityConfig: Record<string, { icon: React.ReactNode; en: string; ru: string }> = {
  pool: { icon: <Waves className="h-5 w-5" />, en: 'Swimming Pool', ru: 'Бассейн' },
  gym: { icon: <Dumbbell className="h-5 w-5" />, en: 'Fitness Center', ru: 'Фитнес-центр' },
  security: { icon: <Shield className="h-5 w-5" />, en: '24h Security', ru: 'Охрана 24ч' },
  parking: { icon: <Car className="h-5 w-5" />, en: 'Parking', ru: 'Парковка' },
  garden: { icon: <TreeDeciduous className="h-5 w-5" />, en: 'Garden', ru: 'Сад' },
  playground: { icon: <Baby className="h-5 w-5" />, en: 'Playground', ru: 'Детская площадка' },
  restaurant: { icon: <Utensils className="h-5 w-5" />, en: 'Restaurant', ru: 'Ресторан' },
  spa: { icon: <Sparkles className="h-5 w-5" />, en: 'Spa & Wellness', ru: 'Спа и велнес' },
  tennis: { icon: <Dribbble className="h-5 w-5" />, en: 'Tennis Court', ru: 'Теннисный корт' },
  beach_access: { icon: <Umbrella className="h-5 w-5" />, en: 'Beach Access', ru: 'Доступ к пляжу' },
  concierge: { icon: <Headphones className="h-5 w-5" />, en: 'Concierge', ru: 'Консьерж' },
  shuttle: { icon: <Bus className="h-5 w-5" />, en: 'Shuttle Service', ru: 'Трансфер' },
  wifi: { icon: <Wifi className="h-5 w-5" />, en: 'High-Speed WiFi', ru: 'Скоростной WiFi' },
  lobby: { icon: <Building2 className="h-5 w-5" />, en: 'Lobby', ru: 'Лобби' },
  power_backup: { icon: <Zap className="h-5 w-5" />, en: 'Power Backup', ru: 'Резервное питание' },
  water_supply: { icon: <Droplets className="h-5 w-5" />, en: 'Water Supply', ru: 'Водоснабжение' },
  sauna: { icon: <Flame className="h-5 w-5" />, en: 'Sauna', ru: 'Сауна' },
  air_conditioning: { icon: <Wind className="h-5 w-5" />, en: 'Central AC', ru: 'Кондиционер' },
  meeting_room: { icon: <Users className="h-5 w-5" />, en: 'Meeting Room', ru: 'Переговорная' },
  mini_mart: { icon: <Store className="h-5 w-5" />, en: 'Mini Mart', ru: 'Мини-маркет' },
  cafe: { icon: <Coffee className="h-5 w-5" />, en: 'Café', ru: 'Кафе' },
  tv_lounge: { icon: <Tv className="h-5 w-5" />, en: 'TV Lounge', ru: 'ТВ-зона' },
  cctv: { icon: <Camera className="h-5 w-5" />, en: 'CCTV', ru: 'Видеонаблюдение' },
  key_card: { icon: <Lock className="h-5 w-5" />, en: 'Key Card Access', ru: 'Карточный доступ' },
};

export function ProjectAmenitiesGrid({
  amenities,
  maxItems = 12,
  showAll = false,
  className,
}: ProjectAmenitiesGridProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const displayAmenities = showAll ? amenities : amenities.slice(0, maxItems);
  const hiddenCount = amenities.length - displayAmenities.length;

  if (amenities.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {displayAmenities.map((amenity) => {
          const config = amenityConfig[amenity];
          
          return (
            <div
              key={amenity}
              className="flex items-center gap-3 p-3 rounded-none bg-muted/50 border border-border/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-none bg-primary/10 flex items-center justify-center text-primary">
                {config?.icon || <Building2 className="h-5 w-5" />}
              </div>
              <span className="text-sm font-medium line-clamp-2">
                {config 
                  ? (isRu ? config.ru : config.en)
                  : amenity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                }
              </span>
            </div>
          );
        })}
      </div>

      {!showAll && hiddenCount > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          +{hiddenCount} {isRu ? 'удобств' : 'more amenities'}
        </p>
      )}
    </div>
  );
}

export default ProjectAmenitiesGrid;
