/**
 * useLifeSituations - Hook for Life Situations meta-layer
 * 
 * @deprecated Use useLifeOS.ts for enhanced LIFE OS functionality
 * This file is maintained for backward compatibility only.
 * All new code should import from '@/hooks/useLifeOS'
 */

// Re-export everything from the new LIFE OS hook for backward compatibility
export {
  useLifeSituations,
  useResolveLifeSituation,
  useAdminLifeSituations,
  useAdminCatalogMappings,
  type LifeSituation,
  type CatalogLifeMap,
} from './useLifeOS';

// Also export new LIFE OS features for gradual migration
export {
  useResolveLifeOSContext,
  useLifeOSRole,
  getLifeOSAIContext,
  type LifeOSCatalogItem,
  type LifeOSRole,
} from './useLifeOS';
