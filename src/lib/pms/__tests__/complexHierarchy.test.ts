import { describe, expect, it } from 'vitest';
import {
  buildComplexHierarchy,
  familyRootId,
  isFamilyConflict,
  type KeyProperty,
} from '../complexHierarchy';

function key(id: string, parentId: string | null = null, over: Partial<KeyProperty> = {}): KeyProperty {
  return {
    id,
    parentId,
    projectId: 'proj-1',
    ownerId: null,
    unitNumber: id,
    title: `Unit ${id}`,
    titleRu: null,
    isBookable: true,
    isActive: true,
    pricePerNight: 5000,
    currency: 'THB',
    ...over,
  };
}

/** 25 whole villas + 14 split villas (13 x 5 rooms + 1 x 4 rooms) = 39 villas / 94 keys. */
function layanTaraFixture(): KeyProperty[] {
  const rows: KeyProperty[] = [];
  for (let i = 1; i <= 25; i++) rows.push(key(`W${i}`));
  for (let i = 1; i <= 14; i++) {
    const villaId = `S${i}`;
    rows.push(key(villaId, null, { isBookable: false }));
    const rooms = i <= 13 ? 5 : 4;
    for (let r = 1; r <= rooms; r++) rows.push(key(`${villaId}-R${r}`, villaId));
  }
  return rows;
}

describe('buildComplexHierarchy', () => {
  it('should count 94 keys when given the 39-villa fixture', () => {
    const h = buildComplexHierarchy(layanTaraFixture());
    expect(h.keyCount).toBe(94);
  });

  it('should count 39 villas when given the 39-villa fixture', () => {
    const h = buildComplexHierarchy(layanTaraFixture());
    expect(h.villaCount).toBe(39);
  });

  it('should report no issues for a clean fixture', () => {
    const h = buildComplexHierarchy(layanTaraFixture());
    expect(h.issues).toEqual([]);
  });

  it('should list the villa row itself as the single key of a whole villa', () => {
    const h = buildComplexHierarchy(layanTaraFixture());
    const node = h.villas.find((v) => v.villa.id === 'W1');
    expect(node?.keys.map((k) => k.id)).toEqual(['W1']);
  });

  it('should list only child rooms as keys of a non-bookable split villa', () => {
    const h = buildComplexHierarchy(layanTaraFixture());
    const node = h.villas.find((v) => v.villa.id === 'S1');
    expect(node?.keys).toHaveLength(5);
  });

  it('should count a split villa row when it is itself bookable', () => {
    const rows = [key('V'), key('V-R1', 'V'), key('V-R2', 'V')];
    const h = buildComplexHierarchy(rows);
    expect(h.keyCount).toBe(3);
  });

  it('should include the bookable villa row in its VillaNode keys', () => {
    const rows = [key('V'), key('V-R1', 'V'), key('V-R2', 'V')];
    const node = buildComplexHierarchy(rows).villas[0];
    expect(node.keys.map((k) => k.id).sort()).toEqual(['V', 'V-R1', 'V-R2']);
  });

  it('should not count inactive rows as keys', () => {
    const rows = [key('A'), key('B', null, { isActive: false })];
    expect(buildComplexHierarchy(rows).keyCount).toBe(1);
  });

  it('should flag orphan_parent when the parent id does not exist', () => {
    const h = buildComplexHierarchy([key('R1', 'ghost')]);
    expect(h.issues).toContainEqual({ code: 'orphan_parent', propertyId: 'R1' });
  });

  it('should flag a cycle when two rows are each other\'s parent', () => {
    const h = buildComplexHierarchy([key('A', 'B'), key('B', 'A')]);
    expect(h.issues.some((i) => i.code === 'cycle')).toBe(true);
  });

  it('should not throw or loop forever on a cycle', () => {
    expect(() => buildComplexHierarchy([key('A', 'B'), key('B', 'A')])).not.toThrow();
  });

  it('should flag depth_exceeded for a grandchild', () => {
    const h = buildComplexHierarchy([key('V'), key('R', 'V'), key('G', 'R')]);
    expect(h.issues).toContainEqual({ code: 'depth_exceeded', propertyId: 'G' });
  });
});

describe('familyRootId', () => {
  it('should return the parent id for a child', () => {
    expect(familyRootId({ id: 'R', parentId: 'V' })).toBe('V');
  });

  it('should return own id for a root', () => {
    expect(familyRootId({ id: 'V', parentId: null })).toBe('V');
  });
});

describe('isFamilyConflict', () => {
  const villa = key('V');
  const roomA = key('RA', 'V');
  const roomB = key('RB', 'V');
  const otherVillaRoom = key('RX', 'V2');

  it('should be true for villa vs its room', () => {
    expect(isFamilyConflict(villa, roomA)).toBe(true);
  });

  it('should be true for room vs its villa', () => {
    expect(isFamilyConflict(roomA, villa)).toBe(true);
  });

  it('should be false for sibling rooms', () => {
    expect(isFamilyConflict(roomA, roomB)).toBe(false);
  });

  it('should be false for a villa vs another villa\'s room', () => {
    expect(isFamilyConflict(villa, otherVillaRoom)).toBe(false);
  });

  it('should be true for the same id', () => {
    expect(isFamilyConflict(roomA, { ...roomA })).toBe(true);
  });
});
