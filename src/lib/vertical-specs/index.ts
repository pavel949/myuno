/**
 * Vertical Spec registry.
 * Add new verticals here as we ship Waves 1-4.
 */
import type { VerticalSpec } from './types';
import { restaurantSpec } from './restaurant';
import { propertySpec } from './property';
import { yachtSpec } from './yacht';
import { beautySpec } from './beauty';
import { fitnessSpec } from './fitness';
import { tourSpec } from './tour';
import { transportSpec } from './transport';

export const verticalSpecs: Record<string, VerticalSpec> = {
  restaurant: restaurantSpec,
  property: propertySpec,
  yacht: yachtSpec,
  beauty: beautySpec,
  fitness: fitnessSpec,
  tour: tourSpec,
  transport: transportSpec,
};

export function getVerticalSpec(id: string): VerticalSpec | undefined {
  return verticalSpecs[id];
}

export function listVerticalSpecs(): VerticalSpec[] {
  return Object.values(verticalSpecs);
}

export type { VerticalSpec } from './types';
export * from './types';
