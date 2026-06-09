/**
 * Vertical Spec registry.
 * Add new verticals here as we ship Waves 1-4.
 */
import type { VerticalSpec } from './types';
import { restaurantSpec } from './restaurant';
import { propertySpec } from './property';
import { yachtSpec } from './yacht';

export const verticalSpecs: Record<string, VerticalSpec> = {
  restaurant: restaurantSpec,
  property: propertySpec,
  yacht: yachtSpec,
};

export function getVerticalSpec(id: string): VerticalSpec | undefined {
  return verticalSpecs[id];
}

export function listVerticalSpecs(): VerticalSpec[] {
  return Object.values(verticalSpecs);
}

export type { VerticalSpec } from './types';
export * from './types';
