import { describe, expect, it } from 'vitest';
import { catalogServiceLifeId, publicServiceSituationCodes } from './serviceSituationLinks';
const entity_id = catalogServiceLifeId('exchange')!;
const link = { entity_id, role_scope: null, life_situations: { code: 'arrival', is_active: true } };
describe('admin-edited service situation links', () => {
  it('uses the persisted links and reflects add/delete without static resurrection', () => {
    expect(publicServiceSituationCodes({ id: 'exchange' }, [link])).toEqual(['arrival']);
    expect(publicServiceSituationCodes({ id: 'exchange' }, [])).toEqual([]);
  });
  it('honours inactive situations, public role admission and exact identities', () => {
    expect(publicServiceSituationCodes({ id: 'exchange' }, [{ ...link, role_scope: ['owner'] }])).toEqual([]);
    expect(publicServiceSituationCodes({ id: 'exchange' }, [{ ...link, role_scope: [] }])).toEqual([]);
    expect(publicServiceSituationCodes({ id: 'exchange' }, [{ ...link, life_situations: { code: 'arrival', is_active: false } }])).toEqual([]);
    expect(publicServiceSituationCodes({ id: 'unknown' }, [link])).toEqual([]);
  });
  it('supports new persisted service identities without changing legacy ones', () => {
    expect(catalogServiceLifeId('new-service', 'new-uuid')).toBe('new-uuid');
    expect(catalogServiceLifeId('exchange', 'category-uuid')).toBe(entity_id);
    expect(publicServiceSituationCodes({ id: 'new-service', catalogRowId: 'new-uuid' }, [{ ...link, entity_id: 'new-uuid' }])).toEqual(['arrival']);
  });
  it('preserves the declared static seed identity across verified live slug aliases', () => {
    expect(catalogServiceLifeId('restaurants')).toBe(catalogServiceLifeId('restaurant'));
    expect(catalogServiceLifeId('education-expat')).toBe(catalogServiceLifeId('education'));
    expect(catalogServiceLifeId('beauty-spa')).toBe(catalogServiceLifeId('beauty'));
  });
});
