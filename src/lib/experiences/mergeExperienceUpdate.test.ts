import { describe, expect, it } from 'vitest';
import { mergeExperienceUpdate } from './mergeExperienceUpdate';
describe('partial experience edits', () => {
  it('preserves hidden metadata and coordinates while accepting explicit clearing', () => {
    const result = mergeExperienceUpdate({ attributes: { status: 'draft', booking_model: 'concierge', source: 'verified', start_times: ['08:00'] } }, { name_en: 'Updated', lat: undefined, attributes: { status: undefined, start_times: [], booking_url: null } });
    expect(result).toEqual({ name_en: 'Updated', attributes: { status: 'draft', booking_model: 'concierge', source: 'verified', start_times: [], booking_url: null } });
    expect(result).not.toHaveProperty('lat');
  });
});
