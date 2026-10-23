import { z } from 'zod';

const id = z.string().uuid();
export const operatingSpaceSchema = z.object({
  id, key: z.string(), name_en: z.string(), name_ru: z.string(), is_active: z.boolean(),
});
const setupSchema = z.object({
  can_manage: z.literal(true),
  spaces: z.array(operatingSpaceSchema),
  members: z.array(z.object({
    id, user_id: id, role: z.string(), is_active: z.boolean(), display_name: z.string().nullable(),
  })),
  properties: z.array(z.object({
    id, title_en: z.string().nullable(), title_ru: z.string().nullable(),
    parent_property_id: id.nullable(), room_category_id: id.nullable(),
  })),
  assignments: z.array(z.object({ property_id: id, operating_space_id: id })),
  grants: z.array(z.object({ company_member_id: id, operating_space_id: id, is_active: z.boolean() })),
});
export type OperatingSpaceSetup = z.infer<typeof setupSchema>;
export type OperatingSpace = z.infer<typeof operatingSpaceSchema>;
export type SpaceInput = { id?: string; key: string; name_en: string; name_ru: string; is_active: boolean };
export type SpaceCommand =
  | { type: 'save'; space: SpaceInput }
  | { type: 'grant'; spaceId: string; memberId: string; active: boolean }
  | { type: 'assign'; spaceId: string; propertyIds: string[]; reason: string };

export function parseOperatingSpaceSetup(value: unknown): OperatingSpaceSetup {
  const setup = setupSchema.parse(value);
  const spaces = new Set(setup.spaces.map(row => row.id));
  const members = new Set(setup.members.map(row => row.id));
  const properties = new Set(setup.properties.map(row => row.id));
  if (spaces.size !== setup.spaces.length || members.size !== setup.members.length || properties.size !== setup.properties.length ||
      new Set(setup.assignments.map(row => row.property_id)).size !== setup.assignments.length ||
      new Set(setup.grants.map(row => `${row.operating_space_id}:${row.company_member_id}`)).size !== setup.grants.length ||
      setup.assignments.some(row => !spaces.has(row.operating_space_id) || !properties.has(row.property_id)) ||
      setup.grants.some(row => !spaces.has(row.operating_space_id) || !members.has(row.company_member_id))) {
    throw new Error('Invalid operating space setup response');
  }
  return setup;
}

