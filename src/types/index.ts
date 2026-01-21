/**
 * @module Types
 * @description Central export for all application types
 * 
 * Import types from this module for consistent typing across the app:
 * 
 * @example
 * ```typescript
 * import { Order, OrderStatus, AvailabilityResult } from '@/types';
 * ```
 */

// Vendor types
export * from './vendor';

// Order system types
export * from './orders';

// Availability system types  
export * from './availability';
