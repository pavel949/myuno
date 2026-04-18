/**
 * @module Types
 * @description Central export for all application types.
 * Import from '@/types' — not from individual type files or hooks.
 *
 * NOTE: capital.ts and marketing.ts both export `CampaignStatus` (different shapes) —
 * import directly from '@/types/capital' or '@/types/marketing' until resolved.
 * NOTE: marketplace.ts and userListing.ts both export `ItemCondition`, `SellerType`,
 * `STATUS_LABELS` — import directly until resolved.
 */

// Core domain types
export * from './property';
export * from './vendor';        // includes VendorEntityBase + re-exports verticals
export * from './verticals';     // VendorEducationProvider, VendorEvent, VendorExperience
export * from './orders';
export * from './availability';
export * from './contact';

// Auth & roles
export * from './auth';          // AppRole, ROLE_METADATA, role helpers

// Admin / platform
export * from './admin';         // Provider, Service, Category, PlatformMetrics

// Engagement verticals
export * from './favorites';     // FavoriteItem, FavoriteCollection
export * from './bouquet';       // BouquetBase, SizeVariant
export * from './investmentHub'; // InvestmentOpportunity, InvestmentHubRole

// Intentionally NOT barrel-exported (name conflicts — fix naming first):
// export * from './capital';    — CampaignStatus conflicts with marketing.ts
// export * from './marketing';  — CampaignStatus conflicts with capital.ts
// export * from './marketplace';— ItemCondition/SellerType conflicts with userListing.ts
// export * from './userListing';— ItemCondition/SellerType conflicts with marketplace.ts
