import { describe, expect, it } from 'vitest';
import { auditLifeMappings } from './lifeMappingQuality';
const row = { id: '1', entity_id: 'place', entity_type: 'experience', life_situation_id: 'family', weight: 90, life_situations: { code: 'family', title_en: 'Family', title_ru: 'Семья', is_active: true } };
describe('LifeOS structural audit', () => {
  it('does not infer provider verification from weight', () => {
    const result = auditLifeMappings([row])[0];
    expect(result.issues).toEqual([]);
    expect(result).not.toHaveProperty('verified_count');
  });
  it('finds missing and inactive situations and invalid weights', () => {
    expect(auditLifeMappings([{ ...row, life_situations: null, weight: NaN }])[0].issues).toEqual(['missing-situation', 'invalid-weight']);
    expect(auditLifeMappings([{ ...row, life_situations: { ...row.life_situations, is_active: false } }])[0].issues).toEqual(['inactive-situation']);
  });
  it('reports duplicate links without mutating them', () => {
    expect(auditLifeMappings([row, { ...row, id: '2' }])[1].issues).toEqual(['duplicate-link']);
  });
});
