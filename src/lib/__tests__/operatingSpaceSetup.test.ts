import { describe, expect, it } from 'vitest';
import { parseOperatingSpaceSetup } from '../operatingSpaceSetup';
const space = '11111111-1111-4111-8111-111111111111';
const member = '22222222-2222-4222-8222-222222222222';
const property = '33333333-3333-4333-8333-333333333333';
const empty = () => ({ can_manage: true, spaces: [], members: [], properties: [], assignments: [], grants: [] });
const snapshot = () => ({ ...empty(),
  spaces: [{ id: space, key: 'synthetic', name_en: 'Synthetic', name_ru: 'Тест', is_active: true }],
  members: [{ id: member, user_id: member, role: 'manager', display_name: null, is_active: true }],
  properties: [{ id: property, title_en: null, title_ru: null, parent_property_id: null, room_category_id: null }],
  assignments: [{ property_id: property, operating_space_id: space }],
  grants: [{ company_member_id: member, operating_space_id: space, is_active: true }],
});
describe('operating space setup trust boundary', () => {
  it('accepts empty authorized setup without manufacturing rows', () => expect(parseOperatingSpaceSetup(empty())).toEqual(empty()));
  it('preserves explicit persisted assignments and inactive grants', () => {
    const value = snapshot(); value.grants[0].is_active = false;
    expect(parseOperatingSpaceSetup(value)).toEqual(value);
  });
  it.each([null, {}, { ...empty(), can_manage: false }, { ...empty(), spaces: null }, { ...empty(), members: [{ id: 'bad' }] }])('rejects malformed or unauthorized response %j', value => {
    expect(() => parseOperatingSpaceSetup(value)).toThrow();
  });
  it('rejects duplicate source IDs and ambiguous repeated relationships', () => {
    for (const field of ['spaces', 'members', 'properties', 'assignments', 'grants'] as const) {
      const value = snapshot();
      const duplicated = { ...value, [field]: [...value[field], ...value[field]] };
      expect(() => parseOperatingSpaceSetup(duplicated)).toThrow();
    }
  });
  it('rejects unknown linked members, properties and spaces', () => {
    const value = snapshot();
    expect(() => parseOperatingSpaceSetup({ ...value, members: [] })).toThrow();
    expect(() => parseOperatingSpaceSetup({ ...value, properties: [] })).toThrow();
    expect(() => parseOperatingSpaceSetup({ ...value, spaces: [] })).toThrow();
  });
});
