/**
 * Properties repository — data-access entry point for the property domain.
 *
 * Reference implementation of the `src/data/` contract (see src/data/README.md).
 * The property hooks already follow the canonical TanStack pattern, so this
 * module re-exports them as the single, discoverable import surface:
 *
 *   import { useProperties, useProperty } from '@/data/repositories/properties/queries';
 *
 * Over Increment 2 the hook bodies move here from `src/hooks/useProperties.ts`
 * and that file becomes a thin re-export, then is removed. Consumers that import
 * from this path will not need to change.
 */

export {
  useProperties,
  usePropertiesInfinite,
  useProperty,
  usePropertyWithRentalTerms,
  useFeaturedProperties,
  useInstantBookingProperties,
  usePropertiesCount,
  usePropertiesByProject,
  useProjectStats,
  usePropertiesForMap,
  transformPropertiesToMarkers,
} from '@/hooks/useProperties';

export type {
  Property,
  PropertyProject,
  PropertyRentalTerms,
  PropertyFilters,
  PropertyMapItem,
} from '@/hooks/useProperties';
