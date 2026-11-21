/** Review only: a catalogue row is never a physical property. */
export type ProjectUnitIdentityRow = {
  id: string;
  unit_code: string;
  property_id: string | null;
  properties: { id: string; project_id: string | null; unit_number: string | null } | null;
};

export function reviewProjectUnitIdentity(row: ProjectUnitIdentityRow, projectId: string) {
  if (!row.property_id) return { status: 'unlinked', propertyId: null } as const;
  const property = row.properties;
  if (!property || property.id !== row.property_id) return { status: 'unverified', propertyId: null } as const;
  if (property.project_id !== projectId) return { status: 'other-project', propertyId: null } as const;
  const normalize = (value: string | null) => value?.trim().toLowerCase() || '';
  const code = normalize(row.unit_code);
  const status = code && code === normalize(property.unit_number) ? 'exact' : 'check-code';
  return { status, propertyId: property.id } as const;
}
