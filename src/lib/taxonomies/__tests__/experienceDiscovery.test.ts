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

import { experienceCategoryLabel, populatedExperienceCategories } from '../experienceDiscovery';
it('keeps aquarium and escape-room identities distinct and admits only populated topics', () => {
 const categories = [{ slug: 'aquarium', name_ru: 'Океанариумы', name_en: 'Aquariums' }, { slug: 'escape-room', name_ru: 'Квест-комната', name_en: 'Escape Room' }];
 expect(populatedExperienceCategories(categories, [{ category: 'aquarium' }])).toEqual([categories[0]]);
 expect(populatedExperienceCategories(categories, [])).toEqual([]);
 expect(categories).toHaveLength(2); // Admin registry is not mutated by public projection.
 expect(experienceCategoryLabel(categories[0], 'ru')).toBe('Океанариумы');
 expect(experienceCategoryLabel(categories[0], 'en')).toBe('Aquariums');
 expect(experienceCategoryLabel(categories[0], 'th')).toBe('พิพิธภัณฑ์สัตว์น้ำ');
 expect(experienceCategoryLabel({ slug: 'custom', name_ru: 'Особая тема', name_en: 'Custom topic' }, 'th')).toBe('Custom topic');
 expect(experienceGroup('shows')).toBe('culture');
});
