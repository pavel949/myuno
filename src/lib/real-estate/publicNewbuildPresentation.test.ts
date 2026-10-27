import { describe, expect, it } from 'vitest';
import { publicNewbuildPresentation, publicNewbuildUnit, projectStartingPrice, projectStartingPriceText } from './publicNewbuildPresentation';
import { surfaceFromOffplanProject } from './listingViewModel';
import type { OffplanProject } from '@/hooks/useOffplanProjects';

describe('public project commercial presentation', () => {
  it('preserves the editable THB starting price without asserting performance or availability', () => {
    const source = Object.freeze({ id: 'canonical', price_from: 8_000_000, price_from_thb: 9_000_000, price_to: 20_000_000, project_status: 'completed', construction_progress: 100, completion_date: '2027-01-01', units_available: 12, units_sold: 30, roi_projected: 8, yield_estimate: '8%', risk_level: 'low', offplan_catalog: { rec: 'BUY', comp_y: 2027 } });
    const result = publicNewbuildPresentation(source);
    expect(result).toMatchObject({ id: 'canonical', price_from: 8_000_000, priceFrom: 8_000_000, price_to: null, project_status: null, construction_progress: null, completion_date: null, units_available: null, units_sold: null, roi_projected: null, risk_level: null, yield_estimate: null, offplan_catalog: null });
    expect(source.project_status).toBe('completed');
    expect(source.price_from).toBe(8_000_000);
  });
  it.each([null, undefined, 0, -1, NaN, Infinity, '8000000'])('does not resurrect an invalid editable price %s from an old alias', value => {
    expect(projectStartingPrice(value)).toBeNull();
    expect(publicNewbuildPresentation({ price_from: value, price_from_thb: 9_000_000 }).price_from).toBeNull();
  });
  it('keeps the unified card surface on the same starting-price contract', () => {
    const source = { id: 'project', nameEn: 'Actual project', priceFrom: 8_000_000, projectStatus: 'completed', muunoScore: 98 } as OffplanProject;
    expect(surfaceFromOffplanProject(source)).toMatchObject({ priceHintThb: 8_000_000, priceMode: 'from_project', lifecycle: null, muunoScore: null });
  });
  it('never computes a project minimum from unqualified unit rows or currencies', () => {
    const unit = { id: 'unit', project_id: 'project', currency: 'USD', price: 20, status: 'available', available_units: 1 };
    expect(publicNewbuildUnit(unit)).toMatchObject({ id: 'unit', currency: 'USD', price: null, status: null, available_units: null });
    expect(publicNewbuildPresentation({ id: 'project', price_from: null, units: [unit] }).price_from).toBeNull();
  });
  it.each(['en', 'ru', 'th'])('always labels provisional prices and their THB unit in %s', language => {
    const label = projectStartingPriceText(8_000_000, language);
    expect(label).toContain('THB');
    expect(label).toContain(language === 'ru' ? 'Цена требует уточнения' : language === 'th' ? 'ต้องยืนยันราคา' : 'Price requires confirmation');
  });
});
