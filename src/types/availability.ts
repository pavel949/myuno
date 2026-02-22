/**
 * @module AvailabilityTypes
 * @description Type definitions for the universal availability system
 * 
 * The availability system supports multiple verticals through a single
 * `check_availability` RPC function that handles:
 * - Properties (date ranges with blocked dates)
 * - Yachts (date ranges with charter schedules)
 * - Tours (time slots with participant limits)
 * - Services (appointment slots with provider schedules)
 * - Restaurants (table availability with cover limits)
 */

/**
 * Vertical types supported by availability checking
 */
export type AvailabilityVertical = 
  | 'yacht' 
  | 'tour' 
  | 'property' 
  | 'service' 
  | 'transport'
  | 'beauty' 
  | 'cleaning' 
  | 'medical' 
  | 'education' 
  | 'legal' 
  | 'fitness' 
  | 'babysitter' 
  | 'pet_service'
  | 'restaurant';

/**
 * Result from availability check
 */
export interface AvailabilityResult {
  /** Whether the slot/dates are available */
  available: boolean;
  /** Number of remaining spots (for tours, restaurants) */
  spots_remaining?: number;
  /** Maximum capacity (for tours, restaurants) */
  max_spots?: number;
  /** Reason if not available */
  reason?: string;
  /** Error message if check failed */
  error?: string;
}

/**
 * Parameters for checking availability
 */
export interface CheckAvailabilityParams {
  /** The vertical type being checked */
  vertical: AvailabilityVertical;
  /** ID of the entity (property, tour, yacht, etc.) */
  entityId: string;
  /** ID of specific provider (for services) */
  providerId?: string;
  /** Start date/time of booking */
  startDatetime: Date | string;
  /** End date/time of booking (optional for single-slot bookings) */
  endDatetime?: Date | string;
  /** Number of participants/guests */
  participants?: number;
  /** Order ID to exclude (for editing existing bookings) */
  excludeOrderId?: string;
}

/**
 * Property-specific availability status
 */
export type PropertyAvailabilityStatus = 'available' | 'blocked' | 'booked';

/**
 * Property availability entry
 */
export interface PropertyAvailability {
  date: Date;
  status: PropertyAvailabilityStatus;
  priceOverride?: number;
  minNightsOverride?: number;
  note?: string;
}

/**
 * Restaurant availability slot
 */
export interface RestaurantSlot {
  time: string;
  maxCovers: number;
  bookedCovers: number;
  isBlocked: boolean;
}

/**
 * Service provider time slot
 */
export interface ServiceTimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  providerId?: string;
  providerName?: string;
}
