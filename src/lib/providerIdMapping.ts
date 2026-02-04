/**
 * Provider ID Field Mapping
 * Maps table names to their correct provider/vendor ID field names
 * Resolves P0 issue: different tables use different field names for ownership
 */

export interface ProviderIdConfig {
  field: string;
  type: 'provider' | 'vendor' | 'owner' | 'user' | 'shop';
}

/**
 * Canonical mapping of table names to their provider ID field
 * This ensures correct FK references when creating records
 */
export const PROVIDER_ID_MAPPING: Record<string, ProviderIdConfig> = {
  // Marketplace products use vendor_id (links to marketplace_vendors)
  'marketplace_products': { field: 'vendor_id', type: 'vendor' },
  
  // Vendor services use provider_id (links to providers)
  'vendor_services': { field: 'provider_id', type: 'provider' },
  
  // Vertical tables use provider_id
  'yachts': { field: 'provider_id', type: 'provider' },
  'tours': { field: 'provider_id', type: 'provider' },
  'water_activities': { field: 'provider_id', type: 'provider' },
  'restaurants': { field: 'provider_id', type: 'provider' },
  'salons': { field: 'provider_id', type: 'provider' },
  'clinics': { field: 'provider_id', type: 'provider' },
  'gyms': { field: 'provider_id', type: 'provider' },
  'vehicles': { field: 'provider_id', type: 'provider' },
  'babysitters': { field: 'provider_id', type: 'provider' },
  'cleaning_providers': { field: 'provider_id', type: 'provider' },
  'pet_services': { field: 'provider_id', type: 'provider' },
  'lawyers': { field: 'provider_id', type: 'provider' },
  'education_centers': { field: 'provider_id', type: 'provider' },
  
  // Properties use owner_id (links to property owners/users)
  'properties': { field: 'provider_id', type: 'provider' },
  'owner_properties': { field: 'owner_id', type: 'owner' },
  
  // Flower shops and bouquets
  'flower_shops': { field: 'provider_id', type: 'provider' },
  'bouquets': { field: 'shop_id', type: 'shop' },
  
  // User-generated content uses user_id
  'user_listings': { field: 'user_id', type: 'user' },
};

/**
 * Valid table names that can be used for intake/bulk import
 * Prevents insertion into non-existent tables
 */
export const VALID_INTAKE_TABLES = Object.keys(PROVIDER_ID_MAPPING);

/**
 * Get the provider ID field name for a given table
 * Returns 'provider_id' as default for unknown tables
 */
export function getProviderIdField(tableName: string): string {
  return PROVIDER_ID_MAPPING[tableName]?.field || 'provider_id';
}

/**
 * Get the provider ID config for a given table
 */
export function getProviderIdConfig(tableName: string): ProviderIdConfig | undefined {
  return PROVIDER_ID_MAPPING[tableName];
}

/**
 * Check if a table is valid for intake/import
 */
export function isValidIntakeTable(tableName: string): boolean {
  return VALID_INTAKE_TABLES.includes(tableName);
}

/**
 * Prepare data for insertion by mapping the correct provider ID field
 */
export function prepareDataWithProviderId(
  tableName: string,
  data: Record<string, unknown>,
  ids: {
    providerId?: string;
    vendorId?: string;
    ownerId?: string;
    userId?: string;
    shopId?: string;
  }
): Record<string, unknown> {
  const config = PROVIDER_ID_MAPPING[tableName];
  
  if (!config) {
    // Default to provider_id if table not in mapping
    return { ...data, provider_id: ids.providerId };
  }
  
  const result = { ...data };
  
  // Remove any existing provider-like fields to prevent conflicts
  delete result.provider_id;
  delete result.vendor_id;
  delete result.owner_id;
  delete result.user_id;
  delete result.shop_id;
  
  // Set the correct field based on config
  switch (config.type) {
    case 'vendor':
      result[config.field] = ids.vendorId;
      break;
    case 'owner':
      result[config.field] = ids.ownerId || ids.userId;
      break;
    case 'user':
      result[config.field] = ids.userId;
      break;
    case 'shop':
      result[config.field] = ids.shopId;
      break;
    case 'provider':
    default:
      result[config.field] = ids.providerId;
      break;
  }
  
  return result;
}
