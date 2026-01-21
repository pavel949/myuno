/**
 * @module OrderTypes
 * @description Core type definitions for the unified order system
 * 
 * This module defines all types related to the Clean Core architecture
 * where all bookings flow through a single `orders` table.
 * 
 * @example
 * ```typescript
 * import { Order, OrderStatus, CreateOrderInput } from '@/types/orders';
 * 
 * const newOrder: CreateOrderInput = {
 *   order_type: 'tour',
 *   total_amount: 5000,
 *   items: [{ item_name: 'Island Tour', item_type: 'tour', unit_price: 5000, amount: 5000 }]
 * };
 * ```
 */

/**
 * All supported order types in the system.
 * Maps to different verticals/mini-apps.
 */
export type OrderType = 
  | 'service'      // General services (cleaning, repairs, etc.)
  | 'tour'         // Tours and excursions
  | 'property'     // Property rentals
  | 'yacht'        // Yacht charters
  | 'vehicle'      // Vehicle rentals and transfers
  | 'event'        // Event tickets
  | 'activity'     // Water activities, fitness classes
  | 'beauty'       // Spa and beauty services
  | 'cleaning'     // Cleaning services
  | 'babysitter'   // Childcare services
  | 'education'    // Courses and tutoring
  | 'medical'      // Medical appointments
  | 'legal'        // Legal and visa services
  | 'pet_service'  // Pet care services
  | 'flowers'      // Flower delivery
  | 'food'         // Food delivery and restaurant reservations
  | 'mixed';       // Cart with multiple types

/**
 * Order lifecycle status.
 * Transitions are tracked in `order_status_history` table.
 */
export type OrderStatus = 
  | 'draft'        // Order started but not submitted
  | 'pending'      // Awaiting confirmation
  | 'confirmed'    // Confirmed by provider
  | 'in_progress'  // Service is being delivered
  | 'completed'    // Successfully completed
  | 'cancelled'    // Cancelled by user or provider
  | 'refunded'     // Payment refunded
  | 'disputed';    // Under dispute resolution

/**
 * Supported payment methods
 */
export type PaymentMethod = 'cash' | 'wallet' | 'stripe' | 'bank_transfer';

/**
 * Core order entity
 */
export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_user_id: string;
  provider_org_id: string | null;
  status: OrderStatus;
  start_at: string | null;
  end_at: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Relations (populated when requested)
  order_items?: OrderItem[];
  order_participants?: OrderParticipant[];
  order_addresses?: OrderAddress[];
}

/**
 * Individual line items within an order
 */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  resource_id: string | null;
  provider_org_id: string | null;
  item_name: string;
  item_type: string;
  qty: number;
  unit_price: number;
  amount: number;
  status: string;
  start_at: string | null;
  end_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Participants attached to an order (guests, drivers, etc.)
 */
export interface OrderParticipant {
  id: string;
  order_id: string;
  role: 'primary' | 'guest' | 'attendee' | 'driver' | 'guide';
  name: string;
  phone: string | null;
  email: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Addresses for pickup, service, dropoff, or billing
 */
export interface OrderAddress {
  id: string;
  order_id: string;
  address_type: 'pickup' | 'service' | 'dropoff' | 'billing';
  address_text: string;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  created_at: string;
}

/**
 * Input for creating a new order
 */
export interface CreateOrderInput {
  order_type: OrderType;
  provider_org_id?: string;
  start_at?: Date | string;
  end_at?: Date | string;
  total_amount: number;
  currency?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  items: {
    product_id?: string;
    resource_id?: string;
    provider_org_id?: string;
    item_name: string;
    item_type: string;
    qty?: number;
    unit_price: number;
    amount: number;
    start_at?: Date | string;
    end_at?: Date | string;
    metadata?: Record<string, unknown>;
  }[];
  participants?: {
    role?: 'primary' | 'guest' | 'attendee';
    name: string;
    phone?: string;
    email?: string;
  }[];
  addresses?: {
    address_type: 'pickup' | 'service' | 'dropoff';
    address_text: string;
    lat?: number;
    lng?: number;
    notes?: string;
  }[];
  payment?: {
    method: PaymentMethod;
    amount: number;
  };
  // For WhatsApp notification
  serviceName?: string;
  providerName?: string;
  openWhatsAppOnCash?: boolean;
}

/**
 * Result from order creation
 */
export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  order_number?: string;
  error?: string;
}

/**
 * Timeline event for order tracking
 */
export interface OrderTimelineEvent {
  status: string;
  actor_name: string;
  reason: string | null;
  created_at: string;
}

/**
 * Status configuration for UI display
 */
export interface StatusConfig {
  labelEn: string;
  labelRu: string;
  color: string;
  bgColor: string;
}

/**
 * Status UI configuration map
 */
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  draft: { labelEn: 'Draft', labelRu: 'Черновик', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  pending: { labelEn: 'Pending', labelRu: 'Ожидание', color: 'text-yellow-600', bgColor: 'bg-yellow-500/20' },
  confirmed: { labelEn: 'Confirmed', labelRu: 'Подтверждён', color: 'text-blue-600', bgColor: 'bg-blue-500/20' },
  in_progress: { labelEn: 'In Progress', labelRu: 'В процессе', color: 'text-purple-600', bgColor: 'bg-purple-500/20' },
  completed: { labelEn: 'Completed', labelRu: 'Завершён', color: 'text-green-600', bgColor: 'bg-green-500/20' },
  cancelled: { labelEn: 'Cancelled', labelRu: 'Отменён', color: 'text-red-600', bgColor: 'bg-red-500/20' },
  refunded: { labelEn: 'Refunded', labelRu: 'Возврат', color: 'text-orange-600', bgColor: 'bg-orange-500/20' },
  disputed: { labelEn: 'Disputed', labelRu: 'Спор', color: 'text-red-600', bgColor: 'bg-red-500/20' },
};
