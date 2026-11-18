import { describe, expect, it } from 'vitest';
import { EXPERIENCE_DISCOVERY_GROUPS, DISCOVERY_TOPIC_LABELS, discoveryTopic, experienceGroup, isClosedExperience, isFixedVenue } from '../experienceDiscovery';
describe('experience discovery classification (not inventory)', () => {
 it('classifies legacy aliases without rewriting canonical slugs', () => {
  expect(experienceGroup('islands')).toBe('sea'); expect(experienceGroup('island-hopping')).toBe('sea');
  expect(discoveryTopic('sea_canoe')).toBe('kayaking');
  expect(experienceGroup('unconfigured-category')).toBeUndefined();
 });
 it('covers every prospective topic without duplicates or invented supply', () => {
  const slugs = EXPERIENCE_DISCOVERY_GROUPS.flatMap(group => [...group.categories]);
  expect(new Set(slugs).size).toBe(slugs.length);
  for (const slug of slugs) expect(DISCOVERY_TOPIC_LABELS[discoveryTopic(slug)]?.ru).toBeTruthy();
 });
 it('requires explicit place identity, not category inference', () => {
  expect(isFixedVenue({catalog_kind:'venue',location_type:'fixed_venue'})).toBe(true);
  expect(isFixedVenue({catalog_kind:'venue'})).toBe(false);
  expect(isFixedVenue({location_type:'fixed_venue',catalog_kind:'programme'})).toBe(false);
 });
 it('excludes explicitly closed places without asserting unknown is open', () => {
  expect(isClosedExperience(' Temporarily_Closed ')).toBe(true);
  expect(isClosedExperience('permanently_closed')).toBe(true);
  expect(isClosedExperience(null)).toBe(false);
 });
});
