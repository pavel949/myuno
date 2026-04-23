/**
 * VehicleCard — Premium high-conversion vehicle card
 * Sixt-inspired but cleaner, calmer, trust-centric
 */

import { memo } from 'react';
import { Users, Briefcase, Fuel, Settings2, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/hooks/useVehicles';
import { getTransmissionLabel, getFuelLabel, getCategoryConfig } from '@/lib/taxonomies';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  className?: string;
}

export const VehicleCard = memo(function VehicleCard({ vehicle, onClick, className }: VehicleCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const name = isRu ? vehicle.name_ru : vehicle.name_en;
  const currencySymbol = getCurrencySymbol(vehicle.currency || 'THB');
  const transmissionLabel = getTransmissionLabel(vehicle.transmission, isRu ? 'ru' : 'en');
  const fuelLabel = getFuelLabel(vehicle.fuel_type, isRu ? 'ru' : 'en');
  const categoryConfig = getCategoryConfig(vehicle.vehicle_type);
  const image = vehicle.cover_image || vehicle.images?.[0] || '';

  return (
    <article
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-card rounded-none border border-border/50 overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:shadow-black/5 hover:border-border",
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted">
        <OptimizedImage
          src={image}
          alt={name}
          width={480}
          height={360}
          className="w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
          quality={80}
        />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <div className="flex gap-1.5">
            {vehicle.year_built && (
              <span className="px-2 py-0.5 rounded-none bg-black/60 text-white text-[10px] font-semibold">
                {vehicle.year_built}
              </span>
            )}
            {vehicle.is_featured && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-none bg-warning/90 text-white text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" />
                {isRu ? 'Лучшее' : 'Best Value'}
              </span>
            )}
          </div>

          {vehicle.is_verified && (
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-none bg-success/90 text-white text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" />
              G-Verified
            </span>
          )}
        </div>

        {/* Availability dot */}
        {vehicle.is_available && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-white font-medium">
              {isRu ? 'Доступен' : 'Available'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & class */}
        <div>
          <h3 className="font-semibold text-sm leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRu ? categoryConfig.labelRu : categoryConfig.labelEn}
          </p>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1 text-xs">
            <Settings2 className="w-3.5 h-3.5" />
            {transmissionLabel}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Fuel className="w-3.5 h-3.5" />
            {fuelLabel}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Users className="w-3.5 h-3.5" />
            {vehicle.capacity || '-'}
          </span>
          {vehicle.luggage_capacity > 0 && (
            <span className="flex items-center gap-1 text-xs">
              <Briefcase className="w-3.5 h-3.5" />
              {vehicle.luggage_capacity}
            </span>
          )}
        </div>

        {/* Price block */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {isRu ? 'От' : 'From'}
              </p>
              <p className="text-lg font-bold text-foreground">
                {currencySymbol}{vehicle.price_per_day?.toLocaleString() || '—'}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  /{isRu ? 'день' : 'day'}
                </span>
              </p>
            </div>

            {vehicle.price_per_month && (
              <p className="text-[11px] text-muted-foreground text-right">
                {isRu ? 'Месяц от' : 'Monthly from'}{' '}
                <span className="font-semibold text-foreground">
                  {currencySymbol}{vehicle.price_per_month.toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
});
