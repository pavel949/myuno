import { logger } from '@/lib/logger';
/**
 * Feature Flags System
 * 
 * Centralized feature flag management for gradual rollouts,
 * A/B testing, and environment-specific features.
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  /** Percentage of users who see this feature (0-100) */
  rolloutPercentage?: number;
  /** Only enable for specific user roles */
  allowedRoles?: string[];
  /** Environment restrictions */
  environments?: ('development' | 'staging' | 'production')[];
}

// Feature flag definitions
const FLAGS: Record<string, FeatureFlag> = {
  // AI Features
  AI_SMART_SEARCH: {
    key: 'ai_smart_search',
    enabled: true,
    description: 'AI-powered natural language search',
    rolloutPercentage: 100,
  },
  AI_PROPERTY_ASSISTANT: {
    key: 'ai_property_assistant',
    enabled: true,
    description: 'AI assistant for property inquiries',
    rolloutPercentage: 100,
  },
  AI_VENDOR_ACQUISITION: {
    key: 'ai_vendor_acquisition',
    enabled: true,
    description: 'AI-powered vendor outreach automation',
    allowedRoles: ['admin', 'uno_team'],
  },
  
  // Payment Features
  STRIPE_PAYMENTS: {
    key: 'stripe_payments',
    enabled: true,
    description: 'Stripe payment processing',
  },
  WALLET_TOPUP: {
    key: 'wallet_topup',
    enabled: true,
    description: 'Wallet balance top-up via Stripe',
  },
  CASHBACK_SYSTEM: {
    key: 'cashback_system',
    enabled: true,
    description: 'Cashback rewards on bookings',
    rolloutPercentage: 100,
  },
  
  // UX Features
  PWA_INSTALL_PROMPT: {
    key: 'pwa_install_prompt',
    enabled: true,
    description: 'Show PWA installation prompts',
  },
  DARK_MODE: {
    key: 'dark_mode',
    enabled: true,
    description: 'Dark mode theme support',
  },
  ANIMATIONS: {
    key: 'animations',
    enabled: true,
    description: 'UI animations and transitions',
  },
  
  // Owner Features
  OWNER_CALENDAR_SYNC: {
    key: 'owner_calendar_sync',
    enabled: true,
    description: 'iCal sync for property owners',
  },
  OWNER_ANALYTICS: {
    key: 'owner_analytics',
    enabled: true,
    description: 'Advanced analytics for property owners',
  },
  
  // Vendor Features
  VENDOR_SUBSCRIPTION: {
    key: 'vendor_subscription',
    enabled: true,
    description: 'Vendor SaaS subscription plans',
  },
  VENDOR_BULK_IMPORT: {
    key: 'vendor_bulk_import',
    enabled: true,
    description: 'Bulk import for vendor products',
  },
  
  // Auth
  AUTH_PHONE: {
    key: 'auth_phone',
    enabled: false,
    description: 'Phone OTP login (requires SMS provider in Cloud Auth)',
  },
  AUTH_FACEBOOK: {
    key: 'auth_facebook',
    enabled: false,
    description: 'Facebook OAuth login (not natively supported in Lovable Cloud)',
  },

  // Experimental
  BETA_MAP_VIEW: {
    key: 'beta_map_view',
    enabled: true,
    description: 'New map-based property search',
    rolloutPercentage: 100,
  },

  // Verticals — kill-switch for each business vertical
  VERTICAL_PROPERTY: {
    key: 'vertical_property',
    enabled: true,
    description: 'Property rental & sales vertical',
  },
  VERTICAL_RESTAURANTS: {
    key: 'vertical_restaurants',
    enabled: true,
    description: 'Restaurants vertical',
  },
  VERTICAL_FLOWERS: {
    key: 'vertical_flowers',
    enabled: true,
    description: 'Flowers & gifts vertical',
  },
  VERTICAL_YACHTS: {
    key: 'vertical_yachts',
    enabled: true,
    description: 'Yacht charters vertical',
  },
  VERTICAL_EXPERIENCES: {
    key: 'vertical_experiences',
    enabled: true,
    description: 'Tours & experiences vertical',
  },

  // Global access gate — when ON, anonymous visitors bypass ComingSoonGate
  // and can access all routes without login. Toggle from Admin → System → Flags.
  PUBLIC_ACCESS: {
    key: 'public_access',
    enabled: false,
    description: 'Open the entire app to anonymous visitors (disables Coming Soon gate)',
  },
} as const;

/**
 * Get current environment
 */
function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  if (import.meta.env.DEV) return 'development';
  if (window.location.hostname.includes('preview')) return 'staging';
  return 'production';
}

/**
 * Generate consistent hash for user ID
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash % 100);
}

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(
  flagKey: keyof typeof FLAGS,
  options?: {
    userId?: string;
    userRoles?: string[];
  }
): boolean {
  const flag = FLAGS[flagKey];
  if (!flag) {
    logger.warn(`[FeatureFlags] Unknown flag: ${flagKey}`);
    return false;
  }

  // Check base enabled status
  if (!flag.enabled) return false;

  // Check environment restrictions
  if (flag.environments && flag.environments.length > 0) {
    const env = getCurrentEnvironment();
    if (!flag.environments.includes(env)) return false;
  }

  // Check role restrictions
  if (flag.allowedRoles && flag.allowedRoles.length > 0) {
    const userRoles = options?.userRoles || [];
    const hasAllowedRole = flag.allowedRoles.some(role => userRoles.includes(role));
    if (!hasAllowedRole) return false;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    if (!options?.userId) {
      // No user ID - use random for anonymous users
      return Math.random() * 100 < flag.rolloutPercentage;
    }
    const userHash = hashUserId(options.userId);
    return userHash < flag.rolloutPercentage;
  }

  return true;
}

/**
 * Get all flags with their current status
 */
export function getAllFlags(options?: {
  userId?: string;
  userRoles?: string[];
}): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const key of Object.keys(FLAGS) as (keyof typeof FLAGS)[]) {
    result[key] = isFeatureEnabled(key, options);
  }
  return result;
}

/**
 * Feature flag keys for type safety
 */
export type FeatureFlagKey = keyof typeof FLAGS;

/**
 * React hook for feature flags
 */
export { FLAGS as FEATURE_FLAGS };
