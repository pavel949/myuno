import { describe, expect, it } from 'vitest';
import { auditCatalogHierarchy, resolveCatalogPlacement } from './catalogHierarchy';
const groups = [{ id: 'arrive', is_active: true }, { id: 'legal', is_active: true }];
const transport = { id: 'transport', slug: 'cat-transport', parent_id: null, group_id: 'arrive', is_active: true };
const finance = { id: 'finance', slug: 'cat-finance', parent_id: null, group_id: 'legal', is_active: true };
const exchange = { id: 'exchange-id', slug: 'exchange', parent_id: 'transport', group_id: 'arrive', is_active: true };
const nodes = [transport, finance, exchange];
describe('catalog placement', () => {
  it('moves currency rates into finance without altering identity or route', () => {
    expect(resolveCatalogPlacement(exchange, { ...exchange, parent_id: 'finance' }, nodes, groups)).toEqual({ parent_id: 'finance', group_id: 'legal' });
  });
  it('moves a root into another section', () => {
    expect(resolveCatalogPlacement(finance, { ...finance, group_id: 'arrive' }, nodes, groups)).toEqual({ parent_id: null, group_id: 'arrive' });
  });
  it.each(['exchange-id', 'missing'])('rejects invalid parent %s', parent_id => {
    expect(() => resolveCatalogPlacement(exchange, { ...exchange, parent_id }, nodes, groups)).toThrow();
  });
  it('does not let a root become a leaf or create a nested hierarchy', () => {
    expect(() => resolveCatalogPlacement(finance, { ...finance, parent_id: 'transport' }, nodes, groups)).toThrow();
    expect(() => resolveCatalogPlacement(exchange, { ...exchange, parent_id: 'finance' }, [transport, { ...finance, parent_id: 'transport' }, exchange], groups)).toThrow();
  });
  it('reports structural defects, not claims about verified providers', () => {
    expect(auditCatalogHierarchy(nodes, groups)).toEqual([]);
    expect(auditCatalogHierarchy([{ ...exchange, parent_id: 'missing' }], groups)).toContainEqual({ id: exchange.id, reason: 'missing-parent' });
    expect(auditCatalogHierarchy([{ ...transport, is_active: false }, exchange], groups)).toContainEqual({ id: exchange.id, reason: 'inactive-parent' });
  });
});
