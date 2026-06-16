import React from 'react';
import { motion } from 'framer-motion';
import { Plane, MapPin, ArrowRight, Check, LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AddressAutocomplete } from '@/components/transport/AddressAutocomplete';
import type { BaseStepProps, TransferDirection } from './types';

const terminals = [
  { id: 'domestic', nameEn: 'Domestic Terminal', nameRu: 'Внутренний терминал' },
  { id: 'international', nameEn: 'International Terminal', nameRu: 'Международный терминал' },
];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

interface Destination {
  id: string;
  name_ru: string;
  name_en: string;
  base_price: number;
  duration_minutes?: number | null;
  is_popular?: boolean | null;
}

interface StepRouteProps extends BaseStepProps {
  destinations: Destination[];
  geoSupported: boolean;
  geoLoading: boolean;
  isReverseGeocoding: boolean;
  onUseCurrentLocation: () => void;
  onDestinationCoords: (coords: { lat: number; lng: number; placeId?: string } | null) => void;
  onPickupCoords: (coords: { lat: number; lng: number } | null) => void;
}

export function StepRoute({
  formData,
  setFormData,
  language,
  destinations,
  geoSupported,
  geoLoading,
  isReverseGeocoding,
  onUseCurrentLocation,
  onDestinationCoords,
  onPickupCoords,
}: StepRouteProps) {
  const handleDirectionChange = (dir: TransferDirection) =>
    setFormData(prev => ({ ...prev, direction: dir }));

  return (
    <motion.div
      key="step-route"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Direction */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Направление' : 'Direction'}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDirectionChange('from-airport')}
            className={cn(
              'p-3.5 rounded-none border-2 transition-all text-left relative',
              formData.direction === 'from-airport'
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card hover:border-primary/50',
            )}
          >
            {formData.direction === 'from-airport' && (
              <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
            )}
            <div className="flex items-center gap-1.5 mb-1">
              <Plane className="w-4 h-4 text-primary" />
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <MapPin className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm">
              {language === 'ru' ? 'Из аэропорта' : 'From Airport'}
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleDirectionChange('to-airport')}
            className={cn(
              'p-3.5 rounded-none border-2 transition-all text-left relative',
              formData.direction === 'to-airport'
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card hover:border-primary/50',
            )}
          >
            {formData.direction === 'to-airport' && (
              <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
            )}
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <Plane className="w-4 h-4 text-primary" />
            </div>
            <p className="font-medium text-sm">
              {language === 'ru' ? 'В аэропорт' : 'To Airport'}
            </p>
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Терминал' : 'Terminal'}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {terminals.map((terminal) => (
            <button
              key={terminal.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, terminal: terminal.id }))}
              className={cn(
                'p-3.5 rounded-none border-2 transition-all text-center relative',
                formData.terminal === terminal.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-card hover:border-primary/50',
              )}
            >
              {formData.terminal === terminal.id && (
                <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
              )}
              <Plane className="w-5 h-5 mb-1 text-primary mx-auto" />
              <p className="font-medium text-xs">
                {language === 'ru' ? terminal.nameRu : terminal.nameEn}
              </p>
            </button>
          ))}
        </div>

        {/* International terminal meeting point — Tourist Police desk (1155).
            Shown only for from-airport+international so the customer knows
            where to find the driver. Same string is persisted into the order
            metadata.meeting_point and surfaced in the operator email. */}
        {formData.terminal === 'international' && formData.direction === 'from-airport' && (
          <div className="rounded-none border border-primary/30 bg-primary/[0.04] p-3 mt-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold mb-1">
              {language === 'ru' ? 'Место встречи' : 'Meeting point'}
            </p>
            <p className="text-[13px] text-foreground leading-snug">
              {language === 'ru'
                ? 'Стойка туристической полиции (Tourist Police 1155) в зоне прилёта международного терминала.'
                : 'Tourist Police desk (1155) in the international arrivals hall.'}
            </p>
          </div>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {formData.direction === 'from-airport'
            ? (language === 'ru' ? 'Куда доставить' : 'Drop-off Address')
            : (language === 'ru' ? 'Откуда забрать' : 'Pick-up Address')}
        </Label>

        {destinations.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {language === 'ru' ? 'Популярные направления' : 'Popular destinations'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {destinations
                .slice()
                .sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0))
                .map((dest) => (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      selectedDestinationId: dest.id,
                      destinationAddress: language === 'ru' ? dest.name_ru : dest.name_en,
                    }))}
                    className={cn(
                      'p-4 min-h-[64px] rounded-none border-2 transition-all text-left relative',
                      formData.selectedDestinationId === dest.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 bg-card hover:border-primary/30',
                    )}
                  >
                    {formData.selectedDestinationId === dest.id && (
                      <div className="absolute top-2 right-2"><Check className="w-3.5 h-3.5 text-primary" /></div>
                    )}
                    <p className="font-medium text-sm mb-1">
                      {language === 'ru' ? dest.name_ru : dest.name_en}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-primary">฿{dest.base_price.toLocaleString()}</span>
                      {dest.duration_minutes && (
                        <span className="text-[10px] text-muted-foreground">~{dest.duration_minutes} {language === 'ru' ? 'мин' : 'min'}</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ) : (
          <div className="rounded-none border border-dashed border-border/60 bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {language === 'ru'
                ? 'Популярные направления ещё не загружены. Введите адрес назначения в поле ниже.'
                : 'Popular destinations are not loaded yet. Enter the destination address in the field below.'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <AddressAutocomplete
            value={formData.destinationAddress}
            onChange={(val, meta) => {
              setFormData(prev => ({ ...prev, destinationAddress: val, selectedDestinationId: '' }));
              if (meta?.lat != null && meta?.lng != null) {
                onDestinationCoords({ lat: meta.lat, lng: meta.lng, placeId: meta.placeId });
                if (formData.direction === 'to-airport') {
                  onPickupCoords({ lat: meta.lat, lng: meta.lng });
                }
              } else {
                onDestinationCoords(null);
              }
            }}
            placeholder={language === 'ru' ? 'Или введите свой адрес' : 'Or enter your address'}
            className="flex-1"
          />
          {geoSupported && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0"
              onClick={onUseCurrentLocation}
              disabled={geoLoading || isReverseGeocoding}
            >
              {(geoLoading || isReverseGeocoding)
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <LocateFixed className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
