/** Existing categories table: root category → leaf destination. No new taxonomy. */
export interface CatalogNode {
  id: string;
  slug: string;
  parent_id: string | null;
  group_id: string | null;
  is_active: boolean;
}
export interface CatalogGroup { id: string; is_active: boolean }

/** Validate before writing; DB RLS remains the authority for the actor. */
export function resolveCatalogPlacement(original: CatalogNode, draft: CatalogNode, nodes: CatalogNode[], groups: CatalogGroup[]) {
  if (Boolean(original.parent_id) !== Boolean(draft.parent_id)) throw new Error('Changing a category into a service (or the reverse) is not supported.');
  if (draft.parent_id) {
    const parent = nodes.find(node => node.id === draft.parent_id);
    if (!parent || parent.id === draft.id || parent.parent_id) throw new Error('Choose a top-level category.');
    if (draft.parent_id !== original.parent_id && !parent.is_active) throw new Error('Choose an active category.');
    if (!parent.group_id || !groups.some(group => group.id === parent.group_id)) throw new Error('The category has no valid section.');
    return { parent_id: parent.id, group_id: parent.group_id };
  }
  if (!draft.group_id || !groups.some(group => group.id === draft.group_id && (group.is_active || group.id === original.group_id))) throw new Error('Choose an active section.');
  return { parent_id: null, group_id: draft.group_id };
}

export function auditCatalogHierarchy(nodes: CatalogNode[], groups: CatalogGroup[]) {
  const issues: { id: string; reason: 'missing-parent' | 'nested-parent' | 'missing-section' | 'inactive-parent' | 'duplicate-slug' }[] = [];
  const byId = new Map(nodes.map(node => [node.id, node]));
  const counts = new Map<string, number>();
  for (const node of nodes) counts.set(node.slug, (counts.get(node.slug) ?? 0) + 1);
  for (const node of nodes) {
    if ((counts.get(node.slug) ?? 0) > 1) issues.push({ id: node.id, reason: 'duplicate-slug' });
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (node.parent_id && !parent) issues.push({ id: node.id, reason: 'missing-parent' });
    else if (parent?.parent_id) issues.push({ id: node.id, reason: 'nested-parent' });
    else if (node.is_active && parent && !parent.is_active) issues.push({ id: node.id, reason: 'inactive-parent' });
    const groupId = parent?.group_id ?? node.group_id;
    if (!groups.some(group => group.id === groupId)) issues.push({ id: node.id, reason: 'missing-section' });
  }
  return issues;
}
