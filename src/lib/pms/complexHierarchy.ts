export interface KeyProperty {
  id: string;
  parentId: string | null;
  projectId: string | null;
  ownerId: string | null;
  unitNumber: string | null;
  title: string;
  titleRu: string | null;
  isBookable: boolean;
  isActive: boolean;
  pricePerNight: number | null;
  currency: string;
}
export interface VillaNode { villa: KeyProperty; keys: KeyProperty[]; wholeVillaBookable: boolean }
export type HierarchyIssueCode =
  | 'orphan_parent'
  | 'cycle'
  | 'depth_exceeded'
  | 'no_bookable_keys'
  | 'inactive_parent_active_child';
export interface HierarchyIssue { code: HierarchyIssueCode; propertyId: string }
export interface ComplexHierarchy {
  villas: VillaNode[];
  villaCount: number;
  keyCount: number;
  issues: HierarchyIssue[];
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

function compareKeys(a: KeyProperty, b: KeyProperty): number {
  return collator.compare(a.unitNumber ?? '￿', b.unitNumber ?? '￿') || collator.compare(a.title, b.title);
}

function detectCycle(start: KeyProperty, byId: ReadonlyMap<string, KeyProperty>): boolean {
  const seen = new Set<string>([start.id]);
  let cur = start.parentId ? byId.get(start.parentId) : undefined;
  while (cur) {
    if (seen.has(cur.id)) return true;
    seen.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return false;
}

function classifyRow(p: KeyProperty, byId: ReadonlyMap<string, KeyProperty>): HierarchyIssue | null {
  if (!p.parentId) return null;
  const parent = byId.get(p.parentId);
  if (!parent) return { code: 'orphan_parent', propertyId: p.id };
  if (detectCycle(p, byId)) return { code: 'cycle', propertyId: p.id };
  if (parent.parentId) return { code: 'depth_exceeded', propertyId: p.id };
  return null;
}

function buildVillaNode(villa: KeyProperty, children: KeyProperty[]): VillaNode {
  const sellable = (p: KeyProperty) => p.isBookable && p.isActive;
  const keys = [...(sellable(villa) ? [villa] : []), ...children.filter(sellable).sort(compareKeys)];
  return { villa, keys, wholeVillaBookable: sellable(villa) };
}

export function buildComplexHierarchy(rows: readonly KeyProperty[]): ComplexHierarchy {
  const byId = new Map(rows.map(r => [r.id, r] as const));
  const issues: HierarchyIssue[] = [];
  const childrenOf = new Map<string, KeyProperty[]>();
  for (const row of rows) {
    const issue = classifyRow(row, byId);
    if (issue) { issues.push(issue); continue; }
    if (!row.parentId) continue;
    childrenOf.set(row.parentId, [...(childrenOf.get(row.parentId) ?? []), row]);
  }
  const roots = rows.filter(r => !r.parentId).sort(compareKeys);
  const villas = roots.map(v => buildVillaNode(v, childrenOf.get(v.id) ?? []));
  for (const node of villas) {
    const kids = childrenOf.get(node.villa.id) ?? [];
    if (node.keys.length === 0) issues.push({ code: 'no_bookable_keys', propertyId: node.villa.id });
    if (!node.villa.isActive) {
      for (const k of kids.filter(c => c.isActive)) {
        issues.push({ code: 'inactive_parent_active_child', propertyId: k.id });
      }
    }
  }
  const keyCount = rows.filter(r => r.isActive && r.isBookable).length;
  return { villas, villaCount: roots.length, keyCount, issues };
}

export function familyRootId(p: Pick<KeyProperty, 'id' | 'parentId'>): string {
  return p.parentId ?? p.id;
}

export function isFamilyConflict(a: KeyProperty, b: KeyProperty): boolean {
  return a.id === b.id || a.parentId === b.id || b.parentId === a.id;
}
