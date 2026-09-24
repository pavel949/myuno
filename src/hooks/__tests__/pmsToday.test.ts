import { describe, it, expect } from 'vitest';
import { deriveUnitState } from '../usePmsToday';
const base = { inHouse: false, departedToday: false, openMaintenance: false, openCleaning: false, cleanedToday: false };
describe('deriveUnitState', () => {
  it('maintenance wins over everything', () => expect(deriveUnitState({ ...base, inHouse: true, openMaintenance: true })).toBe('maintenance'));
  it('in-house is occupied', () => expect(deriveUnitState({ ...base, inHouse: true })).toBe('occupied'));
  it('departure without cleaning is dirty', () => expect(deriveUnitState({ ...base, departedToday: true })).toBe('dirty'));
  it('departure cleaned today is clean', () => expect(deriveUnitState({ ...base, departedToday: true, cleanedToday: true })).toBe('clean'));
  it('open cleaning request is dirty', () => expect(deriveUnitState({ ...base, openCleaning: true })).toBe('dirty'));
  it('default is clean', () => expect(deriveUnitState(base)).toBe('clean'));
});
