import type { VehicleType } from '@/hooks/useTransportConfig';

const positiveFinite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

/** Read-only presentation/admission of existing configured tariffs; never a quote authority. */
export function configuredTransferBasePrice(
  routePrice: number | null | undefined,
  vehicle: Pick<VehicleType, 'base_price' | 'price_multiplier'> | null | undefined,
): number | null {
  if (!vehicle) return null;
  const price = positiveFinite(routePrice)
    ? positiveFinite(vehicle.price_multiplier) ? Math.round(routePrice * vehicle.price_multiplier) : null
    : vehicle.base_price;
  return positiveFinite(price) ? price : null;
}

export function configuredTransferTotal(basePrice: number | null, surcharge: number): number | null {
  if (!positiveFinite(basePrice) || !Number.isFinite(surcharge) || surcharge < 0) return null;
  const total = basePrice + surcharge;
  return positiveFinite(total) ? total : null;
}

export function transferFareLabel(price: number | null, language: string): string {
  return positiveFinite(price) ? `฿${price.toLocaleString()}`
    : language === 'ru' ? 'Стоимость требует подтверждения' : 'Price requires confirmation';
}
